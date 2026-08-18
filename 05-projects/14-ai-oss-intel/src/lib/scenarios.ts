/**
 * 2026 Radar — Scenario-Based Taxonomy + Project Time Status.
 * Scenario taxonomy is use-case driven (not just technology), and every
 * project gets a 2026 time status from multi-factor activity, never a single date.
 */
import type { CategoryId, Project, Scenario, TimeStatus } from "@/lib/types";
import { growthRate } from "@/lib/engines";

export const SCENARIOS: Scenario[] = [
  { id: "A01", group: "A", name: "AI Agent", nameZh: "AI 智能体", emoji: "🤖" },
  { id: "A02", group: "A", name: "Personal AI Assistant", nameZh: "个人 AI 助手", emoji: "🧑‍💻" },
  { id: "A03", group: "A", name: "Digital Employee", nameZh: "数字员工", emoji: "🕴️" },
  { id: "A04", group: "A", name: "Workflow Automation", nameZh: "工作流自动化", emoji: "⚙️" },
  { id: "A05", group: "A", name: "Office Automation", nameZh: "办公自动化", emoji: "📎" },
  { id: "A06", group: "A", name: "Email Automation", nameZh: "邮件自动化", emoji: "✉️" },
  { id: "A07", group: "A", name: "Meeting Assistant", nameZh: "会议助手", emoji: "🎙️" },
  { id: "B01", group: "B", name: "AI PM Tooling", nameZh: "AI 产品经理工具", emoji: "🧭" },
  { id: "C01", group: "C", name: "AI Coding Assistant", nameZh: "AI 编程助手", emoji: "⌨️" },
  { id: "C02", group: "C", name: "Coding Agent", nameZh: "编程 Agent", emoji: "🤖" },
  { id: "D01", group: "D", name: "AI Skills", nameZh: "AI 技能封装", emoji: "🧩" },
  { id: "D02", group: "D", name: "MCP", nameZh: "MCP 协议", emoji: "🔌" },
  { id: "E01", group: "E", name: "Self Media", nameZh: "自媒体", emoji: "📱" },
  { id: "F01", group: "F", name: "Video", nameZh: "视频", emoji: "🎬" },
  { id: "G01", group: "G", name: "Image / Design", nameZh: "图片设计", emoji: "🖼️" },
  { id: "H01", group: "H", name: "Audio", nameZh: "音频", emoji: "🎧" },
  { id: "I01", group: "I", name: "Knowledge / RAG", nameZh: "知识 / RAG", emoji: "📚" },
  { id: "J01", group: "J", name: "Research", nameZh: "研究", emoji: "🔬" },
  { id: "K01", group: "K", name: "Career / Resume", nameZh: "求职简历", emoji: "💼" },
  { id: "L01", group: "L", name: "AI SaaS / Business", nameZh: "SaaS / 商业", emoji: "☁️" },
  { id: "M01", group: "M", name: "Side Hustle", nameZh: "副业", emoji: "💸" },
  { id: "N01", group: "N", name: "Marketing", nameZh: "营销", emoji: "📣" },
  { id: "O01", group: "O", name: "E-commerce", nameZh: "电商", emoji: "🛒" },
  { id: "P01", group: "P", name: "Learning / Education", nameZh: "学习", emoji: "🎓" },
  { id: "Q01", group: "Q", name: "Developer Infra", nameZh: "开发者基础设施", emoji: "🏗️" },
];

const SCENARIO_MAP: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

/** Category → scenario mapping (a project can belong to multiple scenarios). */
const CATEGORY_SCENARIO: Record<CategoryId, string[]> = {
  agent: ["A01", "A03"],
  skill: ["D01", "A02"],
  mcp: ["D02"],
  coding: ["C01", "C02"],
  devtools: ["Q01", "C01"],
  saas: ["L01", "A02"],
  productivity: ["A02", "A04"],
  automation: ["A04", "A05"],
  content: ["E01", "F01"],
  selfmedia: ["E01"],
  video: ["F01"],
  image: ["G01"],
  audio: ["H01"],
  writing: ["E01", "B01"],
  resume: ["K01", "B01"],
  sidehustle: ["M01", "L01"],
  money: ["M01", "L01"],
  ecommerce: ["O01", "N01"],
  marketing: ["N01"],
  data: ["Q01", "I01"],
  rag: ["I01"],
  llm: ["Q01"],
  vision: ["G01", "Q01"],
  robotics: ["Q01"],
  education: ["P01"],
  research: ["J01", "P01"],
  infra: ["Q01"],
  devproductivity: ["Q01", "A04"],
  pkm: ["I01", "A02"],
  life: ["A02", "P01"],
};

export function scenariosOf(p: Project): Scenario[] {
  const ids = new Set<string>();
  for (const c of p.categories) for (const s of CATEGORY_SCENARIO[c] ?? []) ids.add(s);
  if (ids.size === 0) ids.add("Q01");
  return [...ids].slice(0, 4).map((id) => SCENARIO_MAP[id]).filter(Boolean);
}

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIO_MAP[id];
}

