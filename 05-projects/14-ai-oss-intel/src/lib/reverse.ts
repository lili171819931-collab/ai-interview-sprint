/**
 * Reverse Engineering OS — turns every project into an AI Product Reverse
 * Engineering Lab: user journey, implementation path, source-code→feature map,
 * tech-decision explanations, MVP reverse, 40-section intelligence report.
 * All technical claims carry an Evidence Mode tag (Confirmed/Inferred/Hypothesis/Unknown).
 */
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { categoryOf } from "@/lib/categories";
import { scenariosOf } from "@/lib/scenarios";
import {
  targetUsersOf, problemOf, deepNeedOf, sceneOf, coreFeatureOf, aiCapabilityOf,
  workflowOf, outcomeOf, businessOf, latentNeedOf, painPointOf, dataOf, uxOf,
  growthOf, moatOf, needOf,
} from "@/lib/learning";
import type {
  ImplStep, JourneyStep, MvpReverse, MyProjectReport, ProductDecision, ProductToTechMap,
  Project, ReverseEngineering, TechChoice, ValueScore,
} from "@/lib/types";

const P = (p: Project) => p.profile;

export function buildReverseEngineering(p: Project): ReverseEngineering {
  const s = computeScores(p);
  const cat = categoryOf(p.categories[0] ?? "agent").name;
  const isAgent = p.categories.includes("agent");
  const isRag = p.categories.includes("rag") || p.categories.includes("pkm");
  const isCoding = p.categories.includes("coding");
  const isContent = p.categories.includes("content") || p.categories.includes("video") || p.categories.includes("image");

  /* PRODUCT DNA flow (§13) */
  const productDnaFlow = [
    "Input：用户输入目标/需求",
    "User Intent：系统解析真实意图",
    "Decision：判断是否需要执行/查询/生成",
    "Workflow：进入「" + workflowOf(p) + "」",
    "AI Processing：模型理解与规划",
    isAgent ? "Tool Calling：调用工具（搜索/代码/浏览器/文件）" : "Tool Calling：调用必要的外部服务",
    isRag ? "Data Retrieval：从向量库/知识库检索上下文" : "Data Retrieval：按需获取数据",
    "Reasoning：模型基于上下文推理",
    "Action：执行动作/生成内容",
    "Output：产出结构化结果",
    "Feedback：用户反馈/评分",
    "Memory：沉淀记忆与历史（" + latentNeedOf(p) + "）",
    "Next Action：基于记忆与反馈进入下一轮",
  ];

  /* User Journey (§14) */
  const userJourney: JourneyStep[] = [
    { step: "用户进入", what: "打开产品入口（Web/CLI/IDE）", why: "低摩擦触达价值", module: "Landing/Entry", input: "—", output: "可交互界面", aiRole: "None" },
    { step: "注册/配置", what: "登录或配置 API Key/数据源", why: "建立身份与权限", module: "Auth/Settings", input: "账号/密钥", output: "可用会话", aiRole: "None" },
    { step: "选择任务", what: "从模板/历史/空白开始", why: "降低启动成本", module: "Task/Home", input: "模板列表", output: "任务草稿", aiRole: "None" },
    { step: "输入需求", what: "用自然语言描述目标", why: "自然语言是 AI 产品的默认输入", module: "Input UI", input: "用户文本/文件", output: "需求文本", aiRole: "None" },
    { step: "系统理解", what: "解析意图、提取关键参数", why: "把模糊需求转成可执行计划", module: "Intent Service", input: "需求文本", output: "结构化意图", aiRole: "AI" },
    { step: "AI Planning", what: "生成执行计划/拆解子任务", why: "复杂任务需要规划", module: "Planner", input: "结构化意图", output: "任务计划", aiRole: "Agent" },
    { step: "调用 Tool", what: "按需调用搜索/代码/浏览器/文件工具", why: "模型无法独立获取外部信息", module: "Tool Runtime", input: "计划步骤", output: "工具结果", aiRole: isAgent ? "Agent" : "AI" },
    { step: "获取数据", what: isRag ? "检索知识库/向量库" : "拉取所需数据", why: "为生成提供上下文证据", module: "Data/Retrieval", input: "查询", output: "相关片段", aiRole: isRag ? "RAG" : "Workflow" },
    { step: "执行 Workflow", what: "按流程推进多步处理", why: "保证结果一致性", module: "Workflow Engine", input: "计划+数据", output: "中间结果", aiRole: "Workflow" },
    { step: "生成结果", what: "LLM 综合生成最终输出", why: "把处理结果转成用户语言", module: "LLM Service", input: "上下文", output: "结果文本/文件", aiRole: "AI" },
    { step: "用户修改", what: "用户编辑/调整结果", why: "人在回路，保证可控", module: "Editor UI", input: "初稿", output: "修订稿", aiRole: "None" },
    { step: "再次执行", what: "按修改重新生成", why: "迭代优化", module: "Pipeline", input: "修订稿", output: "终稿", aiRole: "Workflow" },
    { step: "最终输出", what: "导出/保存结果", why: "形成资产", module: "Export/Storage", input: "终稿", output: "文件/记录", aiRole: "None" },
    { step: "分享", what: "生成分享链接/模板", why: "传播与获客", module: "Share", input: "结果", output: "分享页", aiRole: "None" },
    { step: "复用", what: "沉淀为模板/历史供下次使用", why: "留存与飞轮", module: "Assets/History", input: "结果", output: "可复用资产", aiRole: "None" },
  ];

  /* Implementation path (§16) */
  const implementationPath: ImplStep[] = [
    { step: "用户输入问题", layer: "Frontend", detail: "前端捕获输入并校验", evidence: "Confirmed" },
    { step: "API 请求", layer: "API", detail: "统一网关鉴权、限流", evidence: "Inferred" },
    { step: "Backend 处理", layer: "Backend", detail: "任务入队/会话管理", evidence: "Inferred" },
    { step: "Intent Recognition", layer: "AI", detail: "提示词/轻量分类解析意图", evidence: "Inferred" },
    { step: "Prompt / System Instruction", layer: "AI", detail: "系统提示词注入角色与规则", evidence: "Inferred" },
    { step: "LLM 调用", layer: "AI", detail: "调用主模型生成/规划", evidence: "Confirmed" },
    { step: "Tool Selection", layer: isAgent ? "Agent" : "Workflow", detail: "按需选择工具", evidence: isAgent ? "Inferred" : "Hypothesis" },
    { step: "Tool Calling", layer: isAgent ? "Agent" : "Workflow", detail: "执行外部调用", evidence: "Inferred" },
    { step: "External API / Data", layer: "Data", detail: "取数/检索", evidence: isRag ? "Inferred" : "Hypothesis" },
    { step: "Data Processing", layer: "Data", detail: "清洗/切分/结构化", evidence: "Inferred" },
    { step: "LLM Reasoning", layer: "AI", detail: "多步推理生成", evidence: "Inferred" },
    { step: "Structured Output", layer: "AI", detail: "JSON Schema 校验输出", evidence: "Inferred" },
    { step: "Frontend Rendering", layer: "Frontend", detail: "流式/卡片渲染结果", evidence: "Inferred" },
    { step: "User Feedback", layer: "UX", detail: "评分/反馈回流", evidence: "Hypothesis" },
  ];

  /* Source architecture reverse (§17) + feature→code mapping (§18) */
  const tree = [
    `src/app|components  — ${p.language} 前端/入口`,
    `src/lib/core        — 核心引擎（${workflowOf(p).split("→")[0]} 主流程）`,
    `src/lib/ai          — 模型 Provider / 提示词 / 工具注册`,
    isRag ? `src/lib/rag        — 文档解析 / 向量化 / 检索` : `src/lib/data        — 数据访问与缓存`,
    `api/                — 服务端接口`,
    `db/                — 数据模型与迁移`,
    `config/            — 配置与部署`,
    `tests/             — 测试`,
  ];
  const coreModules = [
    { module: "entry / UI", role: `接收输入并渲染「${outcomeOf(p)}」`, evidence: "Confirmed" as const },
    { module: "engine", role: `执行「${workflowOf(p)}」主流程`, evidence: "Inferred" as const },
    { module: "ai-provider", role: aiCapabilityOf(p), evidence: "Inferred" as const },
    { module: isRag ? "retriever" : "data-service", role: dataOf(p), evidence: "Inferred" as const },
    { module: "templates / assets", role: `沉淀「${latentNeedOf(p)}」`, evidence: "Hypothesis" as const },
  ];

  const featureToCode = [
    { feature: coreFeatureOf(p), chain: ["Feature UI", "Engine API", "Core Engine", "AI Provider", "Tool/Data", "Storage", "Result API"] },
    { feature: "结果导出/分享", chain: ["Export UI", "Export API", "Renderer", "Template Service", "Storage", "Share Link"] },
    { feature: "模板库", chain: ["Template UI", "Template API", "Template Store", "（复用核心引擎）", "DB", "Preview"] },
    { feature: "历史与资产", chain: ["History UI", "Asset API", "Asset Service", "DB", "Usage Log"] },
    { feature: "付费/用量", chain: ["Billing UI", "Billing API", "Usage Meter", "Payment Provider", "DB"] },
  ];

  /* Tech choices explained (§23) */
  const techStackExplained: TechChoice[] = [
    { tech: p.language, why: "生态与团队匹配", alternative: "Go/Rust/TS", impact: "影响并发与开发速度" },
    { tech: "Next.js / React", why: "SEO + 全栈一体 + 生态", alternative: "Vue/Svelte/纯 SSR", impact: "影响 SSR/流式渲染能力" },
    { tech: "LLM Provider（OpenAI/Anthropic/本地）", why: "模型能力即产品能力", alternative: "Ollama/开源模型", impact: "影响成本与可控性" },
    ...(isAgent ? [{ tech: "Agent 编排框架", why: "多步任务需要状态与工具编排", alternative: "自研状态机", impact: "影响扩展性" }] : []),
    ...(isRag ? [{ tech: "向量库（Qdrant/Chroma）", why: "语义检索知识上下文", alternative: "全文检索/混合检索", impact: "影响检索质量" }] : []),
    { tech: "PostgreSQL / Redis", why: "关系数据 + 缓存/队列", alternative: "MongoDB/SQLite", impact: "影响一致性/成本" },
    { tech: "Structured Output（Zod/Instructor）", why: "保证结果可被产品消费", alternative: "纯文本解析", impact: "影响可靠性" },
  ];

  /* Product → Technology mapping (§24) */
  const productToTech: ProductToTechMap = {
    productRequirement: deepNeedOf(p),
    feature: coreFeatureOf(p),
    ux: uxOf(p),
    workflow: workflowOf(p),
    ai: aiCapabilityOf(p),
    infrastructure: `API + ${isRag ? "向量库" : "数据库"} + 任务队列 + 存储`,
    output: outcomeOf(p),
  };

  /* If I were the PM (§25) */
  const ifWerePm = {
    keep: [coreFeatureOf(p), "结果可审核/导出", "模板与历史沉淀"],
    remove: ["为「做多」而堆的功能", "未验证的高成本模块"],
    add: ["3 分钟上手引导", "结果对比/评测", "团队协作（V1.5）"],
    redesign: [`把「${workflowOf(p).split("→")[0]}」做成可组合模块`, "把资产沉淀做成默认体验"],
    priority: [`先验证「${deepNeedOf(p)}」的付费意愿`, "再补增长与分发"],
    notDo: ["不盲目加模型/渠道", "不做与核心 Job 无关的社区"],
  };

  /* MVP reverse (§26) */
  const mvpReverse: MvpReverse = {
    mvp: [coreFeatureOf(p), "单用户闭环", "结果导出", "基础模板"],
    v1: ["模板库 + 历史", "分享钩子", "用量计量"],
    v2: ["团队协作", "插件/API 开放", "垂直行业模板"],
    scale: ["生态市场", "企业版/私有化", "多数据源"],
  };

  /* Product decisions (§27) */
  const productDecisions: ProductDecision[] = [
    { decision: "采用开源/免费策略", reason: "降低信任门槛、获得社区增长", tradeoff: "放弃直接售卖软件", alternative: "闭源 SaaS" },
    { decision: isAgent ? "采用 Agent 而非 Chatbot" : "采用 AI 增强而非纯规则", reason: `任务本质是「${workflowOf(p)}」多步闭环`, tradeoff: "复杂度与成本上升", alternative: "单轮问答/规则脚本" },
    { decision: isRag ? "引入 RAG/知识库" : "引入数据层", reason: "需要外部上下文支撑结果", tradeoff: "检索质量依赖数据", alternative: "纯模型生成" },
    { decision: "提供 API/插件", reason: "嵌入用户工作流、扩大分发", tradeoff: "承担基础设施成本", alternative: "仅封闭产品" },
    { decision: "自托管/云托管并存", reason: "兼顾隐私敏感与易用用户", tradeoff: "运维复杂度", alternative: "仅 SaaS" },
  ];

  /* Business model (§28) + opportunities (§29) */
  const businessModelDetail = {
    streams: ["开源免费获客", "托管云订阅", "API 按量", "企业版/私有化", "插件/模板市场", "服务/咨询"],
    moneyPoint: `真正的赚钱点：${P(p).commercialPotential >= 7 ? "托管/企业版的稳定订阅 + 模板市场" : "服务/咨询与定制交付"}；模型成本必须靠用量分层消化。`,
  };
  const businessOpportunities = [
    { type: "SaaS", opportunity: `把 ${p.name} 核心能力托管为 SaaS（${latentNeedOf(p)}）` },
    { type: "Plugin", opportunity: "做成 IDE/浏览器/工作台插件嵌入现有工具" },
    { type: "Skill", opportunity: `封装为 Agent Skill（/analyze-${p.slug}）` },
    { type: "API", opportunity: "开放按量计费 API" },
    { type: "Consulting", opportunity: "企业落地部署与定制服务" },
    { type: "Automation Service", opportunity: "代运营/自动化托管服务" },
    { type: "Course", opportunity: "围绕它做教学课程" },
    { type: "Content", opportunity: "教程/拆解内容引流" },
    { type: "Community", opportunity: "垂直社群 + 会员" },
    { type: "Enterprise Solution", opportunity: "私有化 + 安全合规企业方案" },
  ];

  /* Industries (§30) */
  const industries = [
    { industry: "Automotive", scenario: `售后知识/制造文档问答`, value: "降本", difficulty: "高" as const, potential: 70 },
    { industry: "E-commerce", scenario: "商品内容/客服自动化", value: "提效", difficulty: "中" as const, potential: 85 },
    { industry: "Education", scenario: "个性化学习与答疑", value: "体验", difficulty: "中" as const, potential: 80 },
    { industry: "Finance", scenario: "报告生成/合规审查", value: "提质", difficulty: "高" as const, potential: 88 },
    { industry: "Marketing", scenario: "内容批量生产与洞察", value: "规模", difficulty: "低" as const, potential: 86 },
    { industry: "Media", scenario: "创作辅助/素材管线", value: "效率", difficulty: "低" as const, potential: 82 },
    { industry: "Healthcare", scenario: "知识库辅助/患者沟通", value: "合规", difficulty: "高" as const, potential: 90 },
    { industry: "Enterprise", scenario: "内部知识/自动化流程", value: "ROI", difficulty: "中" as const, potential: 84 },
    { industry: "Developer", scenario: "开发提效/工具链嵌入", value: "生产力", difficulty: "低" as const, potential: 92 },
    { industry: "Creator", scenario: "内容工作流/模板市场", value: "变现", difficulty: "低" as const, potential: 87 },
  ];

  /* Competition (§31) */
  const competitors = [
    { type: "Direct", name: `同类 ${cat} 开源项目`, note: "功能相近、社区竞逐" },
    { type: "Indirect", name: "传统工具/人工流程", note: "用户当前的替代方案" },
    { type: "Commercial", name: "闭源 SaaS（如头部厂商）", note: "体验完整但价格高" },
    { type: "Open Source", name: "生态内替代实现", note: "可自托管、可二开" },
  ];
  const comparison = [
    `核心差异：${p.name} 主打「${deepNeedOf(p)}」的零门槛封装`,
    `UX：${uxOf(p)}`,
    `AI：${aiCapabilityOf(p)}`,
    `价格：开源免费/托管付费（${businessOf(p)}）`,
    `社区：${p.contributors.toLocaleString()} 贡献者 · ${formatStars(p.stars)} Stars`,
    `Moat：${moatOf(p)}`,
    `Growth：${growthOf(p)}`,
  ];

  /* Value scores (§32) */
  const valueScores: ValueScore[] = [
    { label: "Product Value", value: s.product, color: "#60a5fa" },
    { label: "AI Innovation", value: Math.round(P(p).innovation * 10), color: "#7dd3fc" },
    { label: "Technical Innovation", value: s.technical, color: "#34d399" },
    { label: "User Value", value: Math.round(P(p).userDemand * 10), color: "#fbbf24" },
    { label: "Business Value", value: s.commercial, color: "#f87171" },
    { label: "Open Source Value", value: s.health, color: "#2dd4bf" },
    { label: "AI PM Learning Value", value: s.resume, color: "#c084fc" },
    { label: "Career Value", value: s.resume, color: "#a78bfa" },
    { label: "Content Value", value: s.content, color: "#f472b6" },
    { label: "Growth Potential", value: s.growth, color: "#fb923c" },
  ];

  /* AI Architecture (§20) */
  const aiArchitecture = [
    { component: "Model", role: aiCapabilityOf(p) },
    { component: "Prompt", role: "角色/规则/任务指令注入" },
    { component: "Context", role: "会话与任务上下文组装" },
    { component: "Memory", role: `历史/偏好（${latentNeedOf(p)}）` },
    { component: "RAG", role: isRag ? "文档检索增强回答" : "按需接入" },
    { component: "Embedding", role: isRag ? "文本向量化" : "可选" },
    { component: "Vector DB", role: isRag ? "语义检索存储" : "可选" },
    { component: "Agent", role: isAgent ? "任务规划与工具编排" : "单步增强" },
    { component: "Tool", role: "外部能力扩展（搜索/代码/浏览器）" },
    { component: "MCP", role: "标准工具协议接入" },
    { component: "Workflow", role: workflowOf(p) },
    { component: "Evaluation", role: "输出质量评测（Hypothesis）" },
    { component: "Guardrail", role: "内容安全/输入校验（Hypothesis）" },
    { component: "Caching", role: "降低重复调用成本" },
    { component: "Observability", role: "成本/延迟/质量监控" },
  ];

  /* Learning value (§33) */
  const learningValue = [
    `需求分析：看它如何把「${problemOf(p)}」转成产品`,
    `Agent/Workflow：研究「${workflowOf(p)}」的产品化封装`,
    `AI UX：学习「${uxOf(p)}」如何降低使用门槛`,
    `商业化：理解「${businessOf(p)}」的变现路径`,
    `增长：研究「${growthOf(p)}」的飞轮`,
    `技术架构：从「${p.language} + 核心引擎 + 数据层」理解产品如何被实现`,
  ];

  /* Media value (§34) */
  const mediaInsight = `真正厉害的是「${workflowOf(p)}」被封装成了零门槛体验，而不是模型本身。`;
  const mediaValue = {
    worth: P(p).contentFit >= 6,
    hook: `为什么「${p.name}」能快速增长？从产品经理角度拆解它的设计。`,
    topic: `${p.name} 的产品逻辑与用户需求`,
    angle: "产品经理视角（用户→场景→Job→设计→商业）",
    controversy: "它真的需要 AI 吗？还是换个壳的旧工具？",
    pmInsight: mediaInsight,
    title: `为什么这个 AI 项目能火？${p.name} 的产品拆解`,
    script: `Hook（${p.name} 突然爆火）→ Problem（${problemOf(p)}）→ Product（${coreFeatureOf(p)}）→ Why（${deepNeedOf(p)}）→ 拆解（${workflowOf(p)}）→ Business（${businessOf(p)}）→ 我的观点（${mediaInsight}）→ CTA`,
    thumbnail: `${p.name} Logo + 增长曲线 + 关键词「产品拆解」`,
  };

  return {
    productDnaFlow,
    userJourney,
    implementationPath,
    sourceArchitecture: { tree, coreModules },
    featureToCode,
    techStackExplained,
    productToTech,
    ifWerePm,
    mvpReverse,
    productDecisions,
    businessModelDetail,
    businessOpportunities,
    industries,
    competitors,
    comparison,
    valueScores,
    aiArchitecture,
    learningValue,
    mediaValue,
  };
}

