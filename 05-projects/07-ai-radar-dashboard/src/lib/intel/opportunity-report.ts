import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { queryHotTopics } from "@/lib/intel/feed";
import { getGlobalHotTopicsView } from "@/lib/global-hot-data";
import { getPulseBriefView } from "@/lib/pulse-data";
import { getGithubHotSnapshot } from "@/lib/intel/github-data";
import { getProductHuntSnapshot } from "@/lib/intel/producthunt-data";
import type { GithubHotItem } from "@/lib/intel/github-types";
import type { ProductHuntItem } from "@/lib/intel/producthunt-types";
import type { BuilderPulseBrief, PulseOpportunity, PulseTrackItem } from "@/lib/pulse-types";
import type { HotRankItem } from "@/lib/intel/aihot-types";
import type { GlobalHotItem } from "@/lib/global-hot-types";
import type {
  OpportunityArchiveIndexItem,
  OpportunityDailyReport,
  OpportunityEvidence,
} from "@/lib/intel/opportunity-types";
import { shanghaiDay } from "@/lib/intel/time";

const DATA = path.join(process.cwd(), "data");
const LATEST = path.join(DATA, "opportunity-report-daily.json");
const DATED_DIR = path.join(DATA, "opportunities");

function aiRelated(title: string): boolean {
  return /AI|GPT|Claude|Grok|Gemini|LLM|大模型|人工智能|ChatGPT|OpenAI|Anthropic|DeepSeek|Qwen|智能体|Agent|模型/i.test(
    title,
  );
}

function pickHot(items: GlobalHotItem[], n: number) {
  const ai = items.filter((it) => aiRelated(it.title));
  const pool = ai.length >= 3 ? ai : items;
  return pool.slice(0, n);
}

function evidenceFromSignals(signals: string[]): OpportunityEvidence[] {
  return signals.slice(0, 4).map((s) => {
    const short = s.length > 48 ? `${s.slice(0, 48)}…` : s;
    return {
      label: short,
      discussion: "多源交叉验证公开讨论",
      meaning: s,
    };
  });
}

