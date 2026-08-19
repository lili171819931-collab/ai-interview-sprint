import type { AihotStory, StoryHeatAnalysis, StoryHeatPoint, StoryRecommendation, StorySearchLogic, StoryView } from "./story-types";
import type { AihotItem } from "./aihot-types";
import { displayHeat } from "./hot-rank";
import { hoursAgo } from "./time";
import { buildRecommendReason } from "./recommend";

const HALF_LIFE_HOURS = 24;

/** 从 AIHOT 故事链接中提取 publicId（UUID） */
export function extractStoryPublicId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
  return m ? m[1].toLowerCase() : null;
}

/** 从标题提取实体关键词：模型名 / 产品名 / 编号 + 中文领域名词 */
const ZH_NOUNS = [
  "智能体", "语音合成", "语音", "编程", "框架", "引擎", "平台", "开源", "产品", "工具",
  "会话", "维护", "控制", "助手", "代理", "任务", "服务", "远程", "侧边栏", "网页", "游戏",
  "代码", "应用",
];
const ZH_SKIP = new Set([
  "发布", "推出", "上线", "正式", "版本", "模型", "功能", "能力", "大幅", "增强", "升级",
  "新版", "预览", "测试", "支持", "亮相", "官方", "首款", "最强", "工作", "以及", "相关",
  "报道", "新闻", "事件", "今天", "今日", "开源", "应用",
]);

export function extractKeywords(title: string): string[] {
  const out = new Set<string>();
  const entityRe =
    /([A-Za-z][A-Za-z0-9]*(?:[-.][A-Za-z0-9]+)*(?:\s+\d+(?:\.\d+)?(?:\s*[A-Za-z][A-Za-z0-9]*)*)?)/g;
  let m: RegExpExecArray | null;
  while ((m = entityRe.exec(title))) {
    const tok = m[1].trim();
    if (tok.length < 2 || /^(the|a|an|of|for|with|and|new|app|ai|in|on|at|to)$/i.test(tok)) continue;
    out.add(tok);
  }
  // 中文领域名词（直配，避免滑动窗口噪声）
  const zhRe = new RegExp(ZH_NOUNS.join("|"), "g");
  while ((m = zhRe.exec(title))) {
    const tok = m[0];
    if (!ZH_SKIP.has(tok)) out.add(tok);
  }
  return [...out].slice(0, 10);
}


function sourceKind(name: string): string {
  if (/^X[:：]/.test(name)) return "X / Twitter";
  if (/公众号/.test(name)) return "公众号";
  if (/Blog|博客|RSS|News|日报/i.test(name)) return "博客 / RSS";
  if (/官网|官方|API/.test(name)) return "官方渠道";
  return "媒体 / 其他";
}

function buildSourceBreakdown(names: string[]): { kind: string; count: number }[] {
  const map = new Map<string, number>();
  for (const n of names) {
    const kind = sourceKind(n);
    map.set(kind, (map.get(kind) || 0) + 1);
  }
  return [...map.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);
}

/** 本地搜索逻辑：检索词 / 检索范围 / 匹配策略（不依赖 AIHOT 内部实现） */
export function buildSearchLogic(story: AihotStory, sourceNames: string[], itemTitle?: string): StorySearchLogic {
  const keywords = extractKeywords(itemTitle || story.title);
  const sources = sourceNames.length ? sourceNames : story.reports.map((r) => r.source.name);
  const windowLabel = `${Math.max(1, Math.ceil(hoursAgo(story.firstReportAt) / 24))} 天窗口`;
  return {
    keywords,
    scope: `覆盖 ${sources.length} 个公开信源（X / 公众号 / 博客 RSS / 官方渠道 / 媒体）`,
    strategy: `以「${keywords.slice(0, 4).join("、")}」为核心检索词扫描公开信源，按标题实体共现与发布时间窗口聚类，命中 ${
      story.reports.length
    } 篇报道归入同一故事线。`,
    windowLabel,
    sourceBreakdown: buildSourceBreakdown(sources),
    sources,
  };
}