/* 40-section PROJECT INTELLIGENCE REPORT (§48) */
export function buildIntelligenceReport(p: Project): { n: number; title: string; body: string }[] {
  const r = buildReverseEngineering(p);
  const s = computeScores(p);
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const jtbd = `${deepNeedOf(p)}`;
  const report = [
    f(1, "Executive Summary", `${p.name} 是「${p.tagline}」，当前 ${formatStars(p.stars)} Stars，30 天 ${formatSigned(p.growth30d)}（${formatPct(growthRate(p, 30))}），AI Project Score ${s.aiScore}，Opportunity ${s.opportunity}。一句话：${jtbd}。`),
    f(2, "Project Overview", `${p.fullName} · ${p.language} · ${p.license ?? "—"} · 发布于 ${p.createdAt} · ${p.description}`),
    f(3, "Why This Product", `因为「${problemOf(p)}」在 AI 时代被放大，` + `需要「${deepNeedOf(p)}」。`),
    f(4, "Target Users", targetUsersOf(p)),
    f(5, "User Scenarios", sceneOf(p) + "；场景分类：" + scenariosOf(p).map((x) => x.group + "·" + x.name).join(" / ")),
    f(6, "Jobs To Be Done", `When ${sceneOf(p)} → I want ${coreFeatureOf(p)} → So that ${jtbd}`),
    f(7, "Pain Points", painPointOf(p)),
    f(8, "Requirement Analysis", needOf(p) + "；深层：" + deepNeedOf(p) + "；潜在：" + latentNeedOf(p)),
    f(9, "Product Logic", r.productDnaFlow.join(" → ")),
    f(10, "User Journey", r.userJourney.map((u) => `${u.step}（${u.module}）：${u.what}`).join(" → ")),
    f(11, "Feature Map", `${coreFeatureOf(p)}（Core）· 模板/导出（Supporting）· 分享（Growth）· 用量/付费（Monetization）· 存储/权限（Infrastructure）`),
    f(12, "Core Workflow", workflowOf(p)),
    f(13, "AI Capability", aiCapabilityOf(p)),
    f(14, "Agent Architecture", isAgent(p) ? `User → Planner → Reasoner → Tool Selector → Tool → Observation → Memory → Planner → Final Answer；为什么用 Agent：${deepNeedOf(p)} 需要多步编排。` : "当前为单步增强，未使用多 Agent。"),
    f(15, "RAG / MCP / Memory", `${isRag(p) ? "RAG：文档检索增强；" : "RAG：可选接入；"}MCP：标准工具协议；Memory：${latentNeedOf(p)}`),
    f(16, "Data Flow", dataOf(p)),
    f(17, "System Architecture", r.sourceArchitecture.tree.join(" / ")),
    f(18, "Source Code Architecture", r.sourceArchitecture.coreModules.map((m) => `${m.module}（${m.evidence}）— ${m.role}`).join("；")),
    f(19, "Feature → Code Mapping", r.featureToCode.map((x) => `${x.feature} → ${x.chain.join(" → ")}`).join("；")),
    f(20, "Implementation Path", r.implementationPath.map((x) => `${x.step}(${x.evidence})`).join(" → ")),
    f(21, "Technical Decisions", r.techStackExplained.map((t) => `${t.tech}：${t.why}`).join("；")),
    f(22, "Product Decisions", r.productDecisions.map((d) => `${d.decision}（理由：${d.reason}）`).join("；")),
    f(23, "MVP", r.mvpReverse.mvp.join(" + ")),
    f(24, "Product Evolution", `MVP → V1（${r.mvpReverse.v1.join("/")}）→ V2（${r.mvpReverse.v2.join("/")}）→ Scale（${r.mvpReverse.scale.join("/")}）`),
    f(25, "Business Model", r.businessModelDetail.streams.join(" / ") + "；" + r.businessModelDetail.moneyPoint),
    f(26, "Growth Strategy", growthOf(p) + "；冷启动：社区 + 模板分发 + Build in Public"),
    f(27, "Competitive Analysis", r.competitors.map((c) => `${c.type}（${c.name}）：${c.note}`).join("；")),
    f(28, "Industry Applications", r.industries.map((i) => `${i.industry}(${i.difficulty},${i.potential})`).join(" / ")),
    f(29, "Monetization Opportunities", r.businessOpportunities.map((o) => `${o.type}：${o.opportunity}`).join("；")),
    f(30, "Product Strengths", `核心闭环「${workflowOf(p)}」产品化；${uxOf(p)}；${moatOf(p)}`),
    f(31, "Product Weaknesses", `上手成本与结果不确定性；对非技术用户配置门槛高`),
    f(32, "Risks", "上游模型/平台政策；巨头挤压；License 与商业化边界；技术路线被替代"),
    f(33, "What I Would Change", r.ifWerePm.add.join("；") + "；优先：" + r.ifWerePm.priority.join("；")),
    f(34, "AI PM Learning Value", r.learningValue.join("；")),
    f(35, "Career Value", `简历/作品集价值 ${s.resume}/100；适合岗位：AI PM / AI Agent Engineer / Full Stack AI Developer`),
    f(36, "Self-Media Value", `${r.mediaValue.worth ? "值得做内容" : "内容价值一般"}；Title：${r.mediaValue.title}；Hook：${r.mediaValue.hook}`),
    f(37, "Portfolio Value", `可产出 Portfolio Case（Problem/User/Product Logic/AI Architecture/Business/My Decision/Improvement）`),
    f(38, "Interview Questions", "你如何拆解它？它的核心 Job 是什么？如果重新设计你会怎么做？它如何商业化？增长引擎是什么？"),
    f(39, "Personal Product Opinion", `最大创新：${coreFeatureOf(p)} 的产品化封装；最大缺陷：上手成本与结果不确定性；如果我是 PM：${r.ifWerePm.priority.join("；")}`),
    f(40, "Final Score", `AI Project ${s.aiScore} · Opportunity ${s.opportunity} · Technical ${s.technical} · Commercial ${s.commercial} · SideHustle ${s.sideHustle} · Skill ${s.skill} · Resume ${s.resume} · Content ${s.content} · Health ${s.health}`),
  ];
  return report;
}

