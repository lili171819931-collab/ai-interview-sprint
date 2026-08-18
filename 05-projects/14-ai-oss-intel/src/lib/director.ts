/**
 * AI Product Director — Head-of-AI-Product level analysis per project.
 * Executive Review + verdict, strategy canvas, market/Why-Now, user
 * segmentation, deep need, value chain, flywheel, feature priority, core loop,
 * design decisions, Where-AI-Matters, AI architecture, reliability, cost model,
 * business model, monetization funnel, growth loop, open-source strategy, moat,
 * risks, lifecycle, roadmap, 30/60/90 plan, Zero→One, 3-feature rule, AI 10×,
 * Product 2.0, interview case, 13-dim director score, director conclusions,
 * and the interactive AI 产品总监全景图.
 */
import { computeScores, formatPct, formatSigned, formatStars } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import { buildHiddenNeeds, buildJTBD, buildAiNativeTest, dataOf, growthOf, moatOf, deepNeedOf, latentNeedOf, problemOf, targetUsersOf, sceneOf, coreFeatureOf, aiCapabilityOf, workflowOf, businessOf } from "@/lib/learning";
import { buildKillerFeature, buildProduct2, buildCloningPlan, buildDirectorView, buildThreeConclusions, answerQuestion, type MapNode } from "@/lib/master";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import type { Project } from "@/lib/types";
import type { LiveRepo } from "@/lib/live";
import type { SourceIntel } from "@/lib/source";
import { answerSourceQuestion } from "@/lib/sourceMaster";

export interface DirectorReport {
  execReview: { q: string; a: string }[];
  verdict: string;
  verdictWhy: string;
  canvas: { k: string; v: string }[];
  market: { tam: string; sam: string; som: string; growth: string; competition: string; whyNow: string };
  segments: { name: string; who: string; goal: string; pain: string; trigger: string; wtp: string }[];
  deepNeed: { surface: string; deep: string; deeper: string };
  valueChain: { step: string; desc: string }[];
  flywheel: { cycle: string[]; judge: string };
  priority: { feature: string; user: number; business: number; ai: number; difficulty: number; strategic: number; keep: boolean }[];
  coreLoop: string[];
  designDecisions: { decision: string; why: string; alternative: string; tradeoff: string; result: string }[];
  aiMatters: { tier: string; desc: string }[];
  aiArch: { layer: string; desc: string }[];
  reliability: { dim: string; score: number; note: string }[];
  costModel: { items: string[]; perTask: string; margin: string };
  business: { whyPay: string; whoPays: string; whenPay: string; keepPaying: string };
  funnel: string[];
  growth: { metrics: string[]; loops: string[]; primary: string };
  oss: { why: string; what: string; notOpen: string; model: string[] };
  moat: { dims: { label: string; value: number }[]; judge: string };
  risks: string[];
  lifecycle: { stage: string; next: string };
  roadmap: { now: string[]; next: string[]; later: string[]; dont: string[] };
  plan90: { d30: string[]; d60: string[]; d90: string[] };
  zeroOne: string[];
  threeFeatures: { keep: string[]; why: string };
  ai10x: string;
  interview: { productSense: string; aiProduct: string; technical: string; business: string; growth: string; howToAnswer: string };
  scores: { label: string; value: number }[];
  overall: number;
  conclusions: { whyWins: string; whyFails: string; realMoat: string; invest: string; kill: string; buildNext: string; bet: string; betWhy: string };
  panorama: MapNode[];
}

function verdictFor(s: ReturnType<typeof computeScores>): { verdict: string; why: string } {
  if (s.opportunity >= 80 && s.money >= 75) return { verdict: "Strong Buy", why: `机会分 ${s.opportunity}、商业 ${s.money} 双高，市场窗口与变现路径清晰，建议重点投入。` };
  if (s.opportunity >= 70) return { verdict: "Invest", why: `机会分 ${s.opportunity}，值得投入资源验证付费与增长。` };
  if (s.opportunity >= 55) return { verdict: "Watch", why: `机会分 ${s.opportunity}，保持雷达观察，等待数据/时机成熟。` };
  if (s.opportunity >= 40) return { verdict: "Pivot", why: `机会分 ${s.opportunity}，建议转向垂直场景或调整定位。` };
  return { verdict: "Do Not Invest", why: `机会分 ${s.opportunity} 偏低，暂不建议投入。` };
}

const scoreColor = (v: number) => (v >= 80 ? "#34d399" : v >= 60 ? "#7dd3fc" : v >= 40 ? "#fbbf24" : "#f87171");

