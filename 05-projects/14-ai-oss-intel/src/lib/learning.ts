/**
 * AI PM Learning & Content Intelligence OS — deterministic generators.
 * Turns every GitHub project into a Product Case: DNA, five-layer breakdown,
 * hidden needs, JTBD, evidence, Socratic challenges, content pack, PRD, cases.
 */
import { computeScores, formatPct, formatSigned, growthRate } from "@/lib/engines";
import { categoryOf } from "@/lib/categories";
import type {
  AbilityScores, AiNativeAnalysis, CaseStudy, Challenge, ContentPlatform, ContentScore,
  DnaChainNode, EvidenceItem, FiveLayers, HiddenNeeds, InterviewQuestion, JTBD,
  LearningLevel, OpinionFrame, PmVsUser, PrdDraft, Project, RequirementNode, VideoScript,
} from "@/lib/types";

const P = (p: Project) => p.profile;

/* ── ④ Product DNA：产品底层逻辑图 ─────────────────────────────── */
export function buildProductDna(p: Project): DnaChainNode[] {
  return [
    { label: "Problem", value: problemOf(p) },
    { label: "User", value: targetUsersOf(p) },
    { label: "Scenario", value: scenarioLabel(p) },
    { label: "Job", value: deepNeedOf(p) },
    { label: "Pain Point", value: painPointOf(p) },
    { label: "Solution", value: p.name + "（" + p.tagline + "）" },
    { label: "Feature", value: coreFeatureOf(p) },
    { label: "AI Capability", value: aiCapabilityOf(p) },
    { label: "Agent Workflow", value: workflowOf(p) },
    { label: "Data", value: dataOf(p) },
    { label: "UX", value: uxOf(p) },
    { label: "Business", value: businessOf(p) },
    { label: "Growth", value: growthOf(p) },
    { label: "Moat", value: moatOf(p) },
  ];
}

function scenarioLabel(p: Project): string {
  return p.categories.slice(0, 3).map((c) => categoryOf(c).name).join(" / ");
}
export function painPointOf(p: Project): string {
  return "用户在当前方案下感到「" + problemOf(p) + "」带来的低效/高成本/焦虑";
}
export function dataOf(p: Project): string {
  if (p.categories.includes("rag") || p.categories.includes("pkm")) return "文档/知识库 → 向量化 → 检索日志 → 用户反馈";
  if (p.categories.includes("agent")) return "任务输入 → 工具结果 → 记忆/状态 → 质量日志";
  if (p.categories.includes("coding")) return "代码库 → 索引 → 编辑记录 → 测试反馈";
  return "用户输入 + 生成记录 + 使用行为（用于质量与个性化迭代）";
}
export function uxOf(p: Project): string {
  return "一句话输入 → 可视化进度 → 结果可审核/可导出 → 错误可解释可重试";
}
export function growthOf(p: Project): string {
  const r = growthRate(p, 30);
  return `30 天 ${formatSigned(p.growth30d)}（${formatPct(r)}）· ${r > 10 ? "口碑 + 内容传播飞轮" : "工具链嵌入 + 社区生态"}`;
}
export function moatOf(p: Project): string {
  const pr = P(p);
  if (pr.ecosystem >= 8) return "生态/社区网络效应 + 插件与集成资产";
  if (pr.commercialPotential >= 8) return "垂直场景 + 数据资产 + 商业化先发";
  if (pr.innovation >= 8) return "架构/技术领先 + 开发者心智";
  return "易用性 + 社区口碑";
}

/* ── ⑤ 产品底层逻辑拆解：五层模型 ─────────────────────────────── */
export function buildFiveLayers(p: Project): FiveLayers {
  return {
    userProblem: `Layer 01 · User Problem — ${targetUsersOf(p)} 在「${sceneOf(p)}」场景下，面临「${problemOf(p)}」。`,
    productExperience: `Layer 02 · Product Experience — ${p.name} 用「${coreFeatureOf(p)}」把复杂操作收敛为一句话/一次点击，显著降低认知成本与操作成本。`,
    aiCapability: `Layer 03 · AI Capability — ${aiCapabilityOf(p)}；模型能力是杠杆，但真正的差异在「${valueOf(p)}」的产品化封装。`,
    agentWorkflow: `Layer 04 · Agent / Workflow — ${workflowOf(p)}。这是本项目最值得学习的设计点。`,
    businessModel: `Layer 05 · Business Model — ${businessOf(p)}。商业价值评级 ${P(p).commercialPotential}/10，赚钱潜力 ${P(p).moneyFit}/10。`,
  };
}

/* ── ⑥ 用户需求拆解：Hidden Needs Detector + 需求树 + JTBD + 证据 ── */
export function buildHiddenNeeds(p: Project): HiddenNeeds {
  const base = needOf(p);
  return {
    surface: `表层需求：用户明确说要「${base}」。（用户自己会说出来的需求）`,
    functional: `功能需求：用户希望产品能「${coreFeatureOf(p)}」，并集成到现有工作流（${workflowOf(p).split("→")[0]}）。`,
    scenario: `场景需求：在「${sceneOf(p)}」中，用户需要随时可用、结果可复用、错误可补救。`,
    core: `核心需求：围绕「${deepNeedOf(p)}」，用户需要「更快、更稳、更省」地完成每一次任务。`,
    deep: `深层需求：用户真正想要的是「${deepNeedOf(p)}」——节省时间/降低风险/提升产出，而不是工具本身。`,
    latent: `潜在需求：用户尚未意识到的需求——「${latentNeedOf(p)}」，这正是二次开发与商业化的机会点。`,
  };
}