/** 2026 Time Status — multi-factor, never a single date. */
export function timeStatusOf(p: Project): TimeStatus {
  const year = (d: string) => parseInt(d.slice(0, 4), 10);
  const createdYear = year(p.createdAt);
  const updatedYear = year(p.updatedAt);
  const r30 = growthRate(p, 30);
  const r90 = growthRate(p, 90);
  const activeSignals =
    (updatedYear >= 2026 ? 1 : 0) + (p.releases >= 40 ? 1 : 0) + (r30 > 3 ? 1 : 0) + (r90 > 8 ? 1 : 0);

  if (createdYear >= 2026) return "2026NEW";
  if (updatedYear >= 2026 && (r30 > 8 || r90 > 20) && activeSignals >= 3) return "2026RISING";
  if (updatedYear >= 2026 && activeSignals >= 2) return "2026ACTIVE";
  return "2026RELEVANT";
}

export const TIME_STATUS_META: Record<TimeStatus, { label: string; color: string; desc: string }> = {
  "2026NEW": { label: "2026 NEW", color: "#34d399", desc: "2026 年首次创建的新项目" },
  "2026RISING": { label: "2026 RISING", color: "#7dd3fc", desc: "2026 年显著增长/活跃" },
  "2026ACTIVE": { label: "2026 ACTIVE", color: "#fbbf24", desc: "2026 年持续活跃开发" },
  "2026RELEVANT": { label: "2026 RELEVANT", color: "#a78bfa", desc: "2026 年仍具产品/生态价值" },
};

/* 二级场景拆解 — 每个一级分类拆成二级场景（§5） */
export const SECONDARY_SCENARIOS: Record<string, { code: string; name: string }[]> = {
  agent: [
    { code: "A01.1", name: "通用任务 Agent" },
    { code: "A01.2", name: "多智能体协作" },
    { code: "A01.3", name: "浏览器 Agent" },
    { code: "A01.4", name: "编码 Agent" },
    { code: "A01.5", name: "语音 Agent" },
  ],
  skill: [
    { code: "D01.1", name: "Claude Code Skill" },
    { code: "D01.2", name: "通用 Agent Skill" },
    { code: "D01.3", name: "工作流封装 Skill" },
  ],
  mcp: [
    { code: "D02.1", name: "官方 MCP Server" },
    { code: "D02.2", name: "MCP 生态清单" },
    { code: "D02.3", name: "MCP SDK/框架" },
  ],
  coding: [
    { code: "C01.1", name: "终端编码 Agent" },
    { code: "C01.2", name: "IDE 代码助手" },
    { code: "C01.3", name: "代码生成模型" },
  ],
  saas: [
    { code: "L01.1", name: "AI 应用平台" },
    { code: "L01.2", name: "企业知识 SaaS" },
    { code: "L01.3", name: "自动化 SaaS" },
  ],
  rag: [
    { code: "I01.1", name: "向量数据库" },
    { code: "I01.2", name: "文档理解 RAG" },
    { code: "I01.3", name: "知识库问答" },
  ],
  image: [
    { code: "G01.1", name: "图像生成工作流" },
    { code: "G01.2", name: "图像编辑/分割" },
  ],
  video: [
    { code: "F01.1", name: "视频生成模型" },
    { code: "F01.2", name: "短视频自动生产" },
    { code: "F01.3", name: "程序化视频" },
  ],
  audio: [
    { code: "H01.1", name: "语音识别" },
    { code: "H01.2", name: "语音合成/克隆" },
    { code: "H01.3", name: "音乐生成" },
  ],
  content: [
    { code: "E01.1", name: "图文内容生产" },
    { code: "E01.2", name: "视频内容生产" },
  ],
  automation: [
    { code: "A04.1", name: "浏览器自动化" },
    { code: "A04.2", name: "工作流编排" },
    { code: "A04.3", name: "RPA 替代" },
  ],
  pkm: [
    { code: "I01.4", name: "第二大脑" },
    { code: "I01.5", name: "笔记 AI 助手" },
  ],
  research: [
    { code: "J01.1", name: "深度研究 Agent" },
    { code: "J01.2", name: "学术写作" },
  ],
  ecommerce: [
    { code: "O01.1", name: "无头电商" },
    { code: "O01.2", name: "AI 客服/营销" },
  ],
  education: [
    { code: "P01.1", name: "LLM 教学" },
    { code: "P01.2", name: "机器人学习" },
  ],
};

export function secondaryScenariosOf(p: Project): { code: string; name: string }[] {
  const out: { code: string; name: string }[] = [];
  for (const c of p.categories) {
    const list = SECONDARY_SCENARIOS[c];
    if (list) out.push(list[p.slug.length % list.length]);
  }
  return out.slice(0, 3);
}