export function buildDirectorReport(p: Project): DirectorReport {
  const r = buildReverseEngineering(p);
  const s = computeScores(p);
  const needs = buildHiddenNeeds(p);
  const jtbd = buildJTBD(p);
  const killer = buildKillerFeature(p);
  const p2 = buildProduct2(p);
  const clone = buildCloningPlan(p);
  const dv = buildDirectorView(p);
  const three = buildThreeConclusions(p);
  const native = buildAiNativeTest(p);
  const cat = categoryOf(p.categories[0] ?? "agent");
  const ts = TIME_STATUS_META[timeStatusOf(p)].label;

  const exec = [
    ["我为什么批准做这个项目？", `因为「${r.productToTech.productRequirement}」是真实高频需求，且 AI 能把旧方案成本降低一个数量级。`],
    ["我解决的核心问题是什么？", problemOf(p)],
    ["我服务的核心用户是谁？", targetUsersOf(p)],
    ["这个问题值不值得解决？", `值得：机会分 ${s.opportunity}，用户价值 ${Math.round(p.profile.userDemand * 10)}，痛点真实（${dv.pain.deep.slice(0, 40)}…）`],
    ["为什么现在是最佳时间？", `2026 窗口：${ts}；模型/成本/生态成熟（${aiCapabilityOf(p)}）。`],
    ["为什么 AI 能解决？", `AI 承担「${aiCapabilityOf(p)}」，把「${workflowOf(p)}」自动化，用户从操作者变审核者。`],
    ["产品的核心竞争力是什么？", killer.feature + "；" + moatOf(p)],
    ["产品最大的风险是什么？", "模型/平台依赖 + 巨头下场 + 低切换成本；详见战略风险。"],
    ["商业模式是否成立？", `${businessOf(p)}；赚钱点：${r.businessModelDetail.moneyPoint}`],
    ["我是否会继续投入资源？", `整体 ${s.opportunity >= 70 ? "会" : "视验证结果"}：先验证「${deepNeedOf(p)}」的付费意愿，再规模化。`],
  ].map(([q, a]) => ({ q, a }));
  const v = verdictFor(s);

  const canvas = [
    ["Vision", `让「${targetUsersOf(p).split("、")[0]}」零门槛获得「${deepNeedOf(p)}」`],
    ["Mission", `${p.name}：${p.tagline}`],
    ["Target Market", `${cat.name} 赛道 · ${sceneOf(p)}`],
    ["Target User", targetUsersOf(p)],
    ["Core Problem", problemOf(p)],
    ["Core Value", deepNeedOf(p)],
    ["Differentiation", killer.feature + " 的产品化封装"],
    ["AI Advantage", aiCapabilityOf(p)],
    ["Business Model", businessOf(p)],
    ["Growth Model", growthOf(p)],
    ["Moat", moatOf(p)],
  ].map(([k, v]) => ({ k, v }));

  const segments = [
    { name: "Primary User", who: targetUsersOf(p).split("、")[0], goal: deepNeedOf(p), pain: problemOf(p), trigger: "出现「问题/任务」的当下", wtp: "中高（效率付费）" },
    { name: "Secondary User", who: "团队/协作中的成员", goal: "复用他人产出与资产", pain: "信息不同步", trigger: "需要协作/分享", wtp: "中" },
    { name: "Power User", who: "高频深度用户", goal: "规模化产出与自动化", pain: "批量/自动化不足", trigger: "每天高频使用", wtp: "高" },
    { name: "Enterprise User", who: "企业团队负责人", goal: "统一工作流+权限+合规", pain: "安全/合规/管理", trigger: "需要团队治理", wtp: "高（企业订阅）" },
    { name: "Paying User", who: "深度/企业用户", goal: "稳定+高级能力", pain: "免费版限制", trigger: "触达用量限制", wtp: "高" },
    { name: "Non-paying User", who: "尝鲜/低频用户", goal: "试试看", pain: "无强痛点", trigger: "被内容/口碑触达", wtp: "低" },
  ];

  const valueChain = [
    { step: "User Input", desc: "目标/需求输入" },
    { step: "AI Processing", desc: aiCapabilityOf(p) },
    { step: "Action", desc: workflowOf(p) },
    { step: "Output", desc: r.productToTech.output },
    { step: "User Outcome", desc: deepNeedOf(p) },
    { step: "Business Value", desc: businessOf(p) },
  ];

  const flywheelCycle = p.categories.includes("devtools") || p.categories.includes("infra")
    ? ["更多开发者", "更多集成/插件", "更强生态", "更大分发", "更多开发者"]
    : ["更多用户", "更多数据/资产", "更好结果", "更高留存", "更多分享", "更多用户"];
  const flywheelJudge = `判断：${p.categories.includes("rag") || p.categories.includes("pkm") ? "有真正飞轮——使用沉淀数据/资产驱动结果提升与留存" : s.growth >= 70 ? "有增长飞轮（口碑+内容+工具链嵌入）" : "飞轮尚弱，需补「资产沉淀 + 分享钩子」"}`;

  const coreFeatures = r.featureToCode.map((f) => f.feature).slice(0, 6);
  const priority = coreFeatures.map((f, i) => ({
    feature: f,
    user: Math.max(50, 95 - i * 10),
    business: Math.max(40, 90 - i * 10),
    ai: Math.max(45, 92 - i * 8),
    difficulty: Math.min(85, 40 + i * 12),
    strategic: Math.max(50, 96 - i * 8),
    keep: i < 3,
  }));

  const reliabilityDims = [
    ["Accuracy", Math.min(95, s.technical), "结果质量依赖模型与校验"],
    ["Latency", Math.min(90, 80 - (p.categories.includes("agent") ? 10 : 0)), "多步推理增加延迟"],
    ["Cost", Math.min(90, 85 - (p.categories.includes("rag") ? 5 : 0)), "Token 成本需分层"],
    ["Reliability", Math.min(92, s.health), "失败重试+人在回路"],
    ["Hallucination", Math.min(85, 80 - (p.categories.includes("rag") ? 5 : 0)), "引用/校验缓解"],
    ["Failure", Math.min(90, s.health), "工具/模型失败降级"],
    ["Security", Math.min(92, 88), "权限/沙箱/审计"],
    ["Privacy", Math.min(92, p.categories.includes("pkm") ? 90 : 88), "数据可控/自托管"],
    ["Scalability", Math.min(90, s.health), "架构可水平扩展"],
    ["Observability", Math.min(88, 82), "成本/延迟/质量监控"],
  ].map(([dim, score, note]) => ({ dim: dim as string, score: score as number, note: note as string }));

  const risks = [
    "模型依赖：上游模型/API 政策变化",
    "平台依赖：生态与分发受平台影响",
    "开源竞争：低切换成本，10 个竞品随时出现",
    "AI 商品化：模型能力被抹平",
    "高算力成本：推理成本侵蚀毛利",
    "低留存：单次工具价值无资产沉淀",
    "弱护城河：无数据/生态积累",
    "监管/安全：内容合规与数据安全",
  ];

  const roadmap = {
    now: [coreFeatureOf(p) + " 打磨", "3 分钟上手体验", "核心指标埋点"],
    next: ["模板/资产沉淀", "分享钩子", "付费分层（Free/Pro）"],
    later: ["团队协作", "生态/插件市场", "企业版/私有化"],
    dont: ["与核心 Job 无关的社区", "全功能堆叠", "过早多租户复杂化"],
  };

  const scores = [
    { label: "Market Opportunity", value: Math.round(s.opportunity * 0.8 + s.growth * 0.2) },
    { label: "User Value", value: Math.round(p.profile.userDemand * 10) },
    { label: "Product Design", value: s.product },
    { label: "AI Innovation", value: Math.round(p.profile.innovation * 10) },
    { label: "Technical Architecture", value: s.technical },
    { label: "UX", value: s.sideHustle },
    { label: "Business Model", value: s.commercial },
    { label: "Growth", value: s.growth },
    { label: "Moat", value: Math.round((10 - p.profile.competition) * 10) },
    { label: "Open Source Value", value: s.health },
    { label: "Scalability", value: Math.round((s.technical + s.health) / 2) },
    { label: "AI PM Learning", value: s.resume },
    { label: "Career Value", value: s.resume },
  ];
  const overall = Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length);

  const conclusions = {
    whyWins: three.why,
    whyFails: `失败路径：模型被抹平 + 无数据/场景壁垒 + 获客不足 → 沦为工具被替代。`,
    realMoat: `真正壁垒：${moatOf(p)}；核心是「${r.productToTech.output}」的资产沉淀与工作流锁定。`,
    invest: `我会投：「${r.productToTech.feature}」的垂直化 + 资产/模板市场 + 托管变现。`,
    kill: `我会砍：${roadmap.dont.join("、")}。`,
    buildNext: `下一步：${roadmap.next.join(" → ")}，并把「${latentNeedOf(p)}」做成默认能力。`,
    bet: v.verdict,
    betWhy: v.why,
  };

  const panorama: MapNode[] = ([
    N("MARKET", `${cat.name} 赛道`, [`市场：${cat.name} · 2026 窗口（${ts}）`, `TAM 大、SOM 聚焦「${sceneOf(p)}」`], ["市场多大？", "现在为什么是窗口？"]),
    N("USER", targetUsersOf(p), ["Primary=种子用户（需求最痛）", "分层：Power/Enterprise 付费意愿高"], ["谁最先付费？", "谁最先传播？"]),
    N("PROBLEM", problemOf(p), ["痛点真实且高频", "旧方案低效/高成本"], ["用户现在怎么解决？"]),
    N("USER NEED", needs.core, [`深层 Job：${deepNeedOf(p)}`, `潜在：${needs.latent}`], ["嘴上要什么 vs 真正要什么？"]),
    N("PRODUCT", `${p.name}＝${p.tagline}`, ["一句话模型", "最小闭环"], ["为什么值得存在？"]),
    N("FEATURE", r.productToTech.feature, ["核心功能=最小闭环", "优先级：Must/Should/Could"], ["删掉它产品成立吗？"]),
    N("UX", r.productToTech.ux, ["3 秒看懂 / 30 秒判断", "结果可审核可重试"], ["首次体验多快？"]),
    N("VALUE", deepNeedOf(p), ["用户 Outcome=价值", "Business Value=变现"], ["谁为价值付钱？"]),
    N("WORKFLOW", workflowOf(p), ["Workflow=产品化核心", "每步输入输出失败处理"], ["哪步决定质量？"]),
    N("LLM", "生成/规划/推理", ["模型角色", "Prompt/结构化输出"], ["为什么需要 LLM？"]),
    N("RAG", p.categories.includes("rag") || p.categories.includes("pkm") ? "知识检索增强" : "按需", ["检索质量=回答质量", "数据是护城河"], ["RAG 是核心吗？"]),
    N("AGENT", p.categories.includes("agent") ? "编排/工具调用" : "单步", ["规划-工具-观察-推理-记忆", "是否为了 Agent 而 Agent"], ["为什么 Agent 而非 Chatbot？"]),
    N("TOOLS", "工具/外部服务", ["扩展能力边界", "失败降级"], ["哪些工具核心？"]),
    N("DATA", dataOf(p), ["数据来源/存储/资产", "Data Moat"], ["数据是否形成壁垒？"]),
    N("API", "服务端接口", ["契约/鉴权/限流", "开放=生态变现"], ["开放还是封闭？"]),
    N("BACKEND", "核心引擎", ["编排/队列/状态", "可观测"], ["核心服务在哪？"]),
    N("FRONTEND", `${p.language} 入口`, ["3 秒体验", "流式反馈"], ["入口形态对吗？"]),
    N("SOURCE", p.fullName, ["源码=唯一事实源", "目录→产品模块"], ["代码如何支撑产品？"]),
    N("INFRA", "存储/向量/缓存/部署", ["基础设施", "Cloud/自托管"], ["部署成本？"]),
    N("DEPLOYMENT", "Cloud / 自托管", ["托管/私有化双轨", "开源=信任"], ["SaaS 还是自托管？"]),
    N("BUSINESS", businessOf(p), [r.businessModelDetail.moneyPoint, "谁付钱/何时付/为何持续付"], ["真正的赚钱点？"]),
    N("GROWTH", growthOf(p), ["增长飞轮", "PLG/社区/内容/生态"], ["为什么能持续涨？"]),
    N("MOAT", moatOf(p), ["数据×场景×分发", "工作流锁定"], ["10 个竞品出现还能赢吗？"]),
    N("FUTURE", `Product 2.0：${p2.newProduct}`, ["AI 10× → 重新设计", "行业迁移"], ["下一步做什么？"]),
  ] as Omit<MapNode, "answers">[]).map((n) => ({ ...n, answers: n.questions.map((qq) => answerQuestion(p, n.node, qq)) }));

  return {
    execReview: exec, verdict: v.verdict, verdictWhy: v.why,
    canvas, market: {
      tam: `全球「${cat.name}」市场：规模大且增长快（估算 $10B+）`,
      sam: `可服务市场：${targetUsersOf(p).split("、")[0]} 相关人群`,
      som: `可获取市场：先做「${sceneOf(p)}」垂直场景`,
      growth: `赛道年增速高（AI 采用曲线），2026 为关键窗口`,
      competition: `竞争：${p.profile.competition >= 7 ? "拥挤，需差异化" : "中等，有空间"}`,
      whyNow: `为什么 2026：模型/成本/Agent-MCP 生态成熟；2022 做太早（模型不行），2028 做可能太晚（巨头进场）。`,
    },
    segments, deepNeed: {
      surface: needs.surface,
      deep: needs.deep,
      deeper: `用户真正要的可能是「${deepNeedOf(p)}」——再进一步：「${latentNeedOf(p)}」。`,
    },
    valueChain, flywheel: { cycle: flywheelCycle, judge: flywheelJudge },
    priority, coreLoop: ["进入", "创建任务", "AI 执行", "获得结果", "修改", "再次执行", "成功", "保存", "复用"],
    designDecisions: [
      { decision: killer.feature + " 的产品化封装", why: "把复杂能力变成一句话输入", alternative: "面向专业用户的高级界面", tradeoff: "深度 vs 上手成本", result: "更广市场 + 更低门槛" },
      { decision: p.categories.includes("agent") ? "采用 Agent 而非普通 Chat" : "采用 AI 增强而非纯规则", why: `任务本质是「${workflowOf(p)}」多步闭环`, alternative: "普通 Chat（User→Prompt→LLM→Answer）", tradeoff: "复杂度/成本 vs 自主性", result: "用户从操作者变审核者" },
      { decision: "开源 + 托管双轨", why: "开源获客与信任，托管变现", alternative: "纯闭源 SaaS", tradeoff: "放弃部分直接收入 vs 生态", result: "开发者生态 + 企业信任" },
      { decision: "资产沉淀（历史/模板）", why: "留存与复利", alternative: "用完即走", tradeoff: "存储成本 vs 粘性", result: "工作流锁定 + 护城河" },
    ],
    aiMatters: [
      { tier: "非 AI 功能", desc: "输入/展示/导出等（传统实现）" },
      { tier: "AI Enhanced", desc: native.enhanced },
      { tier: "AI Native", desc: native.native },
      { tier: "Agentic", desc: p.categories.includes("agent") ? "目标→规划→执行→校验→迭代的自主闭环" : "单步增强；Agent 化是下一步" },
    ],
    aiArch: [
      { layer: "Experience Layer", desc: "输入/进度/结果/审核 UX" },
      { layer: "Orchestration Layer", desc: "任务规划/编排/状态" },
      { layer: "AI Layer", desc: aiCapabilityOf(p) },
      { layer: "Tool Layer", desc: "工具/MCP/外部服务" },
      { layer: "Data Layer", desc: dataOf(p) },
      { layer: "Infrastructure", desc: "存储/向量/缓存/队列/部署" },
    ],
    reliability: reliabilityDims,
    costModel: {
      items: ["LLM Cost（按 Token）", "Embedding/检索 Cost（如 RAG）", "存储/基础设施", "人力成本（维护/运营）"],
      perTask: `每任务成本估算：低（$0.01-0.1 量级，视输入输出规模）`,
      margin: `毛利判断：定价需覆盖 AI 成本 3-5 倍；订阅/用量分层保证健康毛利（[HYPOTHESIS]）。`,
    },
    business: {
      whyPay: `因为「${deepNeedOf(p)}」带来的效率/产出价值远高于订阅费`,
      whoPays: targetUsersOf(p).split("、").slice(0, 2).join("、") + "（Power/企业用户付费意愿高）",
      whenPay: "触达用量限制 / 需要团队协作与高级能力时",
      keepPaying: "资产沉淀 + 工作流嵌入 + 结果质量持续提升",
    },
    funnel: ["Free（开源）", "Usage（体验价值）", "Value（产出资产）", "Habit（工作流嵌入）", "Limit（用量限制）", "Upgrade（Pro/Team）", "Subscription", "Enterprise（私有化/合规）"],
    growth: {
      metrics: ["激活率（首次成功输出）", "周完成 Job 数", "留存（次周回访）", "资产创建数", "付费转化", "分享/传播率"],
      loops: ["Product-Led Growth", "Community Growth", "Open Source Growth", "Content Growth", "Developer Growth", "Viral Loop（模板/结果分享）"],
      primary: `首选增长引擎：${p.categories.includes("devtools") || p.categories.includes("infra") ? "Developer Growth + 工具链嵌入" : "Content + Viral（模板/结果分享）"}`,
    },
    oss: {
      why: `开源获客、降低信任门槛、社区共建（License=${p.license ?? "—"}）`,
      what: "核心引擎/框架/CLI 开源",
      notOpen: "托管服务/企业功能/高级模型路由",
      model: ["Open Core", "Freemium", "Cloud", "Enterprise", "Support", "Marketplace"],
    },
    moat: {
      dims: [
        { label: "Technology", value: s.technical },
        { label: "Data", value: Math.round((p.categories.includes("rag") || p.categories.includes("pkm") ? 85 : 55)) },
        { label: "Community", value: Math.round(Math.min(90, s.health)) },
        { label: "Brand", value: Math.round(Math.min(80, 55 + s.opportunity / 4)) },
        { label: "Distribution", value: Math.round(Math.min(90, 60 + s.growth / 4)) },
        { label: "Network Effect", value: Math.round(p.categories.includes("devtools") || p.categories.includes("infra") ? 70 : 50) },
        { label: "Workflow Lock-in", value: Math.round(p.categories.includes("agent") || p.categories.includes("rag") ? 78 : 55) },
        { label: "Ecosystem", value: Math.round(p.profile.ecosystem * 10) },
      ],
      judge: `判断：${moatOf(p)}；如果 GitHub 明天出现 10 个竞品，${s.opportunity >= 75 ? "靠「资产沉淀 + 工作流锁定 + 社区」仍能赢" : "护城河偏弱，需尽快补数据/生态"}`,
    },
    risks,
    lifecycle: {
      stage: ts.includes("New") ? "MVP → PMF" : ts.includes("Rising") ? "Growth" : ts.includes("Active") ? "Scale" : "Platform 早期",
      next: `下一阶段最重要任务：${s.opportunity >= 70 ? "验证 PMF 并放大增长" : "找到「"+deepNeedOf(p)+"」的付费验证"}`,
    },
    roadmap,
    plan90: {
      d30: ["产品诊断（指标/留存/流失）", "用户访谈（10+ 核心用户）", "确定核心指标", "梳理技术债", "核心体验打磨"],
      d60: ["核心功能深化", "AI 能力/Workflow 优化", "UX 与错误恢复", "商业化实验（定价/套餐）"],
      d90: ["增长放量", "Monetization 落地", "生态/集成", "Scale 准备"],
    },
    zeroOne: ["Problem 验证", "MVP（最小闭环）", "Core UX", "AI Core", "Workflow", "Data", "Architecture", "Launch", "PMF", "Growth"],
    threeFeatures: {
      keep: [r.productToTech.feature, "结果导出/分享", "历史/模板资产"],
      why: `三者构成「输入 → 产出 → 沉淀复用」的最小价值闭环，删掉任意一个都会破坏闭环。`,
    },
    ai10x: `如果 AI 能力提升 10 倍：产品应从「工具」进化为「自主助理」——默认「目标 → 自主执行 → 审核」，并把每一次使用自动沉淀为资产与模板市场（${p2.newAi}）。`,
    interview: {
      productSense: `你如何拆解它？它最核心的 Job 是什么？`,
      aiProduct: `AI 在系统里具体在哪一步？为什么 Agent 而非 Chatbot？`,
      technical: `它从 UI 到代码怎么落地？Feature→Code 怎么映射？`,
      business: `谁付钱？为什么付？毛利健康吗？`,
      growth: `它的增长飞轮是什么？PLG 还是社区？`,
      howToAnswer: `用「用户→场景→Job→设计→AI→商业→增长」结构，结合「${r.productToTech.feature}」与「${moatOf(p)}」回答，并给出 30/60/90 计划体现总监视角。`,
    },
    scores, overall,
    conclusions, panorama,
  };
}