export function buildRequirementTree(p: Project): RequirementNode[] {
  const leaf = deepNeedOf(p);
  const latent = latentNeedOf(p);
  return [
    {
      question: "用户想要什么？",
      answer: `自动完成「${coreFeatureOf(p)}」`,
      children: [
        {
          question: "为什么？",
          answer: `节省「${sceneOf(p)}」场景中的时间与人力`,
          children: [
            {
              question: "为什么？",
              answer: `需要持续产出/高效决策，保持竞争力`,
              children: [
                {
                  question: "为什么？（最终需求 = Job）",
                  answer: `最终需求：${leaf}。不要停留在 Feature，要找到 Job。`,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      question: "潜在延伸需求",
      answer: latent,
      children: [],
    },
  ];
}

export function buildJTBD(p: Project): JTBD {
  return {
    when: `When 当用户处于「${sceneOf(p)}」场景，且对「${problemOf(p)}」感到低效/焦虑时…`,
    want: `I want 我希望「${coreFeatureOf(p)}」，并且不需要理解底层实现。`,
    soThat: `So that 这样我就可以「${deepNeedOf(p)}」，把精力放在更有价值的事情上。`,
    functional: `Functional Job：完成任务、节省时间、获得可复用产出。`,
    emotional: `Emotional Job：感到「专业、可控、领先」，减少焦虑。`,
    social: `Social Job：成为团队/圈子里「最先用上 AI 的人」，获得认可。`,
  };
}

export function buildEvidence(p: Project): EvidenceItem[] {
  return [
    { type: "Evidence", source: `GitHub Stars ${formatSigned(p.stars)} / 30天 +${formatSigned(p.growth30d)}`, claim: `高增长说明真实用户正在采纳，是需求成立的最强证据。` },
    { type: "Evidence", source: `Open Issues ${p.openIssues.toLocaleString()} · Contributors ${p.contributors.toLocaleString()}`, claim: `社区活跃度证明用户在使用中产生反馈（功能请求/Bug/讨论）。` },
    { type: "Inference", source: `AI Analysis（本项目）`, claim: `基于分类 ${categoryOf(p.categories[0] ?? "agent").name} 与竞品对比推断：用户核心诉求是「${deepNeedOf(p)}」。` },
    { type: "Hypothesis", source: "Hypothesis（待验证）", claim: `假设：若提供「一键生成报告/导出」等高级功能，付费转化率会提升 —— 需通过访谈/落地页验证。` },
  ];
}

/* ── ⑦ AI 能力拆解：AI Before / After / Native ─────────────────── */
export function buildAiNative(p: Project): AiNativeAnalysis {
  return {
    before: `AI Before — 没有 AI 时，「${coreFeatureOf(p)}」需要人工完成（${workflowOf(p).split("→").slice(0, 2).join(" → ")}），成本高、门槛高、无法规模化。`,
    after: `AI After — 加入 AI 后，LLM 承担「理解意图 → 生成 → 校验」环节，用户从「操作者」变成「审核者」，边际成本趋近于零。`,
    native: `AI Native — 如果从第一天就是 AI 产品：应该默认「输入目标 → AI 自主完成 → 用户审核」，并把每一次使用沉淀为可复用资产（${latentNeedOf(p)}）。`,
  };
}

export function buildPmVsUser(p: Project): PmVsUser {
  return {
    userView: `普通用户：「${p.name} 很好用，可以自动${coreFeatureOf(p)}，省了我大量时间。」`,
    pmView: `产品经理：它通过「${workflowOf(p)}」的 Workflow，把「${targetUsersOf(p)}」完成「${deepNeedOf(p)}」这个 Job 的认知成本与操作成本系统性降低，并用「${businessOf(p)}」形成增长与变现闭环。`,
  };
}

/* ── ⑩ AI PM Challenge（Socratic Product Learning）─────────────── */
type ChallengeSeed = Omit<Challenge, "projectFacts" | "bestPractice" | "expertReview"> & {
  expertReview: { bestAnswer: string; why: string; keyInsight: string };
};

export function buildChallenges(p: Project, level: LearningLevel): Challenge[] {
  const s = computeScores(p);
  const banks: Record<LearningLevel, ChallengeSeed[]> = {
    beginner: [
      {
        id: "b1", level, question: `如果你是这个产品的 PM，你认为「${p.name}」解决的核心问题是什么？`, hint: "不要回答功能，要回答「用户在什么场景下、有什么痛点」。",
        skill: "需求分析",
        options: [
          { id: "a", text: `帮助用户更高效地完成「${coreFeatureOf(p)}」`, best: true },
          { id: "b", text: "做一个更好看的 AI 工具界面", best: false },
          { id: "c", text: "让模型跑得更快", best: false },
          { id: "d", text: "收集更多用户数据", best: false },
        ],
        expertReview: { bestAnswer: `核心是「${targetUsersOf(p)}」在「${sceneOf(p)}」场景下高效完成「${deepNeedOf(p)}」；功能与模型只是手段。`, why: "产品问题必须落到「用户 + 场景 + Job」，而不是技术或功能。", keyInsight: "先定义 Job，再谈功能。" },
      },
      {
        id: "b2", level, question: `「${p.name}」最核心的用户是谁？`, hint: "想清楚谁最先付费/最先传播。",
        skill: "用户研究",
        options: [
          { id: "a", text: targetUsersOf(p), best: true },
          { id: "b", text: "所有互联网用户", best: false },
          { id: "c", text: "只会写代码的工程师", best: false },
          { id: "d", text: "AI 研究员", best: false },
        ],
        expertReview: { bestAnswer: targetUsersOf(p) + "；他们需求最强、付费意愿最高，是冷启动种子用户。", why: "先做细分人群的深度价值，再扩展泛人群。", keyInsight: "Beachhead：先赢一个小市场。" },
      },
      {
        id: "b3", level, question: `「${p.name}」最核心的功能是哪一个？`, hint: "删掉其他功能产品依然成立的那个。",
        skill: "产品设计",
        options: [
          { id: "a", text: coreFeatureOf(p), best: true },
          { id: "b", text: "炫酷的 UI 动画", best: false },
          { id: "c", text: "多语言支持", best: false },
          { id: "d", text: "详细的文档", best: false },
        ],
        expertReview: { bestAnswer: coreFeatureOf(p) + "；其余是放大器，不是引擎。", why: "核心功能 = 直接命中用户 Job 的那一环。", keyInsight: "Feature ≠ Product，Job 才是。" },
      },
      {
        id: "b4", level, question: `如果只能保留 3 个功能，你会保留什么？`, hint: "围绕核心 Job 取舍。",
        skill: "Feature Prioritization",
        options: [
          { id: "a", text: `核心流程（${coreFeatureOf(p)}）+ 结果导出 + 设置/集成`, best: true },
          { id: "b", text: "主题皮肤 + 排行榜 + 点赞系统", best: false },
          { id: "c", text: "所有能想到的功能", best: false },
          { id: "d", text: "只保留登录注册", best: false },
        ],
        expertReview: { bestAnswer: "保留「完成 Job 的最小闭环 + 导出/集成 + 用户可控性」，其余全部砍掉做 MVP。", why: "MVP 是「刚好完成 Job」的最短路径。", keyInsight: "砍功能是 PM 的核心能力。" },
      },
    ],
    intermediate: [
      {
        id: "i1", level, question: `「${p.name}」的用户旅程中，哪个环节最痛？`, hint: "用户从「想用」到「用起来」之间哪里流失最多。",
        skill: "用户旅程",
        options: [
          { id: "a", text: `从「理解价值」到「第一次跑通」的安装/配置环节`, best: true },
          { id: "b", text: "首次打开页面", best: false },
          { id: "c", text: "付费环节", best: false },
          { id: "d", text: "卸载环节", best: false },
        ],
        expertReview: { bestAnswer: "上手成本通常是最痛点：README 价值传达、安装依赖、第一次成功输出。", why: "开源项目转化漏斗的第一个大漏点在上手。", keyInsight: "把「5 分钟出结果」做成产品默认体验。" },
      },
      {
        id: "i2", level, question: `你如何判断「${p.name}」的 Feature 优先级？`, hint: "用 RICE / 价值-成本矩阵思考。",
        skill: "Feature Prioritization",
        options: [
          { id: "a", text: `按「对核心 Job 的贡献度 × 用户量 × 实现成本」排序`, best: true },
          { id: "b", text: "按开发最喜欢的排序", best: false },
          { id: "c", text: "按竞品有什么就做什么", best: false },
          { id: "d", text: "按老板拍脑袋", best: false },
        ],
        expertReview: { bestAnswer: "用 RICE（Reach×Impact×Confidence÷Effort）对候选功能排序，先做能验证假设的那个。", why: "优先级本质是「用最少资源验证最大假设」。", keyInsight: "排序的是假设，不是功能。" },
      },
      {
        id: "i3", level, question: `「${p.name}」的 MVP 应该是什么？`, hint: "最小可验证核心 Job 的闭环。",
        skill: "MVP",
        options: [
          { id: "a", text: `输入目标 → ${coreFeatureOf(p)} → 输出结果`, best: true },
          { id: "b", text: "完整的多租户企业系统", best: false },
          { id: "c", text: "先做社区和论坛", best: false },
          { id: "d", text: "先做移动 App", best: false },
        ],
        expertReview: { bestAnswer: "MVP = 单用户即可跑通的「输入→处理→输出」闭环，验证用户是否愿意持续使用。", why: "MVP 验证的是 Job 是否真实，不是功能是否齐全。", keyInsight: "先手动，后自动化。" },
      },
      {
        id: "i4", level, question: `用户为什么愿意持续使用「${p.name}」而不是一次性试用？`, hint: "思考习惯养成与数据资产沉淀。",
        skill: "留存",
        options: [
          { id: "a", text: `因为使用过程沉淀了可复用资产（${latentNeedOf(p)}）`, best: true },
          { id: "b", text: "因为界面好看", best: false },
          { id: "c", text: "因为免费", best: false },
          { id: "d", text: "因为同事都在用", best: false },
        ],
        expertReview: { bestAnswer: "留存靠「数据/产出资产 + 工作流嵌入 + 结果不断提升」，而不是单次体验。", why: "资产沉淀是 AI 产品最强的留存钩子。", keyInsight: "让用户离不开你的数据，而不只是你的按钮。" },
      },
    ],
    advanced: [
      {
        id: "a1", level, question: `「${p.name}」为什么用「${p.categories.includes("agent") ? "Agent" : p.categories.includes("rag") ? "RAG" : "AI"}」而不是普通 Chatbot / 传统工具？`, hint: "想清楚 AI 在这里的不可替代性。",
        skill: "AI 产品设计",
        options: [
          { id: "a", text: `因为任务的完成需要「${workflowOf(p)}」多步编排，而非单轮问答`, best: true },
          { id: "b", text: "因为 Chatbot 太普通，Agent 更有噱头", best: false },
          { id: "c", text: "因为模型更强", best: false },
          { id: "d", text: "没有区别", best: false },
        ],
        expertReview: { bestAnswer: `任务本质是「${workflowOf(p)}」的多步闭环，需要工具调用、状态与校验，Agent 是最合适的抽象。`, why: "产品形态由 Job 的复杂度决定，不由技术潮流决定。", keyInsight: "AI 形态 = Job 结构。" },
      },
      {
        id: "a2", level, question: `「${p.name}」最大的产品风险是什么？`, hint: "从依赖、竞争、护城河三个角度想。",
        skill: "风险管理",
        options: [
          { id: "a", text: `上游模型/平台政策变化 + 巨头下场挤压`, best: true },
          { id: "b", text: "界面不够好看", best: false },
          { id: "c", text: "文档太少", best: false },
          { id: "d", text: "Logo 不好看", best: false },
        ],
        expertReview: { bestAnswer: "最大的风险是「依赖层风险」：模型能力、平台 API、开源协议；其次是巨头用生态碾压。", why: "AI 产品的地基不在自己手里，护城河必须建在数据/场景/工作流上。", keyInsight: "护城河 = 数据 × 场景 × 分发。" },
      },
      {
        id: "a3", level, question: `你如何评估「${p.name}」的商业化潜力？`, hint: "看付费人群、付费理由、复购、客单价。",
        skill: "商业分析",
        options: [
          { id: "a", text: `目标用户 ${targetUsersOf(p)} 有明确付费动机（${businessOf(p)}）`, best: true },
          { id: "b", text: "Star 多 = 一定能赚钱", best: false },
          { id: "c", text: "开源项目不能商业化", best: false },
          { id: "d", text: "只要有 API 就能赚钱", best: false },
        ],
        expertReview: { bestAnswer: "商业化潜力 = 付费人群规模 × 付费动机强度 × 交付成本；Star 只是流量，不是收入。", why: "开源获客、托管/服务变现是 AI 开源项目的主流路径。", keyInsight: "流量 → 信任 → 付费转化。" },
      },
      {
        id: "a4", level, question: `「${p.name}」近 30 天增长 ${formatSigned(p.growth30d)}（${formatPct(growthRate(p, 30))}），增长引擎是什么？`, hint: "找到驱动增长的那个飞轮。",
        skill: "增长分析",
        options: [
          { id: "a", text: `开发者口碑 + 社区自传播 + ${p.categories.includes("devtools") || p.categories.includes("infra") ? "工具链嵌入" : "模板/内容传播"}`, best: true },
          { id: "b", text: "花钱买广告", best: false },
          { id: "c", text: "碰运气", best: false },
          { id: "d", text: "刷 Star", best: false },
        ],
        expertReview: { bestAnswer: "增长引擎是「创造者/开发者 → 内容 → 新用户 → 更多内容」的社区飞轮，工具越嵌入工作流越难被替代。", why: "B2D 增长靠口碑与可嵌入，不靠投放。", keyInsight: "让用户帮你增长（Build in public）。" },
      },
    ],
    expert: [
      {
        id: "e1", level, question: `如果让你重新设计「${p.name}」，你会做哪三个根本性改变？`, hint: "跳出现有功能，思考定位/架构/变现。",
        skill: "产品战略",
        options: [
          { id: "a", text: `① 围绕「${latentNeedOf(p)}」重构定位 ② 把 ${workflowOf(p).split("→")[0]} 做成可复用平台层 ③ 托管 + 生态变现`, best: true },
          { id: "b", text: "换一个更好看的 UI", best: false },
          { id: "c", text: "加更多模型", best: false },
          { id: "d", text: "降价", best: false },
        ],
        expertReview: { bestAnswer: "根本性改变在定位（从工具到平台/资产）、架构（把 Workflow 抽象为可组合能力）、变现（开源→托管→生态三层）。", why: "从「单点工具」升级为「平台 + 资产」，才能建立长期壁垒。", keyInsight: "第二曲线藏在第一曲线的资产里。" },
      },
      {
        id: "e2", level, question: `「${p.name}」如何进入一个已经拥挤的市场？`, hint: "GTM 与差异化定位。",
        skill: "GTM / 市场进入",
        options: [
          { id: "a", text: `选择细分场景（${sceneOf(p)}）做深度垂直，建立可感知的 10 倍体验差异`, best: true },
          { id: "b", text: "与巨头正面拼价格", best: false },
          { id: "c", text: "做和竞品一样的东西", best: false },
          { id: "d", text: "不进入", best: false },
        ],
        expertReview: { bestAnswer: "差异化进入：垂直场景 + 10 倍体验 + 社区分发，避免正面战争。", why: "AI 时代赢家通吃，必须在细分场景建立绝对优势。", keyInsight: "与其更好，不如不同。" },
      },
      {
        id: "e3", level, question: `「${p.name}」的第二增长曲线可能是什么？`, hint: "从数据资产、生态、平台化角度想。",
        skill: "产品创新",
        options: [
          { id: "a", text: `从「单点工具」→「${categoryOf(p.categories[0] ?? "agent").name} 平台/市场」→「企业解决方案」`, best: true },
          { id: "b", text: "做一个一模一样的新产品", best: false },
          { id: "c", text: "卖掉公司", best: false },
          { id: "d", text: "停止迭代", best: false },
        ],
        expertReview: { bestAnswer: "第二曲线 = 把使用中沉淀的数据/工作流/生态开放为平台与市场，再切入企业级解决方案。", why: "增长不是线性加功能，而是换一个更大的容器。", keyInsight: "第一曲线做产品，第二曲线做平台。" },
      },
      {
        id: "e4", level, question: `如果用一句话向投资人介绍「${p.name}」，你会怎么说？`, hint: "价值主张 = 用户 + Job + 差异化。",
        skill: "沟通表达",
        options: [
          { id: "a", text: `我们帮「${targetUsersOf(p)}」用 AI 完成「${deepNeedOf(p)}」，相比现有方案快一个数量级，并已实现「${businessOf(p)}」。`, best: true },
          { id: "b", text: "我们是一个 AI 工具", best: false },
          { id: "c", text: "我们有很多 Star", best: false },
          { id: "d", text: "我们用了最新模型", best: false },
        ],
        expertReview: { bestAnswer: "一句话价值主张必须包含：目标用户、完成的 Job、差异化、商业模式。", why: "表达力 = 结构化思维的外化，是 PM 面试的核心。", keyInsight: "10 秒讲清价值，是 PM 的基本功。" },
      },
    ],
  };
  return banks[level].map((c) => enrichChallenge(c, p));
}

function enrichChallenge(c: ChallengeSeed, p: Project): Challenge {
  const s = computeScores(p);
  const facts =
    c.skill === "需求分析" || c.skill === "用户研究"
      ? `项目事实：${p.name} 服务「${targetUsersOf(p)}」，核心解决「${problemOf(p)}」，近 30 天增长 ${formatSigned(p.growth30d)}。`
      : c.skill === "Feature Prioritization" || c.skill === "产品设计" || c.skill === "MVP"
        ? `项目事实：核心功能是「${coreFeatureOf(p)}」，工作流为「${workflowOf(p)}」。`
        : c.skill === "留存"
          ? `项目事实：留存靠「${latentNeedOf(p)}」的资产沉淀，而非单次体验。`
          : c.skill === "AI 产品设计" || c.skill === "增长分析"
            ? `项目事实：AI 承担「${aiCapabilityOf(p)}」，增长由「${growthOf(p)}」驱动。`
            : c.skill === "商业分析" || c.skill === "风险管理"
              ? `项目事实：商业模式为「${businessOf(p)}」，竞争激烈度 ${P(p).competition}/10。`
              : `项目事实：${p.name} 的定位是「${p.tagline}」，机会分 ${s.opportunity}/100。`;
  const bestPractice = "行业最佳实践：用「用户 → 场景 → Job → 指标 → 验证」的结构回答；先定义问题，再谈功能与实现。";
  const good = "Good：你抓住了「用户 + 场景 + Job」的关键维度，方向正确。";
  const missing = "Missing：建议补充「验证方式」——你会用什么指标或访谈来证明这个判断。";
  const wrong = "Wrong：避免停留在功能/技术层面（如「更好看、更快」），那是在描述实现，不是产品判断。";
  const deeper = `Deeper Insight：真正的判断要落到「${deepNeedOf(p)}」与「${businessOf(p)}」的闭环，而不是单点功能。`;
  return {
    ...c,
    projectFacts: facts,
    bestPractice,
    expertReview: { ...c.expertReview, good, missing, wrong, deeper },
  };
}

/* ── ⑳ AI PM 面试题库 ─────────────────────────────────────────── */
export function buildInterviewQuestions(p: Project): InterviewQuestion[] {
  return [
    { id: "q1", category: "Product Sense", question: `如果让你负责「${p.name}」，你认为它最大的增长问题是什么？`, modelAnswer: `增长问题通常是「上手成本 + 传播机制」：${p.name} 需要把「${coreFeatureOf(p)}」做成 5 分钟可体验，并让每一次成功输出自带分享钩子（模板/结果页/数据资产）。` },
    { id: "q2", category: "User Research", question: `你会如何验证「${p.name}」的核心用户假设？`, modelAnswer: `访谈 ${targetUsersOf(p)} 中的 5-10 人，观察他们完成「${deepNeedOf(p)}」的现状与痛点；用落地页/原型测付费意愿，收集 Evidence 而非 Inference。` },
    { id: "q3", category: "AI Product", question: `「${p.name}」为什么需要 AI？AI 在这里的角色是什么？`, modelAnswer: `AI 把「${workflowOf(p)}」中原本需要专业人力/规则脚本的部分自动化，角色从「工具」升级为「执行者 + 决策辅助」，用户从操作者变为审核者。` },
    { id: "q4", category: "Metrics", question: `你会用什么指标衡量「${p.name}」的成功？`, modelAnswer: `北极星 = 「每周完成的核心 Job 次数」；辅助：激活率（首次成功输出）、留存（次周回访）、产出资产数、付费转化与 NPS。` },
    { id: "q5", category: "Growth", question: `「${p.name}」如何冷启动获取前 1000 个用户？`, modelAnswer: `先进入 ${targetUsersOf(p)} 的社区（GitHub/Twitter/Reddit/垂直社群），输出高价值教程与对比内容，用「Build in public + 模板分发」获取种子用户，再靠口碑与案例裂变。` },
    { id: "q6", category: "Business", question: `「${p.name}」最合理的商业模式是什么？`, modelAnswer: `${businessOf(p)}；核心是「开源获客 + 托管/企业版/服务变现」，并逐步开放 API 与生态市场。` },
    { id: "q7", category: "Technical", question: `「${p.name}」的技术架构中，你作为 PM 最需要理解哪一层？`, modelAnswer: `最需要理解「${workflowOf(p)}」这一层：输入如何被拆解、模型/工具如何被调用、失败如何重试与校验——这决定了产品可承诺的体验与成本。` },
    { id: "q8", category: "Strategy", question: `如果 OpenAI / 大厂明天做了同款功能，你怎么办？`, modelAnswer: `差异化不建立在模型上，而建立在「${latentNeedOf(p)}」的垂直数据、工作流嵌入与生态上；用「更快、更垂直、更懂用户场景」建立局部不可替代性。` },
  ];
}

/* ── ⑫ 观点生成器 ─────────────────────────────────────────────── */
export function buildOpinionFrame(p: Project): OpinionFrame {
  return {
    biggestInnovation: `「${p.name}」最大的创新不是 AI 本身，而是把「${workflowOf(p)}」封装成了${targetUsersOf(p)}可以零门槛使用的一体化体验。`,
    biggestFlaw: `最大的缺陷：上手成本与结果不确定性仍高；对非技术用户，安装/配置/调试仍是门槛；对重度用户，缺乏「${latentNeedOf(p)}」的可视化与沉淀。`,
    ifPmSteps: [
      `第一步：重构上手体验——3 分钟跑通第一个结果，内置模板与示例。`,
      `第二步：把「${workflowOf(p).split("→")[0]}」做成可组合模块，支持导入导出与团队协作。`,
      `第三步：围绕「${deepNeedOf(p)}」设计付费分层：免费个人版 / Pro 团队版 / 企业私有化。`,
    ],
    futureOpportunity: `未来机会：垂直化（${sceneOf(p)} 细分行业）+ 资产化（把每次使用沉淀为可复用资产/模板市场）+ 生态化（开放 API 与插件市场）。`,
  };
}

/* ── ⑬ 自媒体内容生成 ─────────────────────────────────────────── */
export function buildContentPack(p: Project, userOpinion = ""): { platforms: ContentPlatform[]; score: ContentScore } {
  const s = computeScores(p);
  const insight = userOpinion ? `（我的观点：${userOpinion}）` : "";
  const pmAngle = `为什么「${p.name}」能火？从产品经理角度拆解它的设计`;
  const dna = buildProductDna(p);
  const chain = dna.map((d) => `${d.label} → ${d.value}`).join("\n");

  const xiaohongshu = `【为什么这个 AI 项目突然爆火？${insight}】

作为一个 AI 产品经理，我拆了 ${p.name} 这个项目，发现它火的真正原因不是 AI，而是产品设计👇

🔥 它解决了什么？
「${problemOf(p)}」

🎯 谁需要它？
${targetUsersOf(p)}

⚙️ 核心逻辑（产品经理视角）：
${coreFeatureOf(p)} → ${workflowOf(p)}

💡 我的判断：
这个产品真正厉害的是把「${deepNeedOf(p)}」封装成了零门槛体验。

📌 想转型 AI PM 的姐妹，建议收藏拆解👇
#AI产品经理 #AI工具 #产品拆解 #AIGC #GitHub`;

  const wechat = `## 一个 GitHub 项目，教你看懂 AI Agent 产品设计

> 每天拆解一个优秀 AI 产品 · Day ${p.name}

最近在深度研究「${p.name}」，它不仅是工具，更是一堂 AI 产品设计课。${insight}

### 一、产品 DNA（底层逻辑图）
${chain}

### 二、五层拆解模型
1. User Problem：${problemOf(p)}
2. Product Experience：${coreFeatureOf(p)}
3. AI Capability：${aiCapabilityOf(p)}
4. Agent / Workflow：${workflowOf(p)}
5. Business Model：${businessOf(p)}

### 三、如果我是这个产品的 PM
- 最大机会：${buildOpinionFrame(p).futureOpportunity}
- 第一步：重构上手体验，3 分钟跑通第一个结果

### 四、给 AI PM 的 3 个启示
1. 不要停留在 Feature，要找到 Job
2. AI 形态 = Job 结构
3. 护城河 = 数据 × 场景 × 分发

关注我，30 天带你拆完 90 个 AI 产品，建立 AI PM 产品思维。`;

  const bilibili = `【30 分钟拆解一个 AI 产品】${p.name}：从产品经理角度，它为什么值得研究？

00:00 开场：为什么研究 ${p.name}
01:30 它解决了什么问题（用户 + 场景 + 痛点）
05:00 产品核心逻辑拆解
12:00 AI 能力与 Workflow 分析
18:00 商业模式与增长引擎
24:00 如果我是 PM，我会怎么改
28:00 总结 + CTA

关键观点：${buildOpinionFrame(p).biggestInnovation}${userOpinion ? " 我的观点：" + userOpinion : ""}

如果你正在转型 AI 产品经理，这个 GitHub 项目一定值得研究。关注 + 三连，每天一个 AI 产品拆解。`;

  const youtube = `Title: Why ${p.name} Exploded — An AI PM's Product Breakdown

In this video I break down ${p.name} from a product manager's perspective:
1. The real problem it solves
2. Who needs it most
3. The product logic behind the hype
4. AI capability & workflow
5. Business model & growth engine
6. What I would change as PM

${userOpinion ? "My take: " + userOpinion : ""}

If you're transitioning to AI product management, this repo is a must-study. Subscribe for daily AI product teardowns.`;

  const twitter = `🧵 Why ${p.name} exploded — an AI PM breakdown (${p.stars.toLocaleString()}+ stars)

1/ The problem: ${problemOf(p)}
2/ Who needs it: ${targetUsersOf(p)}
3/ The product logic: ${coreFeatureOf(p)}
4/ The AI workflow: ${workflowOf(p)}
5/ The moat: ${deepNeedOf(p)}
6/ What I'd change as PM: ${buildOpinionFrame(p).ifPmSteps[0]}
${userOpinion ? "My take: " + userOpinion : ""}

Follow for daily AI product teardowns.`;

  const linkedin = `作为 AI 产品经理，我最近在拆解 ${p.name}。

结论：这个项目真正厉害的，不是模型，而是产品设计。

- 解决的 Job：${deepNeedOf(p)}
- 目标用户：${targetUsersOf(p)}
- 核心 Workflow：${workflowOf(p)}
- 商业模式：${businessOf(p)}
- 我的判断：${buildOpinionFrame(p).futureOpportunity}${userOpinion ? "\n\n我的观点：" + userOpinion : ""}

想转型 AI PM？30 天拆解 90 个 AI 产品，欢迎关注交流。`;

  const douyin = `【为什么这个 AI 项目突然爆火？产品经理视角拆解】

它解决什么问题？${problemOf(p)}

谁最需要？${targetUsersOf(p)}

真正厉害的不是 AI，而是产品设计：
${coreFeatureOf(p)}

如果我是 PM，第一步会：
${buildOpinionFrame(p).ifPmSteps[0]}${userOpinion ? "\n\n我的观点：" + userOpinion : ""}

关注我，每天一个 AI 产品拆解。`;

  const shipinhao = `【一个开源项目，教你看懂 AI 产品设计】

${p.name} 为什么值得研究？

1️⃣ 解决「${problemOf(p)}」
2️⃣ 服务「${targetUsersOf(p)}」
3️⃣ 核心是「${coreFeatureOf(p)}」
4️⃣ 商业模式「${businessOf(p)}」

产品经理启示：「不要停留在 Feature，要找到 Job。」${userOpinion ? "\n\n我的观点：" + userOpinion : ""}

关注我，30 天建立 AI 产品思维。`;

  const platforms: ContentPlatform[] = [
    { platform: "小红书", title: xiaohongshu.split("\n")[1] ?? "为什么这个 AI 项目突然爆火？", body: xiaohongshu, hashtags: ["#AI产品经理", "#产品拆解", "#AIGC", "#GitHub"] },
    { platform: "公众号", title: `一个 GitHub 项目，教你看懂 AI 产品设计：${p.name}`, body: wechat, hashtags: ["#AI产品", "#产品经理"] },
    { platform: "Bilibili", title: `30 分钟拆解 ${p.name}：AI PM 视角`, body: bilibili, hashtags: ["#AI产品经理", "#产品拆解", "#AIGC"] },
    { platform: "YouTube", title: `Why ${p.name} Exploded — AI PM Breakdown`, body: youtube, hashtags: ["#AIPM", "#ProductManagement", "#AI"] },
    { platform: "Twitter / X", title: `Why ${p.name} exploded (thread)`, body: twitter, hashtags: ["#AI", "#ProductManagement", "#AIPM"] },
    { platform: "LinkedIn", title: `拆解 ${p.name}：AI PM 视角`, body: linkedin, hashtags: ["#AIPM", "#ProductThinking", "#AI"] },
    { platform: "抖音", title: "为什么这个 AI 项目突然爆火？", body: douyin, hashtags: ["#AI产品", "#产品经理", "#AI工具"] },
    { platform: "视频号", title: "一个开源项目，教你看懂 AI 产品设计", body: shipinhao, hashtags: ["#AI产品经理", "#产品思维"] },
  ];

  const score: ContentScore = {
    hook: Math.min(98, 78 + s.opportunity / 8),
    information: Math.min(97, 74 + s.technical / 6),
    originality: Math.min(96, 70 + (userOpinion ? 18 : 0) + p.profile.innovation * 16),
    productInsight: Math.min(98, 80 + s.opportunity / 7),
    practicalValue: Math.min(97, 76 + s.sideHustle / 6),
    shareability: Math.min(98, 78 + s.content / 6),
    total: 0,
  };
  score.total = Math.round((score.hook + score.information + score.originality + score.productInsight + score.practicalValue + score.shareability) / 6);

  return { platforms, score };
}

export function buildVideoScript(p: Project, userOpinion = ""): VideoScript {
  const o = buildOpinionFrame(p);
  const segments = [
    { label: "Hook", text: `如果你正在转型 AI 产品经理，这个 GitHub 项目（${p.name}）一定值得研究。` },
    { label: "Problem", text: `它解决的核心问题：${problemOf(p)}。` },
    { label: "Product", text: `${p.name} 用「${coreFeatureOf(p)}」把这件事变成了一句话/一次点击。` },
    { label: "Why It Matters", text: `因为它服务的「${targetUsersOf(p)}」正处在「${sceneOf(p)}」场景的爆发期，需求真实且高频。` },
    { label: "Product Breakdown", text: `从 PM 视角拆解：用户 → 痛点 → 需求 → 场景 → 产品 → 功能 → AI 能力 → Workflow → 结果 → 价值 → 商业模式。` },
    { label: "AI Logic", text: `AI 在这里承担「${aiCapabilityOf(p)}」，把「${workflowOf(p)}」自动化，用户从操作者变成审核者。` },
    { label: "Business", text: `商业模式：${businessOf(p)}；增长引擎：${p.categories.includes("devtools") || p.categories.includes("infra") ? "工具链嵌入 + 开发者口碑" : "内容传播 + 模板分发"}。` },
    { label: "My PM Opinion", text: `${o.biggestInnovation} ${userOpinion ? "我的观点：" + userOpinion : o.futureOpportunity}` },
  ];
  return {
    title: `30 分钟拆解 ${p.name}：一个 AI 产品经理的产品分析`,
    segments,
    cta: `关注我，每天拆解一个优秀 AI 产品，30 天建立 AI PM 产品思维。`,
  };
}

/* ── ⑮ Rebuild This Product：从项目到 PRD ─────────────────────── */
export function buildPrd(p: Project): PrdDraft {
  return {
    productBrief: `${p.name} Rebuild — 一个面向「${targetUsersOf(p)}」的「${deepNeedOf(p)}」产品（垂直版/改进版）。`,
    problem: problemOf(p),
    users: targetUsersOf(p),
    prd: `# ${p.name} Rebuild PRD\n\n## 背景\n${problemOf(p)}\n\n## 目标用户\n${targetUsersOf(p)}\n\n## 核心价值\n${deepNeedOf(p)}\n\n## 范围\n- 核心：${coreFeatureOf(p)}\n- 非目标：不做 ${p.categories.includes("saas") ? "多租户企业级" : "社区/社交"}（V1）`,
    userFlow: [`输入目标/需求`, `系统拆解任务（${workflowOf(p).split("→")[0]}）`, `执行「${coreFeatureOf(p)}」`, `结果生成与校验`, `导出/分享/沉淀资产`],
    features: [
      coreFeatureOf(p),
      `结果导出与分享`,
      `模板库（行业模板）`,
      `历史记录与资产沉淀`,
      `团队协作（V1.5）`,
    ],
    mvp: `MVP = 单用户闭环：输入 → ${coreFeatureOf(p)} → 输出 → 导出。7 天可上线验证付费意愿。`,
    aiArchitecture: `意图解析 → 任务规划 → 工具/模型调用 → 结果校验 → 失败重试；模型 Provider 抽象 + 可观测。`,
    dataArchitecture: `用户输入/输出资产、模板库、使用日志（用于质量迭代）、成本计量。`,
    metrics: [`激活率（首次成功输出）`, `周完成 Job 数`, `留存（次周回访）`, `导出/分享率`, `付费转化率`, `单次任务成本`],
    gtm: `社区冷启动：GitHub + Twitter/X + 垂直社群 → 模板分发 → 案例裂变 → 付费分层（Free / Pro / Team）。`,
  };
}

/* ── ⑭ AI PM Case Library / Portfolio Case ────────────────────── */
export function buildCaseStudy(p: Project): CaseStudy {
  const cat = p.categories[0] ?? "agent";
  const catName = categoryOf(cat).name;
  return {
    id: `case-${p.slug}`,
    projectId: p.slug,
    projectName: p.name,
    category: `${catName} Case`,
    title: `${p.name}：${p.tagline}`,
    problem: problemOf(p),
    user: targetUsersOf(p),
    productLogic: `${coreFeatureOf(p)} → ${workflowOf(p)}`,
    aiArchitecture: aiCapabilityOf(p),
    businessModel: businessOf(p),
    myDecision: `我认为：${p.name} 最值得学习的是「${workflowOf(p)}」的产品化封装；如果是我，会先做「${buildOpinionFrame(p).ifPmSteps[0]}」。`,
    improvement: buildOpinionFrame(p).futureOpportunity,
  };
}

/* ── 能力评估与成长 ───────────────────────────────────────────── */
export function emptyAbilities(): AbilityScores {
  return { productThinking: 0, requirementAnalysis: 0, aiUnderstanding: 0, agentUnderstanding: 0, ux: 0, businessModel: 0, growth: 0, dataAnalysis: 0, technical: 0, communication: 0 };
}

export function abilityLabel(k: keyof AbilityScores): string {
  const map: Record<keyof AbilityScores, string> = {
    productThinking: "产品思维", requirementAnalysis: "需求分析", aiUnderstanding: "AI 理解",
    agentUnderstanding: "Agent 理解", ux: "UX 设计", businessModel: "商业",
    growth: "增长", dataAnalysis: "数据", technical: "技术", communication: "表达",
  };
  return map[k];
}

export function averageAbility(a: AbilityScores): number {
  const vals = Object.values(a);
  return Math.round(vals.reduce((x, y) => x + y, 0) / vals.length);
}

export function abilityGapRecommendation(a: AbilityScores): { weakness: string; score: number; recommended: { category: string; title: string; reason: string }[] } {
  const entries = Object.entries(a) as [keyof AbilityScores, number][];
  const weakest = entries.sort((x, y) => x[1] - y[1])[0];
  const map: Record<string, { category: string; title: string; reason: string }[]> = {
    productThinking: [{ category: "agent", title: "Agent 分类 TOP 榜", reason: "训练产品判断与机会识别" }],
    requirementAnalysis: [{ category: "agent", title: "Agent 分类 TOP 榜", reason: "训练需求挖掘（Hidden Needs）" }],
    aiUnderstanding: [{ category: "llm", title: "LLM 分类 TOP 榜", reason: "理解 AI 能力与模型底座" }],
    agentUnderstanding: [{ category: "agent", title: "Agent 分类 TOP 榜", reason: "补齐 Agent Product Design 能力" }],
    ux: [{ category: "saas", title: "SaaS 分类 TOP 榜", reason: "研究真实用户场景与体验设计" }],
    businessModel: [{ category: "saas", title: "SaaS 分类 TOP 榜", reason: "补齐商业分析与变现判断" }],
    growth: [{ category: "productivity", title: "Productivity 分类 TOP 榜", reason: "研究增长引擎与飞轮" }],
    dataAnalysis: [{ category: "data", title: "Data 分类 TOP 榜", reason: "训练指标与数据分析" }],
    technical: [{ category: "infra", title: "Infra 分类 TOP 榜", reason: "研究技术实现与功能取舍" }],
    communication: [{ category: "content", title: "Content 分类 TOP 榜", reason: "通过输出内容训练表达" }],
  };
  const recs = map[weakest[0]] ?? [{ category: "agent", title: "Agent 分类 TOP 榜", reason: "训练产品思维" }];
  return {
    weakness: abilityLabel(weakest[0]),
    score: weakest[1],
    recommended: recs,
  };
}

/* ── 内部短语库 ───────────────────────────────────────────────── */
export function targetUsersOf(p: Project): string {
  const map: Record<string, string> = {
    ollama: "个人开发者、AI 爱好者、需要本地推理的团队",
    dify: "产品经理、非工程师、中小企业 AI 负责人",
    n8n: "运营、增长团队、自动化咨询师",
    "open-webui": "自托管爱好者、隐私敏感企业与个人",
    comfyui: "设计师、内容创作者、AI 工作流创作者",
    "browser-use": "RPA 工程师、运营、数据采集团队",
    "claude-code": "全栈开发者、技术管理者",
    "mcp-servers": "AI 应用开发者、Agent 平台方",
    "anthropic-skills": "Agent 开发者、效率工具作者",
    "money-printer": "自媒体、短视频创作者、MCN",
    markitdown: "RAG 工程师、文档处理团队、内容团队",
    storm: "研究员、学生、深度内容作者",
    ragflow: "企业知识管理负责人、IT 团队",
  };
  return map[p.slug] ?? `关注「${p.categories.map((c) => categoryOf(c).name).join("/")}」的开发者、产品经理与创业者`;
}

export function problemOf(p: Project): string {
  const map: Record<string, string> = {
    ollama: "本地运行大模型门槛高、安装复杂",
    langchain: "LLM 应用开发缺少统一抽象与可组合框架",
    dify: "非工程师无法快速搭建 AI 应用与 Agent 工作流",
    "open-webui": "自托管 AI 服务缺少统一好用的对话界面",
    n8n: "业务自动化与 AI 能力割裂，需要统一编排",
    "browser-use": "网页自动化脚本脆弱，无法应对页面变化",
    openhands: "软件工程自动化停留在辅助，无法自主闭环",
    "claude-code": "终端开发者缺少可规划可执行的 AI 结对编程",
    comfyui: "AI 图像工作流缺少可视化、可复现的节点编排",
    "money-printer": "短视频创作耗时长，无法规模化产出",
    "mcp-servers": "AI 与外部工具之间缺少标准互联协议",
    markitdown: "文档转结构化 Markdown 成本高、格式混乱",
    ragflow: "企业复杂文档导致 RAG 检索质量差",
    storm: "长文研究写作需要大量人工调研",
  };
  return map[p.slug] ?? "AI 能力与真实业务场景之间缺少可落地的产品化桥梁";
}

export function needOf(p: Project): string {
  const users = targetUsersOf(p).split("、")[0];
  return `${users} 需要「${coreFeatureOf(p)}」`;
}

export function deepNeedOf(p: Project): string {
  const map: Record<string, string> = {
    "money-printer": "低成本持续获得内容与流量",
    comfyui: "稳定高效地批量产出专业视觉内容",
    "browser-use": "无需维护脚本即可完成重复网页操作",
    dify: "让业务人员直接拥有 AI 能力，不再依赖开发排队",
    n8n: "把分散的业务系统用一个自动化大脑串起来",
    "open-webui": "在一个界面里管理所有 AI 对话与知识",
    ollama: "低成本、可控地获得本地 AI 能力",
    markitdown: "把任意资料变成可检索可复用的结构化知识",
    storm: "在几小时内完成需要数天的深度研究",
    ragflow: "让企业知识真正能被员工随时问到",
    "claude-code": "让代码交付速度提升一个数量级",
    "anthropic-skills": "把个人能力沉淀为可复用可出售的资产",
  };
  return map[p.slug] ?? "显著降低完成核心 Job 的时间与门槛，并沉淀可复用资产";
}

export function sceneOf(p: Project): string {
  const cat = p.categories[0] ?? "agent";
  const map: Record<string, string> = {
    "money-printer": "日更短视频的运营场景",
    comfyui: "批量出图/出视频的创作生产场景",
    "browser-use": "重复网页操作的数据/运营场景",
    dify: "企业内部搭建 AI 应用的工作场景",
    "open-webui": "个人/团队日常使用 AI 的工作台场景",
    coding: "写代码/改代码的研发场景",
    agent: "需要多步骤任务自动化的业务场景",
    rag: "企业知识检索与问答场景",
    skill: "Agent 工作流中的能力复用场景",
  };
  return map[cat] ?? `与「${categoryOf(cat).name}」相关的日常业务场景`;
}

export function coreFeatureOf(p: Project): string {
  if (p.categories.includes("coding")) return "用自然语言生成/修改代码";
  if (p.categories.includes("video")) return "自动生成短视频";
  if (p.categories.includes("image")) return "可视化工作流生成图像";
  if (p.categories.includes("audio")) return "生成/转换语音音频";
  if (p.categories.includes("rag") || p.categories.includes("pkm")) return "基于私有知识的问答检索";
  if (p.categories.includes("agent")) return "多步骤任务自动规划与执行";
  if (p.categories.includes("automation")) return "自动化执行网页/业务流程";
  if (p.categories.includes("mcp")) return "统一连接 AI 与外部工具";
  if (p.categories.includes("skill")) return "把能力封装为可复用 Skill";
  return p.tagline;
}

export function aiCapabilityOf(p: Project): string {
  if (p.categories.includes("agent")) return "LLM 任务规划 + 工具调用 + 记忆与校验";
  if (p.categories.includes("coding")) return "代码理解、生成、编辑与测试闭环";
  if (p.categories.includes("rag")) return "文档解析 + 向量检索 + 生成引用";
  if (p.categories.includes("image") || p.categories.includes("video")) return "扩散/生成模型推理与工作流调度";
  if (p.categories.includes("audio")) return "语音/音频模型推理";
  if (p.categories.includes("mcp")) return "标准化工具协议与上下文注入";
  return "LLM 驱动的意图理解与内容生成";
}

export function workflowOf(p: Project): string {
  if (p.categories.includes("agent")) return "意图理解 → 任务规划 → 工具调用 → 结果校验 → 迭代";
  if (p.categories.includes("coding")) return "需求理解 → 代码索引 → 计划生成 → 编辑执行 → 测试修复";
  if (p.categories.includes("rag")) return "文档入库 → 切分向量化 → 检索召回 → 生成引用 → 用户反馈";
  if (p.categories.includes("automation")) return "任务解析 → 页面/API 操作 → 结果验证 → 重试";
  if (p.categories.includes("video")) return "选题 → 文案 → 配音 → 画面 → 剪辑 → 成片";
  if (p.categories.includes("image")) return "提示词/参考图 → 节点编排 → 模型推理 → 后处理 → 输出";
  return "输入 → 处理 → 输出 → 反馈迭代";
}

export function outcomeOf(p: Project): string {
  if (p.categories.includes("coding")) return "可运行的代码与更快的交付速度";
  if (p.categories.includes("video")) return "可直接发布的成品视频";
  if (p.categories.includes("image")) return "专业级图像与可复用工作流";
  if (p.categories.includes("rag")) return "带引用的准确答案";
  if (p.categories.includes("agent")) return "自动完成的端到端任务";
  return "高质量结果与可复用资产";
}

export function valueOf(p: Project): string {
  return `为「${targetUsersOf(p).split("、")[0]}」节省时间/提升产出/降低门槛，沉淀「${deepNeedOf(p)}」的长期价值`;
}

export function businessOf(p: Project): string {
  const c = P(p).commercialPotential;
  if (c >= 8) return "开源核心 + 托管云/企业版 + 服务生态";
  if (c >= 6) return "开源获客 + 服务/咨询/培训变现";
  return "社区与影响力为主，商业化探索期";
}

export function latentNeedOf(p: Project): string {
  const map: Record<string, string> = {
    "money-printer": "内容模板市场与批量代运营服务",
    comfyui: "工作流模板交易市场",
    "browser-use": "可交易的工作流/自动化剧本库",
    dify: "企业内部 Agent 应用市场",
    n8n: "行业自动化模板与场景包",
    "open-webui": "个人知识资产沉淀与跨设备同步",
    ollama: "私有模型管理与企业级部署编排",
    markitdown: "文档知识库的一站式加工管线",
    ragflow: "行业知识库解决方案包",
    "claude-code": "团队编码规范与自动化流程沉淀",
    "anthropic-skills": "Skill 市场与个人技能资产化",
    storm: "研究自动化报告服务",
  };
  return map[p.slug] ?? "垂直行业模板/资产市场与团队协作沉淀";
}


/* ── ⑥ PM Deep Analysis（15 维） ─────────────────────────────── */
export function buildPmDeepAnalysis(p: Project): { key: string; label: string; value: string }[] {
  return [
    { key: "problem", label: "Problem", value: problemOf(p) },
    { key: "user", label: "User", value: targetUsersOf(p) },
    { key: "scenario", label: "Scenario", value: sceneOf(p) },
    { key: "pain", label: "Pain", value: painPointOf(p) },
    { key: "need", label: "Need", value: needOf(p) },
    { key: "job", label: "Job", value: deepNeedOf(p) },
    { key: "solution", label: "Solution", value: p.name + " — " + p.tagline },
    { key: "feature", label: "Feature", value: coreFeatureOf(p) },
    { key: "workflow", label: "Workflow", value: workflowOf(p) },
    { key: "ai", label: "AI", value: aiCapabilityOf(p) },
    { key: "agent", label: "Agent", value: p.categories.includes("agent") ? "多步任务编排 + 工具调用 + 记忆校验" : "单步增强（当前形态）" },
    { key: "data", label: "Data", value: dataOf(p) },
    { key: "ux", label: "UX", value: uxOf(p) },
    { key: "business", label: "Business", value: businessOf(p) },
    { key: "growth", label: "Growth", value: growthOf(p) },
  ];
}

/* ── ⑧ Why AI ────────────────────────────────────────────────── */
export function buildWhyAi(p: Project): { needAi: string; withoutAi: string; costReduced: string; efficiencyGained: string; newExperience: string } {
  return {
    needAi: `为什么需要 AI：因为「${coreFeatureOf(p)}」本质是「${workflowOf(p)}」的智能执行，规则脚本无法覆盖真实世界的开放输入与多步决策。`,
    withoutAi: `如果没有 AI：「${workflowOf(p).split("→")[0]}」只能靠人工/固定模板完成，门槛高、不可规模化。`,
    costReduced: `AI 降低的成本：人力成本（自动替代重复劳动）、时间成本（分钟级 vs 小时级）、学习成本（自然语言 vs 专业操作）。`,
    efficiencyGained: `AI 提高的效率：吞吐量（批量并行）、决策速度（即时生成+校验）、覆盖度（长尾场景）。`,
    newExperience: `AI 创造的新体验：从「工具」到「助理」——用户只需表达目标，产品负责执行，且结果可持续学习与沉淀。`,
  };
}

/* ── ⑨ AI Native Test ────────────────────────────────────────── */
export function buildAiNativeTest(p: Project): { current: string; enhanced: string; native: string } {
  return {
    current: `Current Product（当前）：${p.name} 用「${coreFeatureOf(p)}」+「${workflowOf(p)}」把 AI 作为功能嵌入现有流程。`,
    enhanced: `AI Enhanced（AI 增强）：在现有形态上强化「${aiCapabilityOf(p)}」、增加校验/重试/记忆，并把「${latentNeedOf(p)}」做成默认能力。`,
    native: `AI Native（AI 原生）：假设 AI 已存在 5 年，应该从第一天就设计为「目标 → 自主执行 → 用户审核」的单向闭环，并把每一次使用自动沉淀为资产与模板市场，商业模式直接围绕资产与生态展开。`,
  };
}

/* ── 产品底层逻辑架构分析 + 如何搭建 ─────────────────────────── */
export function buildBuildPlan(p: Project): {
  summary: string;
  architectureLayers: { layer: string; desc: string }[];
  techStack: string[];
  dataFlow: string[];
  modules: string[];
  steps: { phase: string; days: string; tasks: string[] }[];
  copy: string[];
  dontCopy: string[];
  dependencies: string[];
  cost: string;
  checklist: string[];
} {
  const s = computeScores(p);
  const isAgent = p.categories.includes("agent");
  const isRag = p.categories.includes("rag") || p.categories.includes("pkm");
  const isCoding = p.categories.includes("coding");
  const isContent = p.categories.includes("content") || p.categories.includes("video") || p.categories.includes("image");

  const layers = [
    { layer: "① 接入层 / UX", desc: `${p.name} 的入口形态（${p.categories.includes("coding") ? "CLI/IDE" : isContent ? "Web 工作台" : "Web/API"}）+ 一句话目标输入 + 进度/结果可视化（${uxOf(p)}）` },
    { layer: "② 业务/编排层", desc: `核心是「${workflowOf(p)}」的状态机：任务拆解、步骤执行、失败重试、结果校验` },
    { layer: "③ AI/模型层", desc: `${aiCapabilityOf(p)}；模型 Provider 抽象（OpenAI/Anthropic/本地），提示模板与工具注册表` },
    { layer: "④ 数据层", desc: `${dataOf(p)}；结构化输出（JSON Schema 校验）、向量库/缓存、使用日志` },
    { layer: "⑤ 变现/增长层", desc: `${businessOf(p)}；用量计量、分享钩子、模板市场与内容分发` },
  ];

  const tech = [
    ...(isAgent ? ["LangGraph / OpenAI Agents / CrewAI（编排）", "工具调用 + MCP"] : []),
    ...(isRag ? ["向量库（Qdrant/Chroma/Milvus）", "文档解析（MarkItDown/unstructured）"] : []),
    ...(isCoding ? ["代码索引 + LSP", "沙箱执行器（Docker/VM）"] : []),
    ...(isContent ? ["媒体管线（FFmpeg/渲染）", "素材/模板管理"] : []),
    "LLM Provider 抽象（OpenAI / Anthropic / 本地 Ollama）",
    "Next.js / FastAPI + Postgres + Redis",
    "Structured Output（Instructor / Zod）",
  ];

  const dataFlow = [
    `输入：${p.categories.includes("coding") ? "代码库 + 需求" : "用户目标/文档/素材"}`,
    `处理：${workflowOf(p)}`,
    `输出：${outcomeOf(p)}`,
    "反馈：结果校验 + 用户评分 → 质量日志 → 迭代提示/流程",
  ];

  const modules = [
    `core-engine（${workflowOf(p).split("→")[0]} → 结果 的主流程）`,
    "provider（模型/工具抽象）",
    "templates（行业模板库）",
    "assets（结果/产出沉淀）",
    "usage（计量 + 分享 + 变现）",
  ];

  const steps = [
    {
      phase: "Phase 1 · 最小闭环",
      days: "7 天",
      tasks: [`跑通「${coreFeatureOf(p)}」的单用户闭环`, "固定模型 Provider 抽象与结构化输出", "做一个可展示的 Demo 页"],
    },
    {
      phase: "Phase 2 · 产品化",
      days: "14 天",
      tasks: ["补齐校验/重试/错误提示（UX）", "模板库 + 历史资产沉淀", "接入计量与分享钩子"],
    },
    {
      phase: "Phase 3 · 验证",
      days: "30 天",
      tasks: ["找 10 个种子用户（社区冷启动）", "验证付费意愿（落地页/套餐）", "根据「${deepNeedOf(p)}」迭代定位"],
    },
  ];

  const copy = [
    `复制「${workflowOf(p)}」这条主流程的产品化封装（核心价值）`,
    `复制「结果可审核 + 资产沉淀」的 UX 设计`,
    `复制「开源获客 + 托管/服务变现」的商业路径`,
  ];
  const dontCopy = [
    "不要复制它的全部功能堆叠，只复制核心闭环",
    "不要复制它的架构复杂度（KV 缓存/分布式可以先不做）",
    "不要直接复刻其社区与生态（需要时间积累，先做垂直场景）",
  ];

  const deps = [
    "LLM API 成本（每月 $20-200 视用量）",
    ...(isRag ? ["向量库与嵌入服务"] : []),
    ...(isAgent ? ["Agent 框架与工具运行环境"] : []),
    "基础设施（Vercel/Serverless 或单台 VPS）",
  ];

  const checklist = [
    `① 用 7 天跑通「${coreFeatureOf(p)}」最小闭环`,
    "② 结果可审核、错误可解释、可重试",
    "③ 每次使用沉淀资产（历史/模板）",
    "④ 内置分享钩子（结果页/模板可传播）",
    "⑤ 埋点：激活 / 留存 / 导出率 / 付费转化",
    "⑥ 30 天验证 10 个种子用户的付费意愿",
  ];

  return {
    summary: `${p.name} 的底层逻辑是「${deepNeedOf(p)}」：用「${workflowOf(p)}」把 AI 能力产品化，以「${businessOf(p)}」形成闭环。复制它的正确姿势 = 核心流程 + 垂直场景 + 更薄的产品层。`,
    architectureLayers: layers,
    techStack: tech,
    dataFlow,
    modules,
    steps,
    copy,
    dontCopy,
    dependencies: deps,
    cost: `MVP 成本：${s.sideHustle >= 70 ? "低（$50-300，个人可负担）" : "中（$300-1500，含模型与基础设施）"}；7-30 天可上线`,
    checklist,
  };
}
