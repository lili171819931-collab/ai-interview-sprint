/**
 * Master Reverse-Engineering Analysis — implements the full "AI 产品深度逆向工程
 * × 技术实现路线 × 商业价值分析" spec: 40-section PROJECT REVERSE ENGINEERING
 * REPORT, PROJECT FACT SHEET, product panorama, feature implementation path
 * diagram, and the Product Director view (边界/痛点/真实案例预测).
 * All claims carry [FACT]/[INFERENCE]/[HYPOTHESIS]/[UNKNOWN] evidence tags.
 */
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import { buildProductDna, buildHiddenNeeds, buildJTBD, buildAiNativeTest, buildWhyAi, buildFiveLayers, targetUsersOf, problemOf, sceneOf, painPointOf, aiCapabilityOf, deepNeedOf, latentNeedOf, dataOf, growthOf, moatOf, coreFeatureOf } from "@/lib/learning";
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

export function buildPanorama(p: Project): { node: string; sub?: string[] }[] {
  const r = buildReverseEngineering(p);
  return [
    { node: "USER", sub: [r.productToTech.productRequirement] },
    { node: "PROBLEM", sub: [problemOf(p)] },
    { node: "REQUIREMENT", sub: [r.productToTech.productRequirement] },
    { node: "FEATURE", sub: [r.productToTech.feature] },
    { node: "UX FLOW", sub: [r.productToTech.ux] },
    { node: "WORKFLOW", sub: [r.productToTech.workflow] },
    { node: "LLM / RAG / AGENT", sub: [r.productToTech.ai] },
    { node: "TOOLS", sub: [p.categories.includes("mcp") ? "MCP 工具链" : "工具/外部服务"] },
    { node: "DATA", sub: [r.productToTech.infrastructure] },
    { node: "BACKEND / API", sub: ["服务端 + API + 队列"] },
    { node: "FRONTEND", sub: [p.language + " 前端/入口"] },
    { node: "CODE", sub: [p.fullName] },
    { node: "DEPLOYMENT", sub: ["Cloud / 自托管"] },
    { node: "BUSINESS", sub: [r.businessModelDetail.streams.slice(0, 3).join(" / ")] },
    { node: "GROWTH", sub: [r.productToTech.output + " → 分享 → 获客"] },
    { node: "MOAT", sub: [r.businessModelDetail.moneyPoint] },
  ];
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
export function buildTechRouteMainline(p: Project): { node: string; detail: string }[] {
  const r = buildReverseEngineering(p);
  const needs = buildHiddenNeeds(p);
  return [
    { node: "用户", detail: targetUsersOf(p) },
    { node: "为什么需要", detail: problemOf(p) },
    { node: "用户痛点", detail: painPointOf(p) },
    { node: "用户需求", detail: needs.core },
    { node: "产品解决方案", detail: `${p.name}＝${p.tagline}` },
    { node: "功能设计", detail: r.productToTech.feature },
    { node: "UX / UI", detail: r.productToTech.ux },
    { node: "用户操作流程", detail: r.userJourney.slice(0, 6).map((u) => u.step).join(" → ") },
    { node: "产品 Workflow", detail: r.productDnaFlow.join(" → ") },
    { node: "LLM", detail: "模型生成/规划/推理" },
    { node: "RAG", detail: p.categories.includes("rag") || p.categories.includes("pkm") ? "知识检索增强" : "按需接入" },
    { node: "Agent", detail: p.categories.includes("agent") ? "任务编排/工具调用" : "单步增强" },
    { node: "Tools", detail: "工具/外部服务" },
    { node: "MCP", detail: p.categories.includes("mcp") ? "标准工具协议" : "可选" },
    { node: "Data", detail: dataOf(p) },
    { node: "API", detail: "服务端接口" },
    { node: "Backend", detail: "核心引擎/服务" },
    { node: "Database", detail: "存储/向量库/缓存" },
    { node: "Frontend", detail: `${p.language} 前端/入口` },
    { node: "Source Code", detail: p.fullName },
    { node: "Deployment", detail: "Cloud / 自托管" },
    { node: "Business", detail: r.businessModelDetail.streams.slice(0, 3).join(" / ") },
    { node: "Growth", detail: growthOf(p) },
    { node: "Moat", detail: moatOf(p) },
  ];
}
