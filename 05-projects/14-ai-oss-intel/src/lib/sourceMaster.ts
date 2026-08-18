/**
 * Source-driven Master Reverse Engineering — generates the complete 40-section
 * PROJECT REVERSE ENGINEERING REPORT + product panorama + director view for
 * LIVE projects, based on actually-fetched source intel (README, manifests,
 * file tree). Where the source doesn't confirm a claim, it is marked
 * [INFERENCE]/[HYPOTHESIS] per Evidence Mode.
 */
import type { LiveRepo } from "@/lib/live";
import type { SourceIntel } from "@/lib/source";
import { formatStars, growthRate } from "@/lib/engines";

export function buildSourceFactSheet(repo: LiveRepo, intel: SourceIntel) {
  return [
    ["仓库", repo.fullName],
    ["一句话（README）", intel.tagline],
    ["描述", intel.description],
    ["语言", repo.language ?? "—"],
    ["License", repo.license ?? "—"],
    ["Stars / Forks", `${formatStars(repo.stars)} / ${formatStars(repo.forks)}`],
    ["发布时间", repo.createdAt],
    ["更新时间", repo.updatedAt],
    ["主题", repo.topics.slice(0, 6).join(" · ") || "—"],
    ["源码", intel.treeSource === "tree" ? "已抓取目录树（git/trees）" : intel.treeSource === "readme-only" ? "已抓取 README/依赖（目录树受限）" : "未抓取"],
    ["清单文件", intel.manifest?.file ?? "—"],
  ].map(([k, v]) => ({ k, v }));
}