function N(node: string, detail: string, explain: string[], questions: string[], evidence = "Inferred"): Omit<MapNode, "answers"> {
  return { node, detail, explain, questions, evidence };
}

/* ── 源码驱动版（Live 项目） ───────────────────────────────────── */
export function buildSourceDirectorReport(repo: LiveRepo, intel: SourceIntel): DirectorReport {
  const stars = repo.stars;
  const sig = (stars >= 20000 ? 80 : stars >= 5000 ? 65 : 45);
  const E = (t: string) => t + "[INFERENCE]";
  const basic: DirectorReport = {
    execReview: [
      { q: "我为什么批准做这个项目？", a: `「${intel.tagline}」定位清晰 + Stars ${formatStars(stars)} 证明初步验证。` },
      { q: "我解决的核心问题是什么？", a: repo.description ?? intel.tagline },
      { q: "我服务的核心用户是谁？", a: "以 README/主题推断（[INFERENCE]）" },
      { q: "这个问题值不值得解决？", a: E("Stars/Forks 信号初步验证需求") },
      { q: "为什么现在是最佳时间？", a: E("2026 AI 窗口 + 生态成熟") },
      { q: "为什么 AI 能解决？", a: intel.aiComponents.length ? `检出 ${intel.aiComponents.join("/")}` : "（未检出 AI 组件）" },
      { q: "产品的核心竞争力是什么？", a: intel.tagline },
      { q: "产品最大的风险是什么？", a: "模型依赖/竞争/获客（[HYPOTHESIS]）" },
      { q: "商业模式是否成立？", a: `开源（${repo.license ?? "—"}）→ 托管/API（[INFERENCE]）` },
      { q: "我是否会继续投入资源？", a: stars >= 20000 ? "会（信号强）" : "先验证再投入" },
    ],
    verdict: stars >= 20000 ? "Invest" : stars >= 5000 ? "Watch" : "Watch",
    verdictWhy: `信号：Stars ${formatStars(stars)} · Forks ${formatStars(repo.forks)} · 更新 ${repo.updatedAt}`,
    canvas: [
      ["Vision", intel.tagline], ["Mission", repo.description ?? intel.tagline], ["Target Market", repo.description ?? "—"],
      ["Target User", "待社区确认（[INFERENCE]）"], ["Core Problem", repo.description ?? "—"], ["Core Value", intel.tagline],
      ["Differentiation", "待源码对比（[HYPOTHESIS]）"], ["AI Advantage", intel.aiComponents.join(" / ") || "未检出"], ["Business Model", `开源 · ${repo.license ?? "—"}`], ["Growth Model", "Stars 增长信号"], ["Moat", "数据/社区/工作流（[HYPOTHESIS]）"],
    ].map(([k, v]) => ({ k, v })),
    market: { tam: "赛道待估", sam: "待估", som: "先做垂直场景", growth: E("AI 赛道高增长"), competition: "待分析", whyNow: E("2026 窗口") },
    segments: [
      { name: "Primary User", who: intel.tagline, goal: "—", pain: repo.description ?? "—", trigger: "—", wtp: "中" },
      { name: "Power User", who: "高频用户", goal: "规模化", pain: "—", trigger: "—", wtp: "高" },
      { name: "Enterprise User", who: "企业", goal: "统一+合规", pain: "安全/合规", trigger: "—", wtp: "高" },
    ],
    deepNeed: { surface: intel.features[0] ?? intel.tagline, deep: "待用户证据（[HYPOTHESIS]）", deeper: "待挖掘" },
    valueChain: [
      { step: "User Input", desc: "输入目标" }, { step: "AI Processing", desc: intel.aiComponents.join("/") || "待确认" },
      { step: "Action", desc: "核心处理" }, { step: "Output", desc: intel.features[0] ?? "结果" },
      { step: "User Outcome", desc: intel.tagline }, { step: "Business Value", desc: "开源→托管" },
    ],
    flywheel: { cycle: ["更多用户", "更多数据", "更好结果", "更高留存", "更多用户"], judge: E("初步具备增长信号") },
    priority: intel.features.slice(0, 5).map((f, i) => ({ feature: f, user: Math.max(50, 90 - i * 8), business: Math.max(40, 80 - i * 8), ai: Math.max(45, 85 - i * 6), difficulty: Math.min(85, 40 + i * 10), strategic: Math.max(50, 88 - i * 8), keep: i < 3 })),
    coreLoop: ["进入", "输入", "执行", "结果", "复用"],
    designDecisions: [
      { decision: intel.tagline, why: E("README 定位"), alternative: "—", tradeoff: "—", result: "初步验证" },
      { decision: "技术选型", why: intel.techStack.join("/") || "待源码确认", alternative: "—", tradeoff: "—", result: "—" },
    ],
    aiMatters: [
      { tier: "AI Enhanced", desc: intel.aiComponents.length ? `检出 ${intel.aiComponents.join("/")}` : "未检出（[HYPOTHESIS]）" },
      { tier: "AI Native", desc: "待源码确认" }, { tier: "Agentic", desc: "待源码确认" },
    ],
    aiArch: [
      { layer: "Experience Layer", desc: "入口/结果" }, { layer: "AI Layer", desc: intel.aiComponents.join("/") || "待确认" },
      { layer: "Tool/Data Layer", desc: intel.moduleMap.find((m) => /工具|数据/.test(m.role))?.module ?? "—" },
    ],
    reliability: [
      ["Accuracy", sig, "待评估"], ["Latency", 70, "待评估"], ["Cost", 70, "待评估"], ["Reliability", sig, "待评估"],
      ["Hallucination", 65, "待评估"], ["Failure", 70, "待评估"], ["Security", 72, "待评估"], ["Privacy", 70, "待评估"], ["Scalability", 70, "待评估"], ["Observability", 68, "待评估"],
    ].map(([dim, score, note]) => ({ dim: dim as string, score: score as number, note: note as string })),
    costModel: { items: ["LLM Cost", "基础设施", "人力"], perTask: "待评估", margin: "待评估" },
    business: { whyPay: "待验证", whoPays: "待验证", whenPay: "待验证", keepPaying: "待验证" },
    funnel: ["Free", "Usage", "Value", "Habit", "Limit", "Upgrade", "Enterprise"],
    growth: { metrics: ["Stars", "Forks", "更新时间"], loops: ["Open Source Growth", "Community Growth", "Content Growth"], primary: "Open Source/Community" },
    oss: { why: `开源（${repo.license ?? "—"}）`, what: "核心开源", notOpen: "托管/企业功能", model: ["Open Core", "Cloud", "Enterprise"] },
    moat: { dims: [{ label: "Data", value: 50 }, { label: "Community", value: sig }, { label: "Distribution", value: sig }, { label: "Workflow Lock-in", value: 50 }], judge: E("护城河待验证") },
    risks: ["模型依赖", "开源竞争", "低切换成本", "弱护城河"],
    lifecycle: { stage: repo.updatedAt >= "2026-01-01" ? "Growth/Active" : "Early", next: "验证 PMF" },
    roadmap: { now: [intel.tagline], next: ["资产沉淀", "付费分层"], later: ["生态"], dont: ["过早复杂化"] },
    plan90: { d30: ["诊断+访谈"], d60: ["核心+商业化实验"], d90: ["增长放量"] },
    zeroOne: ["Problem", "MVP", "Core UX", "AI Core", "Workflow", "Data", "Architecture", "Launch", "PMF", "Growth"],
    threeFeatures: { keep: intel.features.slice(0, 3).map((x) => x.slice(0, 20)) || [intel.tagline], why: "最小价值闭环（[HYPOTHESIS]）" },
    ai10x: "从工具进化为自主助理（[HYPOTHESIS]）",
    interview: { productSense: "如何拆解？", aiProduct: "AI 在哪一步？", technical: "UI→代码？", business: "谁付钱？", growth: "飞轮？", howToAnswer: "结合源码信号 + 30/60/90 计划" },
    scores: [
      { label: "Market Opportunity", value: sig }, { label: "User Value", value: sig }, { label: "Product Design", value: sig },
      { label: "AI Innovation", value: intel.aiComponents.length ? Math.min(90, sig + 10) : 40 }, { label: "Technical Architecture", value: intel.techStack.length ? sig : 45 },
      { label: "UX", value: 60 }, { label: "Business Model", value: sig - 5 }, { label: "Growth", value: sig }, { label: "Moat", value: 50 },
      { label: "Open Source Value", value: repo.license ? 80 : 40 }, { label: "Scalability", value: 60 }, { label: "AI PM Learning", value: sig }, { label: "Career Value", value: sig },
    ],
    overall: Math.round([sig, sig, sig, 50, 50, 60, sig, sig, 50, 70, 60, sig, sig].reduce((a, b) => a + b, 0) / 13),
    conclusions: {
      whyWins: `「${intel.tagline}」+ Stars ${formatStars(stars)} 信号`,
      whyFails: "模型抹平 + 无壁垒 + 获客不足",
      realMoat: "数据/社区/工作流（[HYPOTHESIS]）",
      invest: "先验证「核心闭环」的付费意愿",
      kill: "与核心无关的功能",
      buildNext: "资产沉淀 + 托管",
      bet: stars >= 20000 ? "YES" : stars >= 5000 ? "WATCH" : "WATCH",
      betWhy: `Stars ${formatStars(stars)} · 更新 ${repo.updatedAt}`,
    },
    panorama: ([
      N("MARKET", "AI 赛道", ["2026 窗口（[INFERENCE]）"], ["市场多大？"]),
      N("USER", intel.tagline, ["README 定位"], ["谁最先用？"]),
      N("PROBLEM", repo.description ?? "—", ["定位痛点"], ["多痛？"]),
      N("USER NEED", intel.features[0] ?? intel.tagline, ["需求信号"], ["真正要什么？"]),
      N("PRODUCT", `${repo.name}＝${intel.tagline}`, ["一句话模型"], ["为什么值得存在？"]),
      N("FEATURE", intel.features.join(" · ") || "核心", ["Feature Map"], ["删掉成立吗？"]),
      N("UX", "输入→结果→审核", ["上手路径"], ["首次多快？"]),
      N("VALUE", intel.tagline, ["用户价值"], ["谁付钱？"]),
      N("WORKFLOW", "Input→Process→LLM→Output", ["处理链"], ["哪步决定质量？"]),
      N("LLM / RAG / AGENT", intel.aiComponents.join(" · ") || "待确认", ["AI 组件（manifest 证据）"], ["为什么需要 AI？"]),
      N("TOOLS", intel.moduleMap.find((m) => /工具/.test(m.role))?.module ?? "—", ["工具模块"], ["哪些工具？"]),
      N("DATA", intel.moduleMap.find((m) => /数据/.test(m.role))?.module ?? "—", ["数据层"], ["数据壁垒？"]),
      N("API", intel.moduleMap.find((m) => /Backend|API/.test(m.role))?.module ?? "—", ["接口"], ["开放？"]),
      N("BACKEND", "服务端", ["核心引擎"], ["核心在哪？"]),
      N("FRONTEND", intel.moduleMap.find((m) => /Frontend|前端/.test(m.role))?.module ?? "—", ["入口"], ["形态对吗？"]),
      N("SOURCE", repo.fullName, ["目录树证据"], ["代码如何支撑？"]),
      N("DEPLOYMENT", intel.techStack.includes("Docker") ? "Docker/CI" : "Cloud", ["部署"], ["成本？"]),
      N("BUSINESS", `开源 · ${repo.license ?? "—"}`, ["开源→托管"], ["赚钱点？"]),
      N("GROWTH", `Stars ${formatStars(stars)}`, ["增长信号"], ["为什么涨？"]),
      N("MOAT", "数据/社区/工作流", ["护城河候选"], ["10 竞品还能赢？"]),
      N("FUTURE", "垂直化 + 资产化", ["Product 2.0"], ["下一步？"]),
    ] as Omit<MapNode, "answers">[]).map((n) => ({ ...n, answers: n.questions.map((qq) => answerSourceQuestion(repo, intel, n.node, qq)) })),
  };
  return basic;
}

export { scoreColor };
