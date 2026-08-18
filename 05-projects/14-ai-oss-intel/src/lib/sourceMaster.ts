/**
 * Source-driven Master Reverse Engineering — generates the complete 40-section
 * PROJECT REVERSE ENGINEERING REPORT + product panorama + director view for
 * LIVE projects, based on actually-fetched source intel (README, manifests,
 * file tree). Where the source doesn't confirm a claim, it is marked
 * [INFERENCE]/[HYPOTHESIS] per Evidence Mode.
 */
import type { LiveRepo } from "@/lib/live";
import type { SourceIntel } from "@/lib/source";
import type { MapNode } from "@/lib/master";
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

export function buildSourcePanorama(repo: LiveRepo, intel: SourceIntel): MapNode[] {
  const N = (node: string, detail: string, explain: string[], questions: string[], evidence = "Inferred"): MapNode => ({ node, detail, explain, questions, evidence });
  return [
    N("USER", intel.tagline, ["README 定位：目标用户（[INFERENCE]）", "待 Issues/社区确认真实画像", "种子用户 = 需求最痛者"], ["谁最先用？", "谁最先付费？"]),
    N("PROBLEM", repo.description ?? "—", ["定位描述的痛点", "旧方案低效（[HYPOTHESIS]）", "结合 README/Issues 深挖"], ["用户现在怎么解决？", "痛点多痛？"]),
    N("REQUIREMENT", intel.features[0] ?? intel.tagline, ["README 需求信号", "表层 vs 深层需求（[INFERENCE]）", "潜在需求待挖掘"], ["用户嘴上要什么？", "真正要什么？"]),
    N("FEATURE", intel.features.join(" · ") || "核心功能", [intel.features.join(" · ") || "（README 未列出）", "Feature → 代码映射见源码模块", "核心功能 = 最小闭环"], ["删掉它产品还成立吗？", "哪个是杀手功能？"]),
    N("UX FLOW", "输入 → 结果 → 审核", ["上手路径（[HYPOTHESIS]）", "结果可审核/可解释", "错误恢复"], ["首次体验多快？", "出错有救吗？"]),
    N("WORKFLOW", ["Input", "Intent", "Processing", "LLM", "Output", "Feedback"].join(" → "), ["核心处理链（[INFERENCE]）", "AI 组件参与位置", "失败降级"], ["哪一步决定质量？", "哪一步最贵？"]),
    N("LLM / RAG / AGENT", intel.aiComponents.join(" · ") || "待源码确认", [intel.aiComponents.join(" · ") || "未检出（[HYPOTHESIS]）", "依赖清单证据（[CONFIRMED via manifest]）", "AI 承担的角色"], ["为什么需要 AI？", "没有 AI 会怎样？"]),
    N("TOOLS", intel.moduleMap.find((m) => /工具/.test(m.role))?.module ?? "tools/", ["工具模块（[CONFIRMED via tree]）", "工具失败降级", "权限安全"], ["哪些工具核心？", "失败怎么办？"]),
    N("DATA", intel.moduleMap.find((m) => /数据/.test(m.role))?.module ?? "data/", ["数据层模块（[CONFIRMED via tree]）", "数据来源/存储/进 Context", "是否形成资产"], ["数据从哪来？", "是否持久化？"]),
    N("BACKEND", intel.moduleMap.find((m) => /Backend|API/.test(m.role))?.module ?? "api/", ["后端/API 模块（[CONFIRMED via tree]）", "核心引擎", "并发/限流"], ["核心服务在哪？", "并发怎么处理？"]),
    N("FRONTEND", intel.moduleMap.find((m) => /Frontend|前端/.test(m.role))?.module ?? "src/", ["前端/入口模块（[CONFIRMED via tree]）", "输入体验", "流式反馈"], ["入口形态对吗？", "首屏快吗？"]),
    N("CODE", repo.fullName, [repo.fullName, intel.treeSource === "tree" ? "已抓取目录树（[CONFIRMED]）" : "目录树未获取", "源码是唯一事实源"], ["目录对应产品模块吗？", "核心逻辑在哪？"]),
    N("DEPLOYMENT", intel.techStack.includes("Docker") ? "Docker/CI" : "Cloud/自托管", ["部署方式（[INFERENCE]）", "自托管 = 企业信任", "托管/私有化变现"], ["自托管还是 SaaS？", "部署成本？"]),
    N("BUSINESS", `开源获客（License=${repo.license ?? "—"}）`, ["开源获客 → 托管/API/企业版（[INFERENCE]）", "License 决定商业边界", "真正的赚钱点待验证"], ["谁愿意付费？", "赚钱点在哪？"]),
    N("GROWTH", `Stars ${formatStars(repo.stars)} · Forks ${formatStars(repo.forks)}`, ["Star/Forks 增长信号（[CONFIRMED]）", "增长引擎：口碑/内容/工具链", "更新时间反映活跃度"], ["为什么能增长？", "飞轮起点？"]),
    N("MOAT", "数据/社区/工作流", ["护城河候选（[HYPOTHESIS]）", "数据 × 场景 × 分发", "工作流锁定"], ["为什么持续存在？", "大厂做了怎么办？"]),
  ];
}

