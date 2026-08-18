/**
 * Master Reverse-Engineering Analysis — implements the full "AI 产品深度逆向工程
 * × 技术实现路线 × 商业价值分析" spec: 40-section PROJECT REVERSE ENGINEERING
 * REPORT, PROJECT FACT SHEET, product panorama, feature implementation path
 * diagram, and the Product Director view (边界/痛点/真实案例预测).
 * All claims carry [FACT]/[INFERENCE]/[HYPOTHESIS]/[UNKNOWN] evidence tags.
 */
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import { buildProductDna, buildHiddenNeeds, buildJTBD, buildAiNativeTest, buildWhyAi, buildFiveLayers, targetUsersOf, problemOf, sceneOf, painPointOf, aiCapabilityOf, deepNeedOf, latentNeedOf, dataOf, growthOf, moatOf, coreFeatureOf, workflowOf, businessOf } from "@/lib/learning";
import { scenariosOf, timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import type { Project } from "@/lib/types";

export function buildFactSheet(p: Project) {
  return [
    { k: "仓库", v: p.fullName },
    { k: "一句话", v: p.tagline },
    { k: "描述", v: p.description },
    { k: "语言", v: p.language },
    { k: "License", v: p.license ?? "—" },
    { k: "Stars / Forks", v: `${formatStars(p.stars)} / ${formatStars(p.forks)}` },
    { k: "贡献者 / Issues", v: `${p.contributors.toLocaleString()} / ${p.openIssues.toLocaleString()}` },
    { k: "发布时间", v: p.createdAt },
    { k: "更新时间", v: p.updatedAt },
    { k: "2026 状态", v: TIME_STATUS_META[timeStatusOf(p)].label },
    { k: "分类", v: p.categories.map((c) => categoryOf(c).name).join(" · ") },
    { k: "场景", v: scenariosOf(p).map((x) => `${x.group}·${x.name}`).join(" / ") },
    { k: "主题", v: p.topics.join(" #").replace(/^/, "#") },
  ];
}

export function buildKillerFeature(p: Project): { feature: string; why: string; retention: string; moat: string; commercial: string; copyable: string } {
  const r = buildReverseEngineering(p);
  return {
    feature: r.productToTech.feature,
    why: `它是「${r.productToTech.productRequirement}」的最小闭环，删掉它产品不成立。`,
    retention: `每次使用都会沉淀「${p.categories.includes("rag") || p.categories.includes("pkm") ? "知识/资产" : "结果/模板"}」，构成留存钩子。`,
    moat: `护城河来自「${r.productToTech.workflow}」的封装与「${p.categories.includes("agent") ? "Agent 编排" : "数据/模板"}」资产。`,
    commercial: `它是付费分层（Free/Pro/Team）的核心交付物。`,
    copyable: `竞品可复制 UI，但难复制「${r.productToTech.ai}」+ 数据闭环带来的结果质量。`,
  };
}

export function buildBeforeAfter(p: Project) {
  const r = buildReverseEngineering(p);
  return {
    before: `用户之前：${r.productDnaFlow[0]} → 人工「${problemOf(p)}」→ 耗时/高成本/易错（Before：无 AI 时靠人工与规则脚本，成本高、门槛高、无法规模化）`,
    after: `产品之后：${r.productDnaFlow.join(" → ")}`,
    reduce: `减少：重复人工、等待时间、学习成本（"${p.categories.includes("coding") ? "写代码/改代码" : p.categories.includes("video") ? "做视频" : "完成任务"}"从小时级到分钟级）`,
    automate: `自动化：意图理解、规划、工具调用、结果校验（${r.productToTech.ai}）`,
    enhance: `增强：结果可复用、可分享、可沉淀为资产（${r.productToTech.output}）`,
    create: `创造：过去无法实现的「${p.categories.includes("agent") ? "多步自主执行" : p.categories.includes("rag") ? "基于私有知识的问答" : "规模化个性化生成"}」`,
  };
}

export function buildAiValueMap(p: Project) {
  const native = buildAiNativeTest(p);
  return [
    { tier: "Traditional", desc: `已有方案：${p.categories.includes("coding") ? "IDE/人工编码" : p.categories.includes("rag") ? "全文搜索+人工阅读" : "模板/人工流水线"}（无 AI 也能做，只是慢）` },
    { tier: "AI Enhanced", desc: native.enhanced },
    { tier: "AI Native", desc: native.native },
    { tier: "Agentic", desc: p.categories.includes("agent") ? `从「输入→输出」升级为「目标→规划→执行→校验→迭代」的自主闭环` : `当前为单步增强；Agent 化是下一步演进方向` },
  ];
}

export function buildFeatureDependency(p: Project): { path: string; items: string[] }[] {
  const r = buildReverseEngineering(p);
  return [
    { path: "核心路径", items: r.productDnaFlow.slice(0, 10) },
    { path: "辅助路径", items: ["模板/历史复用", "导出与分享", "设置与集成"] },
    { path: "异常路径", items: ["输入校验失败 → 提示重试", "工具调用失败 → 降级/换工具", "结果不满意 → 用户修改再执行"] },
    { path: "Fallback", items: ["无 API Key → 演示/缓存结果", "模型超时 → 重试/降级模型", "检索为空 → 澄清问题/扩检"] },
  ];
}

export function buildTechChallenges(p: Project) {
  const r = buildReverseEngineering(p);
  const isAgent = p.categories.includes("agent");
  const isRag = p.categories.includes("rag") || p.categories.includes("pkm");
  return [
    { name: "Context Management", problem: isAgent ? "多步 Agent 上下文膨胀" : "长输入/多轮上下文管理", cause: "模型上下文有限", solution: "摘要/记忆分层/裁剪", tradeoff: "细节丢失 vs 成本" },
    { name: "Latency", problem: "端到端延迟高", cause: "多步推理 + 工具调用", solution: "流式输出/并行工具/缓存", tradeoff: "复杂度 vs 体验" },
    { name: "Cost", problem: "每次调用都有模型成本", cause: "Token 用量", solution: "缓存/小模型预筛/用量分层", tradeoff: "质量 vs 成本" },
    { name: isRag ? "RAG Accuracy" : "Output Quality", problem: isRag ? "检索不准导致幻觉" : "生成结果不稳定", cause: "切分/嵌入/召回策略", solution: "混合检索+重排+引用", tradeoff: "精度 vs 延迟" },
    { name: "Agent Reliability", problem: "多步执行可能失败/跑偏", cause: "工具异常/规划失误", solution: "校验+重试+人在回路", tradeoff: "自主 vs 可控" },
    { name: "Security", problem: "工具调用权限与数据安全", cause: "外部 API/浏览器操作", solution: "沙箱/白名单/审计", tradeoff: "能力 vs 安全" },
  ].map((x) => `[${x.name}] Problem：${x.problem}；Cause：${x.cause}；Solution：${x.solution}；Trade-off：${x.tradeoff}`);
}

export function buildProductChallenges(p: Project) {
  return [
    "用户理解成本：需要让用户 3 分钟看懂「一句话输入 → 结果」的价值",
    "Onboarding：安装/配置/首次成功输出是第一漏斗漏点",
    "AI 不确定性：结果质量波动需要「可解释 + 可重试」",
    "用户信任：需要引用/证据/历史一致性建立信任",
    "Human-in-the-loop：把「审核/修改」设计进默认流程",
    "错误恢复：工具失败/超时要给清晰的降级路径",
  ];
}

export function buildProduct2(p: Project) {
  const r = buildReverseEngineering(p);
  return {
    current: p.name + "（" + p.tagline + "）",
    problems: buildProductChallenges(p).slice(0, 3),
    opportunity: `围绕「${r.productToTech.productRequirement}」做垂直化 + 资产化 + 生态化`,
    newProduct: `产品 2.0：${p.name} + 垂直行业模板市场 + 团队协作 + 结果评测闭环`,
    newUx: "从「工具」到「助理」：目标输入 → 自主执行 → 审核 → 沉淀",
    newAi: "多 Agent 协作 + 记忆 + 评测驱动迭代",
    newBusiness: "开源获客 → 托管订阅 → 模板市场 → 企业版",
  };
}

export function buildCloningPlan(p: Project) {
  const r = buildReverseEngineering(p);
  return {
    mvp: r.mvpReverse.mvp.join(" + "),
    coreArchitecture: r.sourceArchitecture.tree.slice(0, 4).join(" / "),
    coreFeatures: r.featureToCode.map((f) => f.feature).join("、"),
    aiStack: r.techStackExplained.slice(0, 5).map((t) => t.tech).join(" / "),
    data: r.productToTech.infrastructure,
    workflow: r.productToTech.workflow,
    team: "1 个 AI PM + 1 个 AI Engineer（可借助 Codex/Claude Code）",
    timeline: "MVP 7 天 → V1 14 天 → 验证 30 天",
    cost: "低（$50-300 模型与基础设施）",
    risk: "模型成本、结果质量、巨头下场、获客",
  };
}

export function buildThreeConclusions(p: Project) {
  const r = buildReverseEngineering(p);
  const s = computeScores(p);
  return {
    why: `WHY IT WORKS：它用「${r.productToTech.feature}」精准命中「${r.productToTech.productRequirement}」，以「${r.productToTech.workflow}」把 AI 能力产品化，靠「${p.categories.includes("devtools") || p.categories.includes("infra") ? "工具链嵌入 + 开发者口碑" : "模板/内容传播 + 资产沉淀"}」增长。`,
    how: `HOW IT WORKS：${r.implementationPath.slice(0, 12).map((x) => x.step).join(" → ")}；数据流：${r.productToTech.infrastructure}；商业模式：${r.businessModelDetail.moneyPoint}`,
    where: `WHERE IT GOES：从单点工具 → ${p.categories.includes("agent") ? "Agent 平台" : p.categories.includes("rag") ? "企业知识平台" : "垂直 SaaS"} → 生态市场；机会分 ${s.opportunity}/100、增长 ${s.growth}/100，建议持续跟踪其「${r.productToTech.output}」资产化进程。`,
  };
}

export interface MapNode {
  node: string;
  detail: string;
  explain: string[];
  questions: string[];
  answers: string[];
  evidence: string;
}

/** 给「产品自问」生成项目专属答案（keyword 驱动，project-specific） */
export function answerQuestion(p: Project, node: string, question: string): string {
  const r = buildReverseEngineering(p);
  const q = question;
  const ql = q.toLowerCase();
  if (/付费|谁愿意|谁最先/.test(q)) return `目标用户「${targetUsersOf(p)}」中，Power/企业用户付费意愿最高；核心是「${deepNeedOf(p)}」带来的效率价值。`;
  if (/传播/.test(q)) return `靠「${r.productToTech.output}」的结果/模板分享 + 开发者口碑传播（${growthOf(p)}）。`;
  if (/删除|砍|保留/.test(q)) return `核心是「${r.productToTech.feature}」，删掉它产品不成立；优先砍与核心 Job 无关的功能。`;
  if (/为什么需要 ai|为什么用|ai 在|没有 ai/i.test(ql)) return `AI 承担「${aiCapabilityOf(p)}」，把「${workflowOf(p)}」自动化；没有 AI 只能靠人工/规则，无法规模化。`;
  if (/护城河|10 个竞品|持续存在|为什么能赢/.test(q)) return `护城河 = ${moatOf(p)}；靠「${r.productToTech.output}」资产沉淀 + 工作流锁定 + 社区生态。`;
  if (/飞轮|增长|持续涨|为什么涨/.test(q)) return `${growthOf(p)}；飞轮起点 = 「${r.productToTech.feature}」→ 产出资产 → 分享传播。`;
  if (/数据/.test(q)) return `${dataOf(p)}；数据既是 RAG/个性化的燃料，也是长期护城河。`;
  if (/用户|谁最先/.test(q)) return `种子用户 = ${targetUsersOf(p)} 中最痛的一批；先做「${sceneOf(p)}」垂直场景。`;
  if (/风险|失败|出错/.test(q)) return `主要风险：模型/平台依赖、开源竞争、低切换成本、AI 商品化；详见战略风险。`;
  if (/开源|saas|自托管|部署|托管/.test(q)) return `策略：${businessOf(p)}；开源获客与信任，托管/企业版/API 变现。`;
  if (/api|开放|封闭/.test(q)) return `API 是前后端与第三方契约，也是生态与变现入口；是否开放需权衡壁垒。`;
  if (/下一步|未来|2\.0|做到哪/.test(q)) return `下一步：${buildProduct2(p).newProduct}；把「${latentNeedOf(p)}」做成默认能力并资产化。`;
  if (/为什么现在|时机|窗口/.test(q)) return `2026 窗口：模型/成本/Agent-MCP 生态成熟；${TIME_STATUS_META[timeStatusOf(p)].desc}。`;
  return `见「${node}」详细分析；具体证据以 ${p.fullName} 源码/文档为准。`;
}

export function buildPanorama(p: Project): MapNode[] {
  const r = buildReverseEngineering(p);
  const killer = buildKillerFeature(p);
  const ba = buildBeforeAfter(p);
  const nodes: Omit<MapNode, "answers">[] = [
    { node: "USER", detail: targetUsersOf(p), explain: [targetUsersOf(p), "种子用户 = 需求最痛、最早传播的那群人", `付费意愿：${P(p).commercialPotential >= 7 ? "中高（愿意为效率付费）" : "中（先免费获客）"}`], questions: ["谁最先付费？", "谁最先传播？"], evidence: "Inferred" },
    { node: "PROBLEM", detail: problemOf(p), explain: [problemOf(p), "用户在旧方案下的痛点：低效、高成本、高门槛", ba.reduce], questions: ["这个痛点有多痛？", "用户现在怎么解决的？"], evidence: "Inferred" },
    { node: "REQUIREMENT", detail: r.productToTech.productRequirement, explain: ["核心需求 = 用户真正的 Job", "表层需求是功能，深层需求是 Job", `未被满足：${latentNeedOf(p)}`], questions: ["用户嘴上要什么？", "用户真正要什么？"], evidence: "Inferred" },
    { node: "FEATURE", detail: r.productToTech.feature, explain: [`核心功能：${r.productToTech.feature}`, killer.why, `Feature Map：${r.featureToCode.map((f) => f.feature).join(" · ")}`], questions: ["删掉它产品还成立吗？", "它支撑哪些下游结果？"], evidence: "Inferred" },
    { node: "UX FLOW", detail: r.productToTech.ux, explain: [r.productToTech.ux, "3 秒看懂是什么、30 秒判断是否值得用", "结果可审核/可解释/可重试"], questions: ["上手要几步？", "出错时用户怎么办？"], evidence: "Inferred" },
    { node: "WORKFLOW", detail: r.productDnaFlow.join(" → "), explain: [r.productDnaFlow.join(" → "), "Workflow 是产品化的核心，决定结果质量与成本", "每一步都有输入/输出/失败处理"], questions: ["哪一步最可能失败？", "哪一步决定质量？"], evidence: "Inferred" },
    { node: "LLM / RAG / AGENT", detail: r.productToTech.ai, explain: [r.productToTech.ai, `AI 组件：${r.aiArchitecture.slice(0, 6).map((a) => a.component).join(" · ")}`, p.categories.includes("agent") ? "Agent 承担多步编排，AI 是执行者" : "AI 单步增强"], questions: ["为什么需要 AI？", "没有 AI 会怎样？"], evidence: "Inferred" },
    { node: "TOOLS", detail: "工具/外部服务（搜索/代码/浏览器/文件）", explain: ["工具扩展模型能力边界", "工具调用失败需要降级/重试", "权限与安全是工具层关键"], questions: ["哪些工具是核心？", "工具失败怎么办？"], evidence: "Inferred" },
    { node: "DATA", detail: r.productToTech.infrastructure, explain: [dataOf(p), "数据是 RAG/个性化的燃料，也是护城河", "数据资产决定长期价值"], questions: ["数据从哪来？", "是否形成资产？"], evidence: "Inferred" },
    { node: "BACKEND", detail: "服务端 + API + 队列", explain: ["Backend 编排核心流程与任务", "API 是前后端与第三方的契约", "可观测与限流保障稳定性"], questions: ["哪个服务最核心？", "并发怎么处理？"], evidence: "Inferred" },
    { node: "FRONTEND", detail: `${p.language} 前端/入口`, explain: ["前端承载 3 秒体验与流式反馈", "输入体验决定转化", "移动端/Web/CLI 形态选择"], questions: ["入口形态对吗？", "首次体验够快吗？"], evidence: "Inferred" },
    { node: "CODE", detail: p.fullName, explain: [`仓库：${p.fullName}`, r.sourceArchitecture.tree.slice(0, 4).join(" / "), "源码是唯一事实源，README 只是入口"], questions: ["代码目录能对应到产品模块吗？", "核心逻辑在哪？"], evidence: "Confirmed" },
    { node: "DEPLOYMENT", detail: "Cloud / 自托管", explain: ["部署决定成本与数据可控性", "开源可自托管 = 企业信任", "托管/私有化双轨是常见变现路径"], questions: ["自托管还是 SaaS？", "部署成本多高？"], evidence: "Inferred" },
    { node: "BUSINESS", detail: r.businessModelDetail.streams.slice(0, 3).join(" / "), explain: [r.businessModelDetail.moneyPoint, "开源获客 → 托管/企业版/API 变现", "商业模式决定可持续性"], questions: ["真正的赚钱点在哪？", "谁愿意付费？"], evidence: "Inferred" },
    { node: "GROWTH", detail: growthOf(p), explain: [growthOf(p), "增长引擎：口碑/内容/工具链嵌入", "增长飞轮 = 使用 → 资产 → 传播"], questions: ["为什么能持续增长？", "哪个环节是飞轮起点？"], evidence: "Inferred" },
    { node: "MOAT", detail: moatOf(p), explain: [moatOf(p), "护城河 = 数据 × 场景 × 分发", "生态/工作流锁定让用户难以离开"], questions: ["它为什么能持续存在？", "大厂做了怎么办？"], evidence: "Inferred" },
  ];
  return nodes.map((n) => ({ ...n, answers: n.questions.map((qq) => answerQuestion(p, n.node, qq)) }));
}


/* 40-section PROJECT REVERSE ENGINEERING REPORT (master §41) */
export function buildMasterReport(p: Project): { n: number; title: string; body: string }[] {
  const r = buildReverseEngineering(p);
  const s = computeScores(p);
  const needs = buildHiddenNeeds(p);
  const jtbd = buildJTBD(p);
  const why = buildWhyAi(p);
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const fact = buildFactSheet(p).map((x) => `${x.k}：${x.v}`).join(" · ");
  const killer = buildKillerFeature(p);
  const ba = buildBeforeAfter(p);
  const p2 = buildProduct2(p);
  const clone = buildCloningPlan(p);
  const three = buildThreeConclusions(p);
  return [
    f(1, "项目概览 · PROJECT FACT SHEET", fact),
    f(2, "产品定位 · ONE SENTENCE MODEL", `${p.name} 是「${p.tagline}」——一句话：${r.productToTech.productRequirement}。`),
    f(3, "用户 · USER", targetUsersOf(p)),
    f(4, "场景 · SCENARIO", sceneOf(p) + "；分类：" + p.categories.map((c) => categoryOf(c).name).join("/")),
    f(5, "Problem", problemOf(p)),
    f(6, "Pain Point", painPointOf(p)),
    f(7, "JTBD", `When ${jtbd.when} → I want ${jtbd.want} → So that ${jtbd.soThat}`),
    f(8, "Requirement", `表层：${needs.surface}；核心：${needs.core}；深层：${needs.deep}；潜在：${needs.latent}`),
    f(9, "Product Strategy · WHY THIS PRODUCT", `市场背景 + 用户痛点（${problemOf(p)}）+ 现有方案低效 → 新 AI 能力（${aiCapabilityOf(p)}）→ 恰逢 2026 窗口（${TIME_STATUS_META[timeStatusOf(p)].desc}）。${why.needAi}`),
    f(10, "Feature Map · WHY FEATURE EXISTS", r.featureToCode.map((x) => `[${x.feature}] ${r.productToTech.feature === x.feature ? "核心功能" : "支持/增长/商业化功能"} — 依赖 ${x.chain[0]}，产出 ${x.chain[x.chain.length - 1]}`).join("；")),
    f(11, "User Journey", r.userJourney.map((u) => `${u.step}(${u.module}/${u.aiRole})`).join(" → ")),
    f(12, "Core Workflow", r.productDnaFlow.join(" → ")),
    f(13, "AI Architecture", r.aiArchitecture.map((a) => `${a.component}:${a.role}`).join("；")),
    f(14, "Agent Architecture", p.categories.includes("agent") ? `User → Orchestrator → Planner → Reasoner → Tool Selector → Tool → Observation → Memory → Planner → Final Output；为什么用 Agent：${r.productToTech.productRequirement} 需要多步编排。` : "当前为单步增强，未使用多 Agent（[INFERENCE]）。"),
    f(15, "RAG", (p.categories.includes("rag") || p.categories.includes("pkm")) ? `Document → Chunking → Embedding → Vector DB → Retrieval → Ranking → Context → LLM → Answer；RAG 是核心价值（[INFERENCE]）。` : "RAG 非核心，按需接入（[HYPOTHESIS]）。"),
    f(16, "MCP / Tools", r.businessOpportunities.filter((o) => o.type === "Plugin" || o.type === "API").map((o) => o.opportunity).join("；") || "工具调用 + 外部服务（[INFERENCE]）"),
    f(17, "Memory", `${latentNeedOf(p)}；记忆/历史沉淀是留存钩子（[HYPOTHESIS]）。`),
    f(18, "Data Flow", dataOf(p)),
    f(19, "System Architecture", r.sourceArchitecture.tree.join(" / ")),
    f(20, "Source Code Architecture", r.sourceArchitecture.coreModules.map((m) => `${m.module}(${m.evidence})`).join(" / ")),
    f(21, "Feature → Code Mapping", r.featureToCode.map((x) => `${x.feature} → ${x.chain.join(" → ")}`).join("；")),
    f(22, "Technical Stack", r.techStackExplained.map((t) => `${t.tech}：${t.why}`).join("；")),
    f(23, "Technical Decisions", r.productDecisions.map((d) => `${d.decision}（${d.reason}）`).join("；")),
    f(24, "Implementation Roadmap", r.implementationPath.map((x) => `${x.step}(${x.evidence})`).join(" → ")),
    f(25, "MVP Roadmap", `MVP(${r.mvpReverse.mvp.join("+")}) → V1(${r.mvpReverse.v1.join("/")}) → V2(${r.mvpReverse.v2.join("/")}) → Scale(${r.mvpReverse.scale.join("/")})`),
    f(26, "Technical Challenges", buildTechChallenges(p).join("；")),
    f(27, "Product Challenges", buildProductChallenges(p).join("；")),
    f(28, "Business Model", r.businessModelDetail.streams.join(" / ") + "；" + r.businessModelDetail.moneyPoint),
    f(29, "Monetization", r.businessOpportunities.map((o) => `${o.type}:${o.opportunity}`).join("；")),
    f(30, "Growth", growthOf(p) + "；冷启动：社区 + 模板分发 + Build in Public"),
    f(31, "Competition", r.competitors.map((c) => `${c.type}(${c.name})`).join("；") + "；" + r.comparison.slice(0, 3).join("；")),
    f(32, "Moat", moatOf(p)),
    f(33, "Industry Applications", r.industries.map((i) => `${i.industry}(${i.difficulty},${i.potential})`).join(" / ")),
    f(34, "Product 2.0", `Current→Problems→Opportunity：${p2.opportunity}；New Product：${p2.newProduct}；New AI：${p2.newAi}；New Business：${p2.newBusiness}`),
    f(35, "Product Cloning Plan", `MVP=${clone.mvp}；架构=${clone.coreArchitecture}；AI=${clone.aiStack}；团队=${clone.team}；周期=${clone.timeline}；成本=${clone.cost}；风险=${clone.risk}`),
    f(36, "AI PM Learning", r.learningValue.join("；")),
    f(37, "Career Value", `简历/作品集 ${s.resume}/100；可产出 Portfolio Case 与面试案例`),
    f(38, "Self-Media Value", `${r.mediaValue.worth ? "值得做内容" : "内容价值一般"}；Title：${r.mediaValue.title}；Hook：${r.mediaValue.hook}`),
    f(39, "Portfolio Value", `可沉淀 Case（Problem/User/Product Logic/AI Architecture/Business/My Decision/Improvement）`),
    f(40, "Final Evaluation", `Product ${s.product} / User ${Math.round(P(p).userDemand * 10)} / AI Innovation ${Math.round(P(p).innovation * 10)} / Technical ${s.technical} / UX ${s.sideHustle} / Business ${s.commercial} / Growth ${s.growth} / OpenSource ${s.health} / Learning ${s.resume} / Commercialization ${s.money} / Career ${s.resume} / Content ${s.content} — 综合 AI Project ${s.aiScore}`),
  ];
}

/* 产品总监视角：边界考虑 / 痛点分析 / 真实案例预测 */
export function buildDirectorView(p: Project) {
  const r = buildReverseEngineering(p);
  const s = computeScores(p);
  return {
    boundary: {
      inScope: [
        `核心闭环「${r.productToTech.feature}」（产品立身之本）`,
        `结果可审核/导出与资产沉淀`,
        `模板/历史复用（留存）`,
      ],
      outScope: [
        "多租户企业级权限/审计（V1 不做，成本高）",
        "复杂社交/社区（与核心 Job 无关）",
        "全功能堆叠（只做高价值功能）",
      ],
      constraints: [
        `模型成本：每次调用都有 Token 成本，需用量分层`,
        `结果不确定性：必须保留「审核/重试」入口`,
        `竞争：巨头可能用生态碾压，需垂直场景差异化`,
      ],
      verdict: `边界结论：产品应先做窄而深（聚焦「${r.productToTech.productRequirement}」），再用资产化+生态化扩边界；当前边界合理，但「${r.productToTech.output}」的资产化程度决定长期价值。`,
    },
    pain: {
      deep: `用户最痛的不是「没有工具」，而是「${problemOf(p)}」带来的低效/焦虑/机会成本；表面需求「${coreFeatureOf(p)}」，真正 Job 是「${deepNeedOf(p)}」。`,
      journeyFriction: r.userJourney.filter((u) => u.aiRole === "None" || u.step.includes("修改") || u.step.includes("配置")).map((u) => `「${u.step}」：${u.why}`).join("；") || "上手配置是主要摩擦点",
      unmet: `未被满足的需求：「${latentNeedOf(p)}」——这是下一版与商业化的机会窗口。`,
    },
    cases: [
      {
        name: "案例 A · 个人效率场景",
        user: targetUsersOf(p).split("、")[0],
        scenario: sceneOf(p),
        before: "原方案：人工/旧工具，耗时且不稳定",
        after: `使用 ${p.name}：${r.productToTech.feature}，分钟级出结果`,
        outcome: `预期：效率提升、产出可复用；风险：结果需人工审核`,
        metric: "激活率 / 周完成 Job 数 / 留存",
      },
      {
        name: "案例 B · 团队/企业场景",
        user: "中小企业团队负责人",
        scenario: "团队协作与知识复用",
        before: "能力分散在个人，无法沉淀",
        after: `${p.name} 的资产/模板沉淀 + 统一工作流`,
        outcome: `预期：团队产能提升；风险：权限与合规`,
        metric: "团队周活跃 / 资产创建数 / 付费转化",
      },
      {
        name: "案例 C · 副业/创业场景",
        user: "个人开发者 / 一人公司",
        scenario: "用 ${p.name} 二次开发做垂直产品",
        before: "从 0 造轮子，周期长",
        after: `基于「${r.productToTech.workflow}」做垂直版（${latentNeedOf(p)}）`,
        outcome: `预期：7-30 天出 MVP；风险：竞争与获客`,
        metric: "MVP 周期 / 种子用户 / 付费验证",
      },
    ],
    score: s,
  };
}

function P(p: Project) { return p.profile; }


/* ── 完整链路：用户问题 → … → 可复制性（平台灵魂） ─────────────── */
export interface ChainStage {
  stage: number;
  label: string;
  key: string;
  content: string;
  evidence?: string;
}

export function buildCompleteChain(p: Project): ChainStage[] {
  const r = buildReverseEngineering(p);
  const needs = buildHiddenNeeds(p);
  const jtbd = buildJTBD(p);
  const clone = buildCloningPlan(p);
  const killer = buildKillerFeature(p);
  const stack = r.techStackExplained.map((t) => t.tech).join(" / ");
  const deploy = [r.sourceArchitecture.tree[r.sourceArchitecture.tree.length - 1] ?? "Cloud", ...(stack.includes("Docker") ? ["Docker"] : []), "自托管/云"].join(" · ");
  return [
    { stage: 1, label: "用户问题", key: "question", content: `用户问：「${r.productToTech.productRequirement}」怎么办？${jtbd.when}` },
    { stage: 2, label: "需求", key: "requirement", content: `表层：${needs.surface}；核心：${needs.core}；深层：${needs.deep}；潜在：${needs.latent}` },
    { stage: 3, label: "产品方案", key: "solution", content: `${p.name}＝「${p.tagline}」；一句话模型：${r.productToTech.productRequirement}` },
    { stage: 4, label: "功能", key: "feature", content: `核心功能：${r.productToTech.feature}；Feature Map：${r.featureToCode.map((f) => f.feature).join(" · ")}` },
    { stage: 5, label: "UX", key: "ux", content: r.productToTech.ux },
    { stage: 6, label: "Workflow", key: "workflow", content: r.productDnaFlow.join(" → ") },
    { stage: 7, label: "AI能力", key: "ai", content: `${r.productToTech.ai}；AI 组件：${r.aiArchitecture.slice(0, 8).map((a) => a.component).join(" · ")}` },
    { stage: 8, label: "数据流", key: "data", content: `${r.productToTech.infrastructure}；${dataOf(p)}` },
    { stage: 9, label: "技术架构", key: "architecture", content: `${r.sourceArchitecture.tree.slice(0, 6).join(" / ")}；选型：${stack}` },
    { stage: 10, label: "源码模块", key: "code", content: r.sourceArchitecture.coreModules.map((m) => `${m.module}(${m.evidence})`).join(" / ") },
    { stage: 11, label: "部署", key: "deploy", content: `${deploy}；成本：${clone.cost}` },
    { stage: 12, label: "商业模式", key: "business", content: `${r.businessModelDetail.streams.join(" / ")}；${r.businessModelDetail.moneyPoint}` },
    { stage: 13, label: "增长", key: "growth", content: growthOf(p) },
    { stage: 14, label: "可复制性", key: "replicable", content: `MVP=${clone.mvp}；周期=${clone.timeline}；团队=${clone.team}；风险=${clone.risk}；护城河=${moatOf(p)}；复制点：${killer.copyable}` },
  ];
}

/** 技术路线主线：用户 → … → Moat（22 节点深层链路） */
export function buildTechRouteMainline(p: Project): MapNode[] {
  const r = buildReverseEngineering(p);
  const needs = buildHiddenNeeds(p);
  const jtbd = buildJTBD(p);
  const killer = buildKillerFeature(p);
  const N = (node: string, detail: string, explain: string[], questions: string[], evidence = "Inferred"): Omit<MapNode, "answers"> => ({ node, detail, explain, questions, evidence });
  return [
    N("用户", targetUsersOf(p), [targetUsersOf(p), "先做细分人群的深度价值，再扩展泛人群", "种子用户 = 需求最痛、最早传播的人"], ["谁最先付费？", "谁最先传播？"]),
    N("为什么需要", problemOf(p), ["市场背景：AI 能力成熟 + 用户痛点真实", `现有方案低效：${problemOf(p)}`, "时机：2026 窗口 + 新 AI 能力可落地"], ["为什么是现在出现？", "以前为什么做不了？"]),
    N("用户痛点", painPointOf(p), [painPointOf(p), "旧方案成本：时间/人力/学习/错误率", "痛点越痛，产品越容易冷启动"], ["用户现在怎么解决？", "解决得有多差？"]),
    N("用户需求", needs.core, [needs.core, "表层需求是功能，深层需求是 Job", `潜在需求：${needs.latent}`], ["用户嘴上要什么？", "用户真正要什么？"]),
    N("产品解决方案", `${p.name}＝${p.tagline}`, [`一句话模型：${r.productToTech.productRequirement}`, "方案 = 用户 Job 的最小闭环", "价值主张：更快/更稳/更省"], ["这个方案为什么比旧方案好 10 倍？", "用户为什么愿意换？"]),
    N("功能设计", r.productToTech.feature, [`核心功能：${r.productToTech.feature}`, killer.why, `Feature Map：${r.featureToCode.map((f) => f.feature).join(" · ")}`], ["删掉它产品还成立吗？", "哪些是增长/商业化功能？"]),
    N("UX / UI", r.productToTech.ux, [r.productToTech.ux, "3 秒看懂 / 30 秒判断 / 3 分钟会用", "结果可审核、错误可解释、可重试"], ["首次体验够快吗？", "出错时用户有救吗？"]),
    N("用户操作流程", r.userJourney.slice(0, 6).map((u) => u.step).join(" → "), ["进入 → 注册 → 选任务 → 输入 → 理解 → 执行 → 结果 → 修改 → 复用", "每一步都有用户目标与系统响应", "流程中哪一步流失最多？"], ["哪里最容易流失？", "能否 5 分钟出第一个结果？"]),
    N("产品 Workflow", r.productDnaFlow.join(" → "), [r.productDnaFlow.join(" → "), "Workflow 是产品化的核心资产", "每步：为什么存在/谁负责/输入输出/失败处理"], ["哪一步决定质量？", "哪一步最贵？"]),
    N("LLM", "模型生成/规划/推理", ["承担意图理解、生成与推理", "模型选择影响成本与质量", "Prompt/结构化输出控制结果"], ["为什么需要 LLM？", "换模型会怎样？"], "Inferred"),
    N("RAG", p.categories.includes("rag") || p.categories.includes("pkm") ? "知识检索增强" : "按需接入", ["把外部知识注入 Context", "检索质量决定回答质量", "切分/嵌入/重排是关键技术"], ["RAG 是核心价值吗？", "数据从哪来？"], "Inferred"),
    N("Agent", p.categories.includes("agent") ? "任务编排/工具调用" : "单步增强", ["多步任务需要规划+工具+记忆", "Agent 让用户从操作者变审核者", "可靠性靠校验/重试/人在回路"], ["为什么用 Agent 而不是 Chatbot？", "失败如何恢复？"], "Inferred"),
    N("Tools", "工具/外部服务", ["工具扩展模型能力边界（搜索/代码/浏览器）", "工具失败需要降级/重试", "权限与安全是工具层关键"], ["哪些工具是核心？", "工具失败怎么办？"], "Inferred"),
    N("MCP", p.categories.includes("mcp") ? "标准工具协议" : "可选", ["MCP 标准化工具接入，生态互操作", "降低接入成本，扩大工具网络", "当前为可选（[HYPOTHESIS]）"], ["接入 MCP 的价值？", "工具生态怎么长？"], "Hypothesis"),
    N("Data", dataOf(p), [dataOf(p), "数据是 RAG/个性化/护城河的燃料", "每次使用沉淀资产 = 留存与复利"], ["数据从哪来？", "是否形成资产？"], "Inferred"),
    N("API", "服务端接口", ["API 是前后端与第三方契约", "鉴权/限流/可观测保障稳定", "开放 API = 生态与变现"], ["哪些 API 最重要？", "开放还是封闭？"], "Inferred"),
    N("Backend", "核心引擎/服务", ["编排核心流程与任务", "队列/缓存/状态管理", "可观测与限流保障稳定性"], ["哪个服务最核心？", "并发怎么处理？"], "Inferred"),
    N("Database", "存储/向量库/缓存", ["关系数据 + 向量库 + 缓存", "数据模型决定扩展性", "数据资产沉淀"], ["存什么？", "多久留？"], "Inferred"),
    N("Frontend", `${p.language} 前端/入口`, ["前端承载 3 秒体验与流式反馈", "输入体验决定转化", "Web/CLI/移动形态选择"], ["入口形态对吗？", "首屏够快吗？"], "Inferred"),
    N("Source Code", p.fullName, [`仓库：${p.fullName}`, r.sourceArchitecture.tree.slice(0, 5).join(" / "), "源码是唯一事实源，README 只是入口"], ["目录能对应产品模块吗？", "核心逻辑在哪？"], "Confirmed"),
    N("Deployment", "Cloud / 自托管", ["部署决定成本与数据可控性", "开源可自托管 = 企业信任", "托管/私有化双轨是常见变现"], ["自托管还是 SaaS？", "部署成本多高？"], "Inferred"),
    N("Business", r.businessModelDetail.streams.slice(0, 3).join(" / "), [r.businessModelDetail.moneyPoint, "开源获客 → 托管/企业版/API 变现", "商业模式决定可持续性"], ["真正的赚钱点在哪？", "谁愿意付费？"], "Inferred"),
    N("Growth", growthOf(p), [growthOf(p), "增长引擎：口碑/内容/工具链嵌入", "飞轮 = 使用 → 资产 → 传播"], ["为什么能持续增长？", "飞轮起点在哪？"], "Inferred"),
    N("Moat", moatOf(p), [moatOf(p), "护城河 = 数据 × 场景 × 分发", "生态/工作流锁定让用户难以离开"], ["它为什么能持续存在？", "大厂做了怎么办？"], "Inferred"),
  ].map((n) => ({ ...n, answers: n.questions.map((qq) => answerQuestion(p, n.node, qq)) }));
}


/* ── 全景图自问自答（Q→A 报告） ─────────────────────────────────── */
export interface QAItem {
  node: string;
  qa: { q: string; a: string }[];
}

export function buildPanoramaQA(p: Project): QAItem[] {
  return buildPanorama(p).map((n) => ({ node: n.node, qa: n.questions.map((q, i) => ({ q, a: n.answers[i] ?? "" })) }));
}

export function buildMainlineQA(p: Project): QAItem[] {
  return buildTechRouteMainline(p).map((n) => ({ node: n.node, qa: n.questions.map((q, i) => ({ q, a: n.answers[i] ?? "" })) }));
}

export function buildQaMarkdown(p: Project): string {
  const L: string[] = [`# ${p.name} · 产品全景图自问自答`, `> ${p.fullName} · ${p.tagline}`, ""];
  const push = (title: string, items: QAItem[]) => {
    L.push(`## ${title}`, "");
    for (const it of items) {
      L.push(`### ${it.node}`, "");
      it.qa.forEach((x) => L.push(`**Q：${x.q}**`, `> A：${x.a}`, ""));
    }
  };
  push("产品全景图", buildPanoramaQA(p));
  push("技术路线主线", buildMainlineQA(p));
  L.push("---", `*由 AI OSS Intel 自动生成 · ${new Date().toISOString().slice(0, 10)}*`);
  return L.join("\n");
}