function short(s: string, n = 46): string {
  const t = (s || "").trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function ghRisingTop(): GithubHotItem[] {
  const snap = getGithubHotSnapshot();
  if (!snap) return [];
  return snap.categories
    .flatMap((b) => b.rising || [])
    .sort((a, b) => (b.starsDelta || 0) - (a.starsDelta || 0) || b.stars - a.stars)
    .slice(0, 6);
}

function phTop(): ProductHuntItem[] {
  return (getProductHuntSnapshot()?.items || []).slice(0, 6);
}

/** BuilderPulse 上游未发布当天日报时，用智衡全平台实时数据合成当天简报 */
function buildLiveBrief(date: string): BuilderPulseBrief {
  const hot = queryHotTopics();
  const global = getGlobalHotTopicsView();
  const ghRising = ghRisingTop();
  const ph = phTop();

  const cnItems = global.snapshot.platforms
    .filter((p) => p.region === "国内")
    .flatMap((p) => p.items);
  const intlItems = global.snapshot.platforms
    .filter((p) => p.region === "海外")
    .flatMap((p) => p.items);

  const signals: string[] = [];
  for (const it of hot.items.slice(0, 4)) {
    signals.push(`「${short(it.title, 40)}」 · ${it.sourceCount} 个信源（AI 热点榜 #${it.rank}）`);
  }
  for (const it of ghRising.slice(0, 2)) {
    signals.push(
      `GitHub 增速 ${it.starsDelta ? `+${it.starsDelta}` : "↑"} · ${it.name}：${short(it.description || "", 42)}`,
    );
  }
  for (const it of ph.slice(0, 2)) {
    signals.push(`Product Hunt ${it.votes} 票 · ${it.title}：${short(it.tagline || "", 42)}`);
  }
  if (signals.length < 3) {
    for (const it of [...cnItems, ...intlItems].slice(0, 2)) {
      signals.push(`「${short(it.title, 40)}」· ${it.platform} #${it.rank}`);
    }
  }

  const target = ghRising[0] || ph[0] || hot.items[0];
  const tAny = (target || {}) as Record<string, unknown>;
  const targetName =
    typeof tAny.name === "string" ? tAny.name : typeof tAny.title === "string" ? tAny.title : "";
  const targetDesc =
    typeof tAny.description === "string"
      ? tAny.description
      : typeof tAny.tagline === "string"
        ? tAny.tagline
        : typeof tAny.title === "string"
          ? tAny.title
          : "";
  const targetDelta =
    typeof tAny.starsDelta === "number" && tAny.starsDelta > 0
      ? `近况 +${tAny.starsDelta} stars`
      : typeof tAny.votes === "number"
        ? `PH ${tAny.votes} 票`
        : typeof tAny.sourceCount === "number"
          ? `${tAny.sourceCount} 个信源热议`
          : "";

  const ideaTitle = targetName
    ? `做一款「${targetName}」式产品：${short(targetDesc, 30)}`
    : "围绕今日最强 AI 信号做一个 2 小时可验证原型";
  const whyNow = targetName
    ? `「${targetName}」${targetDelta}，处于公开信源热度高点；同类直接竞品仍少，适合 24–72 小时快速验证并抢占窗口。`
    : "今日 AI 热点密集、公开讨论量大，先用最小原型验证需求再放大。";

  const opportunities: PulseOpportunity[] = [];
  for (const it of ph.slice(0, 4)) {
    opportunities.push({
      id: `live-launch-${it.slug || it.rank}`,
      category: "launches",
      title: `${it.title} 今日上线 Product Hunt`,
      signal: short(it.tagline || "", 60) || `${it.title}（${it.votes} 票）`,
      plainSpeak: `${it.title} 今日在 Product Hunt 获 ${it.votes} 票，可研究其定位、定价与差异化。`,
      judgment: "新品集中出现说明该方向需求在放大，适合跟进做垂直细分。",
      counterpoint: "头部产品已占先发优势，需找到未被满足的细分场景。",
    });
  }
  for (const it of ghRising.slice(0, 4)) {
    opportunities.push({
      id: `live-oss-${it.fullName || it.name}`,
      category: "oss_gap",
      title: `${it.name} 高速增长的开源项目`,
      signal: short(it.description || "", 60),
      plainSpeak: `${it.name}（${it.stars.toLocaleString()} stars）增速快，可基于其能力做本地化 / 垂直化封装。`,
      judgment: "开源底座成熟，商业化缺口在于体验与场景化交付。",
    });
  }
  for (const it of hot.items.slice(0, 2)) {
    opportunities.push({
      id: `live-trend-${it.id}`,
      category: "trends",
      title: short(it.title, 50),
      signal: `${it.sourceName} · ${it.sourceCount} 个信源`,
      plainSpeak: `事件热度高，围绕其生态（工具 / 教程 / 集成）有二次创作空间。`,
    });
  }
  opportunities.push({
    id: "live-action-1",
    category: "action",
    title: ideaTitle,
    signal: whyNow,
    plainSpeak: "用 2 小时先做一个单点 MVP（登录 + 核心动作 + 分享链接），验证后再扩展。",
  });

  const trackRecord: PulseTrackItem[] = (() => {
    const dir = path.join(DATA, "opportunities");
    const out: PulseTrackItem[] = [];
    if (existsSync(dir)) {
      const files = readdirSync(dir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse()
        .slice(0, 7);
      for (const f of files) {
        try {
          const r = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as OpportunityDailyReport;
          out.push({
            date: r.reportDate,
            summary: r.buildIdea?.title || r.headline || r.reportDate,
            reportPath: `/opportunities?date=${r.reportDate}`,
          });
        } catch {
          /* skip */
        }
      }
    }
    return out;
  })();

  const methodNote =
    "实时生成模式：BuilderPulse 上游尚未发布 " +
    date +
    " 日报，本报告由智衡全平台实时数据（AI 热点榜 / GitHub 热点 / Product Hunt / 国内外全域热点）自动联动生成；命令：npm run opp:sync";

  return {
    generatedAt: new Date().toISOString(),
    reportDate: date,
    timezone: "Asia/Shanghai",
    source: "seed",
    sourceUrl: "",
    attribution: "智衡 · 实时数据联动（AIHOT / GitHub / Product Hunt / NewsNow 全域热点）",
    editorNote:
      `今日（${date}）${hot.items.length} 条 AI 热点、${ghRising.length} 个 GitHub 高速增长项目、` +
      `${ph.length} 款 Product Hunt 新品。最强信号：${signals[0] || "暂无"}。报告由实时数据联动生成。`,
    plainBrief:
      `今日聚焦「${targetName || "最强 AI 信号"}」：${short(whyNow, 80)} 先做最小验证，再决定是否加码。`,
    buildIdea: {
      title: ideaTitle,
      whyNow,
      timeboxTitle: "2 小时验证：单点 MVP（核心动作 + 分享 + 数据埋点）",
      timeboxDetail:
        "① 搭登录与核心页面 ② 实现最关键的一个动作闭环 ③ 用分享链接在 1-2 个社区获取首批反馈 ④ 记录转化数据决定下一步。",
    },
    topSignals: signals.slice(0, 5),
    opportunities: opportunities.slice(0, 12),
    trackRecord,
    methodNote,
  };
}

/** 按 BuilderPulse 方法合成：一条建议 + Why now + Top 信号 + 题库（信号/白话/判断/反方）+ 三棱镜 */
export function buildOpportunityReport(reportDate?: string): OpportunityDailyReport {
  const hot = queryHotTopics();
  const global = getGlobalHotTopicsView();
  const pulse = getPulseBriefView().brief;
  const date = reportDate || pulse.reportDate || shanghaiDay();
  // BuilderPulse 未发布当天日报时 → 用智衡实时数据联动生成
  const live = pulse.reportDate !== date;
  const brief = live ? buildLiveBrief(date) : pulse;
  const method: OpportunityDailyReport["method"] = live ? "live" : "builderpulse-aligned";

  const cnItems = global.snapshot.platforms
    .filter((p) => p.region === "国内")
    .flatMap((p) => p.items)
    .sort((a, b) => a.rank - b.rank);
  const intlItems = global.snapshot.platforms
    .filter((p) => p.region === "海外")
    .flatMap((p) => p.items)
    .sort((a, b) => a.rank - b.rank);

  const rankTop = hot.items.slice(0, 5);
  const cnTop = pickHot(cnItems, 5);
  const intlTop = pickHot(intlItems, 5);

  const buildIdea = {
    title: brief.buildIdea.title,
    whyNow: brief.buildIdea.whyNow,
    timeboxTitle: brief.buildIdea.timeboxTitle,
    timeboxDetail: brief.buildIdea.timeboxDetail,
  };

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    reportDate: date,
    timezone: "Asia/Shanghai",
    method,
    attribution: brief.attribution,
    sourceUrl: brief.sourceUrl,
    editorNote: brief.editorNote,
    plainBrief: brief.plainBrief,
    headline: buildIdea.title,
    summary: brief.plainBrief,
    buildIdea,
    topSignals: brief.topSignals.slice(0, 5),
    evidence: evidenceFromSignals(brief.topSignals),
    lenses: [
      {
        id: "ai-rank",
        title: "AI 热点榜信号",
        blurb: "精选事件热度 · 对齐热点榜名次",
        items: rankTop.map((it: HotRankItem) => ({
          title: it.title,
          meta: `${it.sourceName} · 热度值 ${it.heat}`,
          href: it.href,
          note: it.status === "fermenting" ? "发酵中" : it.status === "new" ? "新" : undefined,
        })),
      },
      {
        id: "cn-hot",
        title: "国内热点切入",
        blurb: "公开聚合榜 · 优先 AI 相关",
        items: cnTop.map((it) => ({
          title: it.title,
          meta: `${it.platform} · #${it.rank}${it.heat != null ? ` · 热度 ${it.heat}` : ""}`,
          href: it.url || `https://www.google.com/search?q=${encodeURIComponent(it.title.slice(0, 80))}`,
        })),
      },
      {
        id: "intl-hot",
        title: "海外热点切入",
        blurb: "HN / PH / TechCrunch 等",
        items: intlTop.map((it) => ({
          title: it.title,
          meta: `${it.platform} · #${it.rank}${it.heat != null ? ` · 热度 ${it.heat}` : ""}`,
          href: it.url || `https://www.google.com/search?q=${encodeURIComponent(it.title.slice(0, 80))}`,
        })),
      },
    ],
    opportunities: brief.opportunities.slice(0, 12),
    trackRecord: brief.trackRecord.slice(0, 7).map((t) => ({
      ...t,
      reportPath: t.reportPath?.startsWith("http")
        ? t.reportPath
        : t.reportPath
          ? `https://github.com/BuilderPulse/BuilderPulse/blob/main/${t.reportPath}`
          : `/opportunities?date=${t.date}`,
    })),
    methodNote:
      "方法对齐 BuilderPulse（CC BY-NC）：跨源交叉验证 → 一条高置信构建建议 + Why now + Top 信号 + 机会题库（信号／白话／关键判断／反向视角）。本地再叠 AI 热点榜与国内／海外看板。命令：npm run opp:sync",
    stats: {
      aiHot: rankTop.length,
      cnHot: cnTop.length,
      intlHot: intlTop.length,
      opportunities: Math.min(12, brief.opportunities.length),
    },
  };
}

function readStoredReport(file: string): OpportunityDailyReport | null {
  try {
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf8")) as OpportunityDailyReport;
  } catch {
    return null;
  }
}

/** 页面只读已落盘报告，避免写入 data/ 触发 Next 热更新死循环。日更请跑 npm run opp:sync。 */
export function getLatestOpportunityReport(): OpportunityDailyReport | null {
  const stored = readStoredReport(LATEST);
  if (stored) {
    try {
      const { brief } = getPulseBriefView();
      if (
        brief.buildIdea?.title &&
        brief.reportDate === stored.reportDate &&
        brief.buildIdea.title !== stored.buildIdea?.title
      ) {
        return {
          ...stored,
          generatedAt: brief.generatedAt || stored.generatedAt,
          reportDate: brief.reportDate || stored.reportDate,
          headline: brief.buildIdea.title,
          summary: brief.plainBrief || stored.summary,
          editorNote: brief.editorNote || stored.editorNote,
          plainBrief: brief.plainBrief || stored.plainBrief,
          buildIdea: brief.buildIdea,
          topSignals: brief.topSignals?.length ? brief.topSignals.slice(0, 5) : stored.topSignals,
          evidence: brief.topSignals?.length ? evidenceFromSignals(brief.topSignals) : stored.evidence,
          opportunities: brief.opportunities?.length ? brief.opportunities.slice(0, 12) : stored.opportunities,
          trackRecord: brief.trackRecord?.length
            ? brief.trackRecord.slice(0, 7).map((t) => ({
                ...t,
                reportPath: t.reportPath?.startsWith("http")
                  ? t.reportPath
                  : t.reportPath
                    ? `https://github.com/BuilderPulse/BuilderPulse/blob/main/${t.reportPath}`
                    : `/opportunities?date=${t.date}`,
              }))
            : stored.trackRecord,
        };
      }
    } catch {
      /* keep stored */
    }
    return stored;
  }
  try {
    return buildOpportunityReport();
  } catch {
    return null;
  }
}

export function getOpportunityReportByDate(date: string): OpportunityDailyReport | null {
  const dated = path.join(DATED_DIR, `${date}.json`);
  const archived = path.join(DATA, "archive", date, "opportunity-report.json");
  for (const p of [dated, archived]) {
    const hit = readStoredReport(p);
    if (hit) return hit;
  }
  const latest = readStoredReport(LATEST);
  if (latest?.reportDate === date) return latest;
  return null;
}

export function listOpportunityArchives(limit = 14): OpportunityArchiveIndexItem[] {
  const items: OpportunityArchiveIndexItem[] = [];
  if (existsSync(DATED_DIR)) {
    const files = readdirSync(DATED_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .reverse()
      .slice(0, limit);
    for (const f of files) {
      try {
        const report = JSON.parse(readFileSync(path.join(DATED_DIR, f), "utf8")) as OpportunityDailyReport;
        items.push({
          date: report.reportDate,
          headline: report.headline || report.buildIdea.title,
          whyNow: report.buildIdea.whyNow,
          href: `/opportunities?date=${report.reportDate}`,
        });
      } catch {
        /* skip */
      }
    }
  }
  if (!items.length) {
    const latest = getLatestOpportunityReport();
    if (latest) {
      items.push({
        date: latest.reportDate,
        headline: latest.headline,
        whyNow: latest.buildIdea.whyNow,
        href: `/opportunities?date=${latest.reportDate}`,
      });
    }
  }
  return items;
}

/** 写入最新 + 按日归档（供脚本与页面生成调用） */
export function persistOpportunityReport(report: OpportunityDailyReport): {
  latest: string;
  dated: string;
} {
  mkdirSync(DATA, { recursive: true });
  mkdirSync(DATED_DIR, { recursive: true });
  const dated = path.join(DATED_DIR, `${report.reportDate}.json`);
  const body = JSON.stringify(report, null, 2) + "\n";
  writeFileSync(LATEST, body, "utf8");
  writeFileSync(dated, body, "utf8");

  const archiveDir = path.join(DATA, "archive", report.reportDate);
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(path.join(archiveDir, "opportunity-report.json"), body, "utf8");

  return { latest: LATEST, dated };
}