export function buildSourceTechRouteMainline(repo: LiveRepo, intel: SourceIntel): MapNode[] {
  const N = (node: string, detail: string, explain: string[], questions: string[], evidence = "Inferred"): MapNode => ({ node, detail, explain, questions, evidence });
  return [
    N("用户", intel.tagline, ["README 定位（[INFERENCE]）", "待社区确认", "种子用户"], ["谁最先用？"]),
    N("为什么需要", repo.description ?? "—", ["定位痛点", "旧方案低效（[HYPOTHESIS]）"], ["为什么现在？"]),
    N("用户痛点", intel.tagline, ["定位相关痛点", "结合 Issues 深挖"], ["多痛？"]),
    N("用户需求", intel.features[0] ?? intel.tagline, ["README 需求信号", "表层 vs 深层"], ["要什么？"]),
    N("产品解决方案", intel.tagline, ["一句话模型", "最小闭环"], ["为什么换？"]),
    N("功能设计", intel.features.join(" · ") || "核心功能", ["Feature Map", "杀手功能"], ["删掉成立吗？"]),
    N("UX / UI", "输入 → 结果 → 审核", ["上手路径", "结果可审核"], ["首体验多快？"]),
    N("用户操作流程", ["进入", "输入", "执行", "结果", "复用"].join(" → "), ["流失点", "5 分钟出结果"], ["哪里流失？"]),
    N("产品 Workflow", ["Input", "Intent", "Processing", "LLM", "Output", "Feedback"].join(" → "), ["处理链", "AI 参与点"], ["哪步决定质量？"]),
    N("LLM", intel.aiComponents.join(" / ") || "待确认", ["模型角色（[INFERENCE]）", "成本质量"], ["为什么需要？"]),
    N("RAG", intel.aiComponents.some((a) => /RAG|向量/.test(a)) ? "检出检索组件" : "未检出", ["检索链路（[INFERENCE]）", "数据源"], ["是核心价值吗？"]),
    N("Agent", intel.aiComponents.some((a) => /Agent/.test(a)) ? "检出 Agent 组件" : "未检出", ["编排", "可靠性"], ["为什么 Agent？"]),
    N("Tools", intel.moduleMap.find((m) => /工具/.test(m.role))?.module ?? "tools/", ["工具模块（[CONFIRMED via tree]）", "降级"], ["哪些工具？"]),
    N("MCP", intel.aiComponents.some((a) => /MCP/.test(a)) ? "检出 MCP" : "可选", ["协议", "生态"], ["价值？"]),
    N("Data", intel.moduleMap.find((m) => /数据/.test(m.role))?.module ?? "data/", ["数据层（[CONFIRMED via tree]）", "资产"], ["从哪来？"]),
    N("API", intel.moduleMap.find((m) => /Backend|API/.test(m.role))?.module ?? "api/", ["接口（[CONFIRMED via tree]）", "开放变现"], ["哪些最重要？"]),
    N("Backend", "服务端", ["核心引擎", "并发"], ["核心在哪？"]),
    N("Database", "存储/向量/缓存", ["数据模型", "资产"], ["存什么？"]),
    N("Frontend", intel.moduleMap.find((m) => /Frontend|前端/.test(m.role))?.module ?? "src/", ["入口（[CONFIRMED via tree]）", "体验"], ["形态对吗？"]),
    N("Source Code", repo.fullName, ["仓库", "目录树证据"], ["核心逻辑在哪？"]),
    N("Deployment", intel.techStack.includes("Docker") ? "Docker/CI" : "Cloud", ["部署", "自托管"], ["成本？"]),
    N("Business", `开源 · ${repo.license ?? "—"}`, ["开源获客 → 托管/API", "License 边界"], ["赚钱点？"]),
    N("Growth", `Stars ${formatStars(repo.stars)}`, ["增长信号", "飞轮"], ["为什么涨？"]),
    N("Moat", "数据/社区/工作流", ["护城河候选", "工作流锁定"], ["持续存在？"]),
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

/* ── 完整链路（源码驱动）：用户问题 → … → 可复制性 ────────────── */
export function buildSourceCompleteChain(repo: LiveRepo, intel: SourceIntel): { stage: number; label: string; key: string; content: string }[] {
  const modules = intel.moduleMap.map((m) => `${m.module}(${m.evidence})`).join(" / ") || "（目录树未获取）";
  const stack = intel.techStack.join(" / ") || "（待源码确认）";
  return [
    { stage: 1, label: "用户问题", key: "question", content: `用户问：「${intel.tagline}」怎么办？——${intel.description}[INFERENCE]` },
    { stage: 2, label: "需求", key: "requirement", content: `README 需求信号：${intel.features.slice(0, 3).join("、") || "（待补充）"}[INFERENCE]` },
    { stage: 3, label: "产品方案", key: "solution", content: `${repo.name}＝「${intel.tagline}」（README 定位 [CONFIRMED]）` },
    { stage: 4, label: "功能", key: "feature", content: `Feature Map：${intel.features.join(" · ") || "（README 未列出）"}` },
    { stage: 5, label: "UX", key: "ux", content: "输入 → 结果 → 审核（[HYPOTHESIS]）" },
    { stage: 6, label: "Workflow", key: "workflow", content: ["User Input", "Intent", "Processing", ...(intel.aiComponents.some((a) => /Agent/.test(a)) ? ["Agent", "Tool"] : []), ...(intel.aiComponents.some((a) => /RAG|向量/.test(a)) ? ["Retrieval"] : []), "LLM", "Output", "Feedback"].join(" → ") },
    { stage: 7, label: "AI能力", key: "ai", content: intel.aiComponents.join(" / ") || "（未检出，[HYPOTHESIS]）" },
    { stage: 8, label: "数据流", key: "data", content: `Input → Storage → Retrieval → AI → Output；数据层：${modules}` },
    { stage: 9, label: "技术架构", key: "architecture", content: `选型：${stack}；模块：${modules}` },
    { stage: 10, label: "源码模块", key: "code", content: modules },
    { stage: 11, label: "部署", key: "deploy", content: `${intel.techStack.includes("Docker") ? "Docker/CI" : "Cloud/自托管"}[INFERENCE]` },
    { stage: 12, label: "商业模式", key: "business", content: `开源获客（License=${repo.license ?? "—"}）→ 托管/API/企业版[INFERENCE]` },
    { stage: 13, label: "增长", key: "growth", content: `Stars ${formatStars(repo.stars)} · Forks ${formatStars(repo.forks)} · 更新 ${repo.updatedAt}；增长引擎 [INFERENCE]` },
    { stage: 14, label: "可复制性", key: "replicable", content: `基于检出栈 ${stack} 可 7-30 天复制 MVP；风险：模型成本/竞争[INFERENCE]` },
  ];
}