export function buildSourceMasterReport(repo: LiveRepo, intel: SourceIntel): { n: number; title: string; body: string }[] {
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const stack = intel.techStack.join(" / ") || "（待源码确认）";
  const ai = intel.aiComponents.join(" / ") || "（未检出，[HYPOTHESIS]）";
  const modules = intel.moduleMap.map((m) => `${m.module}→${m.role}(${m.evidence})`).join("；") || "（目录树未获取）";
  const featureCode = intel.featureToCode.map((x) => `${x.feature} → ${x.chain.join(" → ")}`).join("；");
  const features = intel.features.length ? intel.features.join("、") : "（README 未列出，[INFERENCE]）";
  const readmeSnippet = intel.readme?.slice(0, 400) ?? "（README 未抓取）";
  const journey = ["用户进入", "输入需求", "系统理解", "处理/规划", "执行/调用", "生成结果", "用户审核", "保存/复用"].join(" → ");
  const workflow = ["User Input", "Intent", "Processing", ...(intel.aiComponents.some((a) => /Agent/.test(a)) ? ["Agent Planning", "Tool Calling"] : []), ...(intel.aiComponents.some((a) => /RAG|向量/.test(a)) ? ["Retrieval"] : []), "LLM Generation", "Validation", "Output", "Feedback"].join(" → ");
  const architecture = ["User", "Frontend", "API", "Backend", ...(intel.aiComponents.length ? ["AI/Agent"] : []), "Tools/Data", "Database/External"].join(" → ");

  return [
    f(1, "项目概览 · PROJECT FACT SHEET", buildSourceFactSheet(repo, intel).map((x) => `${x.k}：${x.v}`).join(" · ")),
    f(2, "产品定位 · ONE SENTENCE MODEL", `「${intel.tagline}」——一句话：${repo.description ?? "为某类用户提供 AI 能力"}[INFERENCE]。`),
    f(3, "用户 · USER", `以仓库描述/README 推断目标用户；若源码/文档确认再标记 [FACT]。当前：[HYPOTHESIS] 开发者与效率型用户。`),
    f(4, "场景 · SCENARIO", `主题 ${repo.topics.slice(0, 5).join("/") || "—"} 对应的使用场景；[INFERENCE]。`),
    f(5, "Problem", `README 定位：「${intel.tagline}」；深层问题需结合源码/文档确认（[INFERENCE]）。`),
    f(6, "Pain Point", `由定位推断：现有方案低效/成本高/门槛高；具体证据见 README：[HYPOTHESIS]。`),
    f(7, "JTBD", `When 用户处于「${intel.tagline}」相关场景 → I want 一键获得结果 → So that 节省时间/提升产出（[INFERENCE]）。`),
    f(8, "Requirement", `表层需求：README 宣传的「${intel.features.slice(0, 3).join("、") || intel.tagline}」；深层需求待用户证据（[HYPOTHESIS]）。`),
    f(9, "Product Strategy · WHY THIS PRODUCT", `2026 窗口 + AI 能力（检出：${ai}）→ 用「${intel.tagline}」切入；[INFERENCE]。`),
    f(10, "Feature Map · WHY FEATURE EXISTS", features),
    f(11, "User Journey", journey + "（[INFERENCE]）"),
    f(12, "Core Workflow", workflow),
    f(13, "AI Architecture", intel.aiComponents.length ? intel.aiComponents.map((a) => `${a}：见源码/依赖（[CONFIRMED via manifest]）`).join("；") : "未检出 AI 组件（[HYPOTHESIS]）"),
    f(14, "Agent Architecture", intel.aiComponents.some((a) => /Agent/.test(a)) ? "检出 Agent 相关组件；编排细节需读 agents/ 源码（[INFERENCE]）" : "未检出 Agent（[HYPOTHESIS]）"),
    f(15, "RAG", intel.aiComponents.some((a) => /RAG|向量/.test(a)) ? "检出向量/RAG 组件；检索链路需读 retrieval/ 源码（[INFERENCE]）" : "未检出 RAG（[HYPOTHESIS]）"),
    f(16, "MCP / Tools", intel.aiComponents.some((a) => /MCP/.test(a)) ? "检出 MCP 相关；工具清单见源码（[INFERENCE]）" : "工具调用待源码确认（[HYPOTHESIS]）"),
    f(17, "Memory", "会话/历史/记忆实现见数据层模块（[HYPOTHESIS]）"),
    f(18, "Data Flow", "Input → Validation → Processing → Storage → Retrieval → AI → Output → Feedback（[INFERENCE]）；数据层模块：" + modules),
    f(19, "System Architecture", architecture),
    f(20, "Source Code Architecture", modules),
    f(21, "Feature → Code Mapping", featureCode || "（目录树未获取，无法映射）"),
    f(22, "Technical Stack", stack),
    f(23, "Technical Decisions", "基于依赖清单（" + (intel.manifest?.file ?? "—") + "）推断选型理由；替代方案待源码确认（[INFERENCE]）"),
    f(24, "Implementation Roadmap", "Frontend → API → Backend → AI → Tools → Data → Output（[INFERENCE]）"),
    f(25, "MVP Roadmap", "MVP=核心闭环；V1=模板/导出；V2=团队/生态（[HYPOTHESIS]）"),
    f(26, "Technical Challenges", "Context/Latency/Cost/质量/安全（通用 AI 难点，[HYPOTHESIS]）"),
    f(27, "Product Challenges", "上手成本/结果不确定性/信任/人在回路（[HYPOTHESIS]）"),
    f(28, "Business Model", "开源获客 + 托管/API/企业版（[INFERENCE]；License=" + (repo.license ?? "—") + "）"),
    f(29, "Monetization", "SaaS/API/Plugin/Skill/Consulting/Content（[HYPOTHESIS]）"),
    f(30, "Growth", `Stars ${formatStars(repo.stars)} · Forks ${formatStars(repo.forks)} · 更新时间 ${repo.updatedAt}；增长引擎 [INFERENCE]`),
    f(31, "Competition", "同类开源/商业竞品需结合生态分析（[HYPOTHESIS]）"),
    f(32, "Moat", "数据/社区/工作流锁定（[HYPOTHESIS]）"),
    f(33, "Industry Applications", "Developer/Creator/Enterprise 等（[HYPOTHESIS]）"),
    f(34, "Product 2.0", "垂直化 + 资产化 + 生态化（[HYPOTHESIS]）"),
    f(35, "Product Cloning Plan", "基于检出技术栈：MVP 7 天 → V1 14 天 → 验证 30 天；成本低（[INFERENCE]）"),
    f(36, "AI PM Learning", intel.aiComponents.length ? `AI 组件学习：${intel.aiComponents.join(" / ")}` : "AI 组件学习点待源码确认"),
    f(37, "Career Value", "可作简历/作品集案例（Live 项目，[INFERENCE]）"),
    f(38, "Self-Media Value", `标题建议：「${intel.tagline}」——为什么值得关注；[HYPOTHESIS]`),
    f(39, "Portfolio Value", "可沉淀 Case（Problem/User/Product Logic/AI/商业）"),
    f(40, "Final Evaluation", `Stars ${formatStars(repo.stars)} · 语言 ${repo.language ?? "—"} · AI 组件 ${intel.aiComponents.length ? intel.aiComponents.join("/") : "未检出"} · 完整评分需快照收录后生成`),
  ];
}

