/**
 * Natural-language query engine for the AI Open Source Analyst.
 * Parses Chinese/English intents into structured filters and produces
 * an evidence-backed answer from the ranking engines.
 */
import { computeScores, formatPct, formatSigned, formatStars, growthRate, rankProjects } from "@/lib/engines";
import { PROJECTS } from "@/data/projects";
import { CATEGORY_MAP } from "@/lib/categories";
import type { CategoryId, Project, ProjectScores, RankKind } from "@/lib/types";
import { buildDirectorReport } from "@/lib/director";

export interface QueryIntent {
  kind: RankKind;
  days: 7 | 30 | 90 | null;
  category?: CategoryId;
  goal?: string;      // e.g. 副业 / 简历 / 学习 / Skill / SaaS
  limit: number;
  raw: string;
}

const CATEGORY_KEYWORDS: { id: CategoryId; keys: string[] }[] = [
  { id: "agent", keys: ["agent", "智能体", "智能代理", "多智能体", "multi-agent"] },
  { id: "skill", keys: ["skill", "技能", "skills"] },
  { id: "mcp", keys: ["mcp"] },
  { id: "coding", keys: ["编程", "写代码", "coding", "代码生成", "编码"] },
  { id: "video", keys: ["视频", "短视频", "video"] },
  { id: "image", keys: ["图像", "图片", "绘画", "image", "作图"] },
  { id: "audio", keys: ["音频", "语音", "音乐", "声音", "audio"] },
  { id: "rag", keys: ["rag", "知识库", "检索", "向量"] },
  { id: "saas", keys: ["saas", "软件即服务", "云端服务"] },
  { id: "automation", keys: ["自动化", "automation", "rpa"] },
  { id: "ecommerce", keys: ["电商", "ecommerce", "电商"] },
  { id: "marketing", keys: ["营销", "获客", "marketing"] },
  { id: "writing", keys: ["写作", "writing", "写文章"] },
  { id: "data", keys: ["数据", "data", "爬虫"] },
  { id: "pkm", keys: ["知识管理", "第二大脑", "笔记"] },
  { id: "education", keys: ["学习", "教育", "教程", "education"] },
  { id: "research", keys: ["研究", "research", "论文"] },
  { id: "robotics", keys: ["机器人", "robotics"] },
  { id: "vision", keys: ["视觉", "cv", "识别"] },
];

const SORT_KEYWORDS: { kind: RankKind; keys: string[] }[] = [
  { kind: "stars", keys: ["star", "stars", "最多", "最火", "热门", "顶流"] },
  { kind: "growth", keys: ["增长最快", "增长", "growth", "涨得", "飙升", "爆发", "上升"] },
  { kind: "opportunity", keys: ["机会", "opportunity", "值得", "潜力"] },
  { kind: "money", keys: ["赚钱", "变现", "money", "搞钱", "盈利"] },
  { kind: "sidehustle", keys: ["副业", "side hustle", "sidehustle"] },
  { kind: "skills", keys: ["skill 化", "做 skill", "做skill", "适合做skill", "skills", "技能化", "skill"] },
  { kind: "resume", keys: ["简历", "作品集", "portfolio", "求职", "面试"] },
  { kind: "content", keys: ["自媒体", "选题", "内容", "content", "爆款"] },
  { kind: "new", keys: ["新项目", "新发布", "最近发布", "新的"] },
];

const DAY_KEYWORDS: { days: 7 | 30 | 90; keys: string[] }[] = [
  { days: 7, keys: ["7天", "7 天", "一周", "7d", "7日"] },
  { days: 90, keys: ["90天", "90 天", "三个月", "3个月", "90d", "季度"] },
  { days: 30, keys: ["30天", "30 天", "一个月", "30d", "30日", "最近一个月"] },
];

export function parseQuery(text: string): QueryIntent {
  const t = text.toLowerCase();
  let kind: RankKind = "opportunity";
  for (const s of SORT_KEYWORDS) {
    if (s.keys.some((k) => t.includes(k))) { kind = s.kind; break; }
  }
  // "最近 30 天增长最快" → growth should win over opportunity
  if (t.includes("增长") || t.includes("growth")) kind = "growth";

  let days: QueryIntent["days"] = null;
  for (const d of DAY_KEYWORDS) {
    if (d.keys.some((k) => t.includes(k))) { days = d.days; break; }
  }

  let category: CategoryId | undefined;
  for (const c of CATEGORY_KEYWORDS) {
    if (c.keys.some((k) => t.includes(k))) { category = c.id; break; }
  }

  let goal: string | undefined;
  if (t.includes("副业")) goal = "副业";
  else if (t.includes("简历") || t.includes("作品集") || t.includes("求职")) goal = "简历/作品集";
  else if (t.includes("skill")) goal = "Skill 化";
  else if (t.includes("saas") || t.includes("商业化")) goal = "SaaS/商业化";
  else if (t.includes("学习")) goal = "学习";
  else if (t.includes("自媒体") || t.includes("选题")) goal = "自媒体内容";

  const limitMatch = text.match(/(\d+)\s*(个|款)/);
  let limit = 5;
  if (limitMatch) {
    const n = parseInt(limitMatch[1], 10);
    if (n >= 1 && n <= 20) limit = n;
  }
  if (text.includes("三个") || text.includes("3个") || text.includes("3 个")) limit = 3;

  return { kind, days, category, goal, limit, raw: text };
}