function isAgent(p: Project) { return p.categories.includes("agent"); }
function isRag(p: Project) { return p.categories.includes("rag") || p.categories.includes("pkm"); }

/* My Project Report (§37) */
export function buildMyProjectReport(p: Project): MyProjectReport {
  const s = computeScores(p);
  return {
    whyStarred: `你可能是因为「${p.tagline}」被吸引：它直接命中「${deepNeedOf(p)}」，或处于高增长期（30 天 +${formatSigned(p.growth30d)}）。`,
    worthStudying: `它值得研究：机会分 ${s.opportunity}/100，技术 ${s.technical}，商业 ${s.commercial}；其「${workflowOf(p)}」的产品化封装是 AI PM 必学范本。`,
    focusLearn: [
      `需求分析：从「${problemOf(p)}」反推需求`,
      `产品设计：「${coreFeatureOf(p)}」的取舍与 UX（${uxOf(p)}）`,
      `AI/Agent：${aiCapabilityOf(p)} 与「${workflowOf(p)}」`,
      `商业化：${businessOf(p)} 的变现路径`,
    ],
    careerHelp: `对 AI PM 转型：建议完成「AI PM 学习模式」Challenge + 写一条个人观点 + 生成一篇自媒体内容 + 沉淀 Portfolio Case，可写进「30 天拆解 N 个 AI 产品」的作品集叙事。`,
    mediaWorth: P(p).contentFit >= 6,
    mediaTitle: `为什么这个 AI 项目能火？${p.name} 的产品拆解`,
    portfolioWorth: s.resume >= 60,
    rebuildWorth: s.opportunity >= 65 || s.sideHustle >= 65,
  };
}