/** 本地热度计算：热度 = (信源数 × 10 + 信号数 × 4) × 2^(-小时/24)，曲线由报道密度驱动 */
export function buildHeatAnalysis(
  story: AihotStory,
  sourceCount: number,
  signalCount: number,
  now = Date.now(),
): StoryHeatAnalysis {
  const latestAt = story.latestAt;
  const current = displayHeat(sourceCount, signalCount, latestAt, now);
  const raw = sourceCount * 10 + signalCount * 4;
  const perReport = raw / Math.max(1, story.reports.length);
  const startMs = Math.min(now - HALF_LIFE_HOURS * 3_600_000, Date.parse(story.firstReportAt) || now);
  const reports = story.reports
    .map((r) => ({ t: Date.parse(r.publishedAt) }))
    .filter((r) => Number.isFinite(r.t))
    .sort((a, b) => a.t - b.t);

  const points: StoryHeatPoint[] = [];
  // 以报告时间为峰值的分钟级点位 + 整点网格
  const times = new Set<number>([startMs, now]);
  for (let t = Math.floor(startMs / 3_600_000) * 3_600_000; t <= now; t += 3_600_000) times.add(t);
  for (const r of reports) times.add(r.t);

  for (const t of [...times].sort((a, b) => a - b)) {
    let heat = 0;
    for (const r of reports) {
      if (r.t > t) continue;
      heat += perReport * Math.pow(0.5, Math.max(0, (t - r.t) / 3_600_000) / HALF_LIFE_HOURS);
    }
    points.push({ at: new Date(t).toISOString(), heat: Math.max(0, Math.round(heat * 10) / 10) });
  }

  // 缩放曲线使当前点与榜单口径一致
  const last = points[points.length - 1];
  if (last && last.heat > 0) {
    const k = current / last.heat;
    for (const p of points) p.heat = Math.max(0, Math.round(p.heat * k * 10) / 10);
    last.heat = current;
  }

  const peak = points.reduce((mx, p) => (p.heat > mx.heat ? p : mx), points[0] || { heat: 0, at: latestAt });
  const ago = points[Math.max(0, points.length - 7)] || points[0];
  const trend: StoryHeatAnalysis["trend"] = !ago
    ? "flat"
    : last.heat > ago.heat * 1.05
      ? "up"
      : last.heat < ago.heat * 0.95
        ? "down"
        : "flat";

  return {
    formula: "热度 = (信源数 × 10 + 信号数 × 4) × 2^(−小时/24)",
    inputs: { sourceCount, signalCount, latestAt, halfLifeHours: HALF_LIFE_HOURS },
    current,
    peak: Math.max(1, Math.round(peak.heat)),
    peakAt: peak.at,
    trend,
    points,
  };
}

function shortReason(summary: string | null | undefined, source: string, firstParty?: boolean): string {
  if (firstParty) return `${source}为官方一手信源，事件可信度最高。`;
  const s = (summary || "").trim();
  if (s.length >= 18) {
    const first = s.split(/[。！？\n]/)[0]?.trim() || s;
    return first.length >= 18 ? first.slice(0, 120) + (first.length > 120 ? "…" : "") : s.slice(0, 120);
  }
  return `${source}报道并归入该故事线，可点击原文核对细节。`;
}

/** 本地推荐理由：总述 + 每篇报道 */
export function buildRecommendation(
  story: AihotStory,
  itemsById: Map<string, AihotItem>,
  itemTitle?: string,
): StoryRecommendation {
  const primaryId = story.reports.find((r) => r.source.firstParty)?.id;
  const picked = story.reports.find((r) => itemsById.has(r.id)) || story.reports[0];
  const upstream = picked ? itemsById.get(picked.id)?.recommendReason : null;
  const overall =
    (upstream || "").trim() ||
    buildRecommendReason({
      title: itemTitle || story.title,
      summary: story.latest || story.digest,
      category: null,
      score: null,
      selected: true,
    });
  const overallBasis = (upstream || "").trim()
    ? "来源：AIHOT 精选推荐理由（同步自 items.json）"
    : "来源：本地生成（基于最新进展 / 事件全貌首句）";
  const perReport = story.reports.slice(0, 20).map((r) => ({
    id: r.id,
    title: r.title,
    reason:
      itemsById.get(r.id)?.recommendReason?.trim() ||
      shortReason(r.summary, r.source.name, r.source.firstParty),
  }));
  return { overall, overallBasis, perReport };
}

/** 组装完整故事视图（本地计算，不依赖运行时网络） */
export function buildStoryView(input: {
  story: AihotStory;
  topic?: {
    rank: number | null;
    itemId: string | null;
    title: string;
    sourceName: string;
    sourceCount: number;
    signalCount: number;
    sourceNames: string[];
    latestAt: string;
  } | null;
  itemsById: Map<string, AihotItem>;
  fetchedAt: string;
  now?: number;
}): StoryView {
  const { story, topic, itemsById, fetchedAt } = input;
  const now = input.now || Date.now();
  const sourceCount = topic?.sourceCount ?? story.sourceCount;
  const signalCount = topic?.signalCount ?? story.reportCount;
  const sourceNames = topic?.sourceNames?.length ? topic.sourceNames : story.reports.map((r) => r.source.name);
  const itemTitle = topic?.title || story.title;
  return {
    topic: topic ?? null,
    story,
    search: buildSearchLogic(story, sourceNames, itemTitle),
    heat: buildHeatAnalysis(story, sourceCount, signalCount, now),
    recommendation: buildRecommendation(story, itemsById, itemTitle),
    fetchedAt,
  };
}

/** 故事持续时间（天，向上取整） */
export function storyDurationDays(story: AihotStory): number {
  const a = Date.parse(story.firstReportAt);
  const b = Date.parse(story.latestAt);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.ceil((b - a) / 86_400_000));
}