export function buildSourcePanorama(repo: LiveRepo, intel: SourceIntel): { node: string; sub?: string[] }[] {
  return [
    { node: "USER", sub: [intel.tagline] },
    { node: "PROBLEM", sub: [repo.description ?? "—"] },
    { node: "REQUIREMENT", sub: [intel.features[0] ?? intel.tagline] },
    { node: "FEATURE", sub: [intel.features.slice(0, 2).join(" · ") || "核心功能"] },
    { node: "UX FLOW", sub: ["输入 → 结果 → 审核"] },
    { node: "WORKFLOW", sub: ["Input → Intent → Process → Output"] },
    { node: "LLM / RAG / AGENT", sub: [intel.aiComponents.join(" · ") || "待源码确认"] },
    { node: "TOOLS", sub: [intel.moduleMap.find((m) => /工具/.test(m.role))?.module ?? "tools/"] },
    { node: "DATA", sub: [intel.moduleMap.find((m) => /数据/.test(m.role))?.module ?? "data/"] },
    { node: "BACKEND / API", sub: [intel.moduleMap.find((m) => /Backend|API/.test(m.role))?.module ?? "api/"] },
    { node: "FRONTEND", sub: [intel.moduleMap.find((m) => /Frontend|前端/.test(m.role))?.module ?? "src/"] },
    { node: "CODE", sub: [repo.fullName] },
    { node: "DEPLOYMENT", sub: [intel.techStack.includes("Docker") ? "Docker/CI" : "Cloud"] },
    { node: "BUSINESS", sub: ["开源获客 + 托管/API"] },
    { node: "GROWTH", sub: [`⭐${formatStars(repo.stars)} · 分享/模板`] },
    { node: "MOAT", sub: ["数据/社区/工作流"] },
  ];
}

export function buildSourceDirectorView(repo: LiveRepo, intel: SourceIntel) {
  return {
    boundary: {
      inScope: [intel.tagline, ...intel.features.slice(0, 2)],
      outScope: ["多租户企业级（V1 推测不做）", "复杂社交/社区"],
      constraints: ["模型成本", "结果不确定性", "竞争"],
      verdict: `边界结论：以「${intel.tagline}」为核心做窄而深；资产化程度决定长期价值（[INFERENCE]）。`,
    },
    pain: {
      deep: `深层痛点：围绕「${intel.tagline}」的低效/高成本（[HYPOTHESIS]）；真实痛点需结合 Issues/用户讨论确认。`,
      journeyFriction: "上手配置、首次成功输出、结果审核（[HYPOTHESIS]）",
      unmet: `未被满足：与「${intel.tagline}」相关的垂直化/资产化需求（[HYPOTHESIS]）`,
    },
    cases: [
      { name: "案例 A · 个人效率", user: "个人开发者/爱好者", scenario: intel.tagline, before: "人工/旧工具", after: `${intel.tagline} 一键完成`, outcome: "效率提升；结果需审核", metric: "激活/留存" },
      { name: "案例 B · 团队协作", user: "中小团队", scenario: "统一工作流与资产复用", before: "能力分散", after: "统一入口+沉淀", outcome: "产能提升；权限合规", metric: "团队活跃/付费" },
      { name: "案例 C · 二次开发", user: "一人公司", scenario: `基于「${intel.tagline}」做垂直产品`, before: "从 0 造轮子", after: "复用核心 + 垂直化", outcome: "7-30 天 MVP；竞争风险", metric: "MVP 周期/种子用户" },
    ],
  };
}

export function sourceTaglineFromReadme(intel: SourceIntel): string {
  return intel.tagline;
}

export { growthRate };