export interface DirectorBrief {
  verdict: string;
  overall: number;
  bet: string;
  whyWins: string;
  whyFails: string;
  realMoat: string;
  betWhy: string;
}

export interface QueryAnswer {
  intent: QueryIntent;
  projects: { project: Project; scores: ProjectScores; rank: number; growth30Rate: number; director: DirectorBrief }[];
  summary: string;
  recommendations: string[];
  filtersNote: string;
  directorSummary: string;
}

export function answerQuery(text: string): QueryAnswer {
  const intent = parseQuery(text);

  // Filter by category first (if any), then rank.
  let pool = PROJECTS;
  if (intent.category) pool = pool.filter((p) => p.categories.includes(intent.category!));

  const ranked = rankProjects(pool, intent.kind, 50);
  const picked = ranked.slice(0, intent.limit).map((r) => {
    const dr = buildDirectorReport(r.project);
    return {
      project: r.project,
      scores: r.scores,
      rank: r.rank,
      growth30Rate: growthRate(r.project, 30),
      director: {
        verdict: dr.verdict,
        overall: dr.overall,
        bet: dr.conclusions.bet,
        whyWins: dr.conclusions.whyWins,
        whyFails: dr.conclusions.whyFails,
        realMoat: dr.conclusions.realMoat,
        betWhy: dr.conclusions.betWhy,
      },
    };
  });

  const kindLabel: Record<RankKind, string> = {
    stars: "Stars 总量", growth: "30 天增长", hot: "7 天热度", opportunity: "AI 机会分",
    money: "赚钱潜力", sidehustle: "副业适配", skills: "Skill 化适配",
    resume: "简历价值", content: "内容潜力", new: "最近发布",
  };

  const filtersNote = [
    intent.category ? `分类：${CATEGORY_MAP[intent.category]?.name}` : null,
    intent.days ? `时间窗口：最近 ${intent.days} 天` : null,
    intent.goal ? `目标：${intent.goal}` : null,
  ].filter(Boolean).join(" · ") || "综合机会视角";

  const summary = `已按「${kindLabel[intent.kind]}」排序，${filtersNote}，共 ${pool.length} 个候选项目，为你筛选出 Top ${picked.length}。`;

  const recommendations = picked.map((r, i) => {
    const p = r.project;
    const why = whyLine(p, r.scores, intent);
    const d = r.director;
    return `${i + 1}. **${p.name}**（${p.fullName}）— ⭐${formatStars(p.stars)} · 30天 ${formatSigned(p.growth30d)} (${formatPct(r.growth30Rate)}) · Opportunity ${r.scores.opportunity} · Money ${r.scores.money} · SideHustle ${r.scores.sideHustle} · Skill ${r.scores.skill} · Resume ${r.scores.resume}\n   ${why}\n   👔 总监判定：**${d.verdict}**（Score ${d.overall}/100）· 押注：${d.bet} · ${d.whyWins}`;
  });

  const directorSummary = `👔 AI 产品总监视角：Top ${picked.length} 中，${picked.filter((x) => ["Strong Buy", "Invest"].includes(x.director.verdict)).length} 个可投（Strong Buy/Invest）、${picked.filter((x) => x.director.verdict === "Watch").length} 个观察（Watch）；若只能押一个，首选 ${picked[0] ? picked[0].project.name : "—"}（${picked[0]?.director.verdict ?? "—"}，Score ${picked[0]?.director.overall ?? "—"}）。`;

  return { intent, projects: picked, summary, recommendations, filtersNote, directorSummary };
}

function whyLine(p: Project, s: ProjectScores, intent: QueryIntent): string {
  if (intent.goal === "副业" || intent.kind === "sidehustle")
    return `副业适配 ${s.sideHustle}/100、赚钱 ${s.money}/100，${p.tagline}；建议从「${p.name} 垂直版 SaaS」或部署服务切入。`;
  if (intent.goal === "简历/作品集" || intent.kind === "resume")
    return `简历价值 ${s.resume}/100、技术 ${s.technical}/100，二开后是面试杀手锏，适合写进 AI 相关岗位作品集。`;
  if (intent.goal === "Skill 化" || intent.kind === "skills")
    return `Skill 适配 ${s.skill}/100，核心能力可封装为可复用 Agent Skill，快速形成个人效率资产。`;
  if (intent.goal === "SaaS/商业化" || intent.kind === "money")
    return `商业化 ${s.commercial}/100、赚钱 ${s.money}/100，商业模式已验证，适合托管化/垂直化变现。`;
  if (intent.kind === "growth")
    return `近 30 天增长 ${formatSigned(p.growth30d)}（${formatPct((p.growth30d / (p.stars - p.growth30d)) * 100)}），成长曲线陡峭。`;
  if (intent.kind === "stars")
    return `Stars ${formatStars(p.stars)}，社区与生态成熟，是行业基准级项目。`;
  return `综合机会 ${s.opportunity}/100，增长 ${s.growth}/100，值得纳入雷达。`;
}
