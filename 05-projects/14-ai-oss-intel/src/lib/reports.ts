/**
 * AI Report Engine — deterministic "expert" analysis that synthesizes the
 * 25-section Project Intelligence Report from the data model. Swappable with
 * a real LLM provider behind the same interface (see lib/ai/provider).
 */
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { categoryLabel } from "@/lib/store";
import type { Project, ProjectReport, VerdictRating } from "@/lib/types";

const STARS = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

function starsFor(score: number): number {
  return Math.max(1, Math.min(5, Math.round(score / 20)));
}

function level(v: number): string {
  if (v >= 9) return "极强";
  if (v >= 7.5) return "强";
  if (v >= 6) return "较强";
  if (v >= 4.5) return "中等";
  if (v >= 3) return "偏弱";
  return "弱";
}

function catNames(p: Project): string {
  return p.categories.map(categoryLabel).join("、");
}

export function generateReport(p: Project): ProjectReport {
  const s = computeScores(p);
  const r30 = growthRate(p, 30);
  const r7 = growthRate(p, 7);
  const r90 = growthRate(p, 90);
  const prof = p.profile;

  const sections = [
    {
      title: "1. Executive Summary",
      body: `${p.name}（${p.fullName}）是「${p.tagline}」。当前 ${formatStars(p.stars)} Stars、${formatStars(p.forks)} Forks、${p.contributors.toLocaleString()} 贡献者，近 30 天增长 ${formatSigned(p.growth30d)}（${formatPct(r30)}）。综合 AI Project Score ${s.aiScore}/100，Opportunity Score ${s.opportunity}/100。一句话：${oneLiner(p, s)}`,
    },
    {
      title: "2. What Is It?",
      body: p.description + (p.homepage ? ` 官方主页：${p.homepage}。` : "") + ` 主要语言 ${p.language}，License ${p.license ?? "未标注"}，首次发布于 ${p.createdAt}。`,
    },
    {
      title: "3. Problem",
      body: `它解决的问题是「${problemFor(p)}」。在 AI 时代，这类痛点被 LLM 能力放大，成为高优先级需求。`,
    },
    {
      title: "4. Target Users",
      body: `核心用户：${usersFor(p)}。其次是围绕这些用户的技术团队、企业与内容创作者。`,
    },
    {
      title: "5. User Needs",
      body: `用户核心诉求：① 降低使用门槛；② 更快获得结果；③ 与现有工作流集成；④ 数据可控/可私有化；⑤ 持续更新与社区支持。本项目的用户需求强度为 ${level(prof.userDemand)}（${prof.userDemand}/10）。`,
    },
    {
      title: "6. Product Logic",
      body: `产品逻辑：输入（${inputsFor(p)}）→ 核心处理（${coreFor(p)}）→ 输出（${outputsFor(p)}）。价值主张清晰度 ${level(prof.productValue)}，产品完成度 ${level(prof.productValue)}。`,
    },
    {
      title: "7. Technical Logic",
      body: `技术亮点集中在：${techFor(p)}。工程实现质量 ${level(prof.innovation)}（创新 ${prof.innovation}/10），生态集成度 ${level(prof.ecosystem)}（${prof.ecosystem}/10）。`,
    },
    {
      title: "8. Architecture",
      body: `典型架构：${architectureFor(p)}。整体模块化程度高，依赖少则易二次开发，依赖深则壁垒高但复制难度大。`,
    },
    {
      title: "9. Feature Tree",
      body: `核心功能：${featuresFor(p)}。辅助功能：${auxFor(p)}。扩展点：插件/API/CLI/自托管。`,
    },
    {
      title: "10. User Journey",
      body: `发现（GitHub/Trending/社区）→ 试用（README/Demo）→ 采纳（自托管或 API）→ 深度使用（配置/扩展）→ 付费（企业版/云服务）→ 传播（教程/案例）。当前阶段：${stageFor(p)}。`,
    },
    {
      title: "11. Growth Analysis",
      body: `近 7 天 +${formatSigned(p.growth7d)}（${formatPct(r7)}），近 30 天 +${formatSigned(p.growth30d)}（${formatPct(r30)}），近 90 天 +${formatSigned(p.growth90d)}（${formatPct(r90)}）。Growth Score ${s.growth}/100。${
        r30 > 15 ? "处于高速增长期，话题热度与资本关注度高。" : r30 > 6 ? "稳步增长，社区健康。" : "增长趋缓，进入成熟期或需新引爆点。"
      }`,
    },
    {
      title: "12. Competitive Analysis",
      body: `竞争格局：${competitionFor(p)}。差异化优势：${moatFor(p)}。竞争激烈度 ${prof.competition}/10（越低越蓝海）。`,
    },
    {
      title: "13. Business Model",
      body: `当前商业模式：${businessModelFor(p)}。商业化成熟度 ${level(prof.commercialPotential)}（${prof.commercialPotential}/10）。`,
    },
    {
      title: "14. Monetization",
      body: `可变现路径：① SaaS / 托管云服务；② API 按量计费；③ 企业版 License；④ 插件/模板市场；⑤ 咨询与实施服务；⑥ 课程与内容。预估 Money Score ${s.money}/100，赚钱潜力 ${level(prof.moneyFit)}。`,
    },
    {
      title: "15. Industry Applications",
      body: `适合行业：${industriesFor(p)}。可复制到企业知识库、客服、营销、内容、研发效能等场景。`,
    },
    {
      title: "16. Side Hustle Opportunities",
      body: `副业适配度 ${level(prof.sideHustleFit)}（${prof.sideHustleFit}/10）。副业方向：① 基于它做垂直 SaaS；② 做模板/工作流售卖；③ 做部署与实施服务；④ 做内容与课程；⑤ 做社区与插件。`,
    },
    {
      title: "17. SaaS Opportunities",
      body: `SaaS 化可行性 ${level(prof.startupFit)}（${prof.startupFit}/10），商业潜力 ${level(prof.commercialPotential)}。建议先做「开源 + 托管云」双层策略，用开源获客、托管变现。`,
    },
    {
      title: "18. Skill Opportunities",
      body: `Skill 化适配度 ${level(prof.skillFit)}（${prof.skillFit}/10）。可将核心能力封装为 /analyze-${p.slug}、/${p.slug}-assistant 等 Agent Skill，复用于 Claude Code / Codex。`,
    },
    {
      title: "19. Portfolio Value",
      body: `简历/作品集价值 ${level(prof.resumeFit)}（${prof.resumeFit}/10）。适合岗位：${rolesFor(p)}。建议二开项目：复刻核心流程 + 换垂直场景 + 补齐 UI 与测试。`,
    },
    {
      title: "20. Content Opportunities",
      body: `内容潜力 ${level(prof.contentFit)}（${prof.contentFit}/10）。推荐选题：①「${p.name} 是什么？」；②「为什么 ${p.name} 突然爆火？」；③「5 分钟部署 ${p.name}」；④「用 ${p.name} 赚钱的 5 种方式」；⑤「${p.name} 能替代哪些商业软件？」`,
    },
    {
      title: "21. Startup Opportunities",
      body: `创业机会：${startupFor(p)}。一人公司可行性 ${level(prof.startupFit)}，建议先验证付费意愿再投入开发。`,
    },
    {
      title: "22. Weaknesses",
      body: `潜在弱点：${weaknessesFor(p)}。`,
    },
    {
      title: "23. Risks",
      body: `主要风险：① 上游模型/平台政策变化；② 巨头下场挤压；③ 社区治理与贡献者流失；④ License 与商业化边界；⑤ 技术路线被替代。`,
    },
    {
      title: "24. Improvement Suggestions",
      body: `改进建议：${improvementsFor(p)}。`,
    },
    {
      title: "25. AI Product Manager Verdict",
      body: `综合结论：${finalVerdict(p, s)}。`,
    },
  ];

  const verdict: VerdictRating[] = [
    { key: "learn", label: "Learn", stars: starsFor(Math.max(40, s.aiScore)) },
    { key: "use", label: "Use", stars: starsFor(Math.max(30, s.product)) },
    { key: "clone", label: "Clone", stars: starsFor(Math.max(20, s.sideHustle * 0.6 + s.opportunity * 0.4)) },
    { key: "improve", label: "Improve", stars: starsFor(Math.max(30, (s.opportunity + s.technical) / 2)) },
    { key: "monetize", label: "Monetize", stars: starsFor(Math.max(20, s.money)) },
    { key: "saas", label: "SaaS", stars: starsFor(Math.max(15, s.commercial)) },
    { key: "skill", label: "Skill", stars: starsFor(Math.max(15, s.skill)) },
    { key: "portfolio", label: "Portfolio", stars: starsFor(Math.max(15, s.resume)) },
    { key: "content", label: "Content", stars: starsFor(Math.max(15, s.content)) },
    { key: "startup", label: "Startup", stars: starsFor(Math.max(15, s.startup)) },
  ];

  const opportunities = buildOpportunities(p, s);

  const onePersonStartup = {
    developerReq: level(prof.personalDevValue) === "强" || level(prof.personalDevValue) === "极强" ? "需要全栈 + AI 工程能力" : "需要基础全栈能力，可借助 AI Coding 补齐",
    aiReq: "需要熟悉 LLM 调用与提示工程，Agent 编排能力优先",
    designReq: prof.productValue >= 7 ? "需要中等 UI/UX 能力（可借助模板）" : "需要较强产品设计能力，建议先用模板验证",
    operationReq: prof.sideHustleFit >= 7 ? "需要内容运营与获客能力，建议冷启动走 SEO + 社区" : "运营需求中等，可走开发者社区口碑",
    mvpTime: mvpTimeFor(p),
    cost: (prof.commercialPotential >= 8 ? "Medium" : "Low") as "Low" | "Medium" | "High",
    monetization: (prof.moneyFit >= 7 ? "Easy" : prof.moneyFit >= 5 ? "Medium" : "Hard") as "Easy" | "Medium" | "Hard",
    score: Math.round(s.startup * 0.5 + s.sideHustle * 0.3 + s.opportunity * 0.2),
  };

  const copyPath = [
    { step: "理解核心流程", detail: `先精读 README 与架构，画出 ${p.name} 的数据流与核心模块。` },
    { step: "最小复刻", detail: `用 3-7 天复刻最小闭环（输入→处理→输出），不追求全部功能。` },
    { step: "换垂直场景", detail: `把通用能力套到细分行业（如 ${industriesFor(p).split("、")[0]}），形成差异化。` },
    { step: "补齐产品层", detail: "加上登录、计费、多租户与数据看板，把开源项目变成产品。`" },
    { step: "验证付费", detail: "先收 10 个种子用户的钱，再投入规模化开发。" },
  ];

  const dna = [
    { label: "核心定位", value: p.tagline },
    { label: "关键优势", value: moatFor(p) },
    { label: "商业模式", value: businessModelFor(p) },
    { label: "增长引擎", value: r30 > 10 ? "社区口碑 + 开发者自传播" : "产品力 + 生态集成" },
    { label: "护城河", value: prof.ecosystem >= 7 ? "生态与社区网络效应" : "垂直场景深耕" },
    { label: "个人价值", value: `${level(prof.personalDevValue)}（${prof.personalDevValue}/10）` },
  ];

  const recommendedActions = [
    { action: "阅读 README + 快速部署", why: `30 分钟内跑通 ${p.name}，建立体感。`, effort: "低" as const },
    { action: s.opportunity >= 70 ? `分析并记录「${opportunities[0]?.name}」的验证计划` : "拆解其核心模块代码", why: s.opportunity >= 70 ? "该项目机会分高，值得优先验证商业化" : "先吃透实现，再谈机会", effort: "中" as const },
    { action: "加入其社区/关注 Release", why: "保持对生态变化与竞品的感知。", effort: "低" as const },
    { action: s.resume >= 70 ? "基于它做一个垂直二开 Demo 进简历" : "写一篇深度拆解文章做内容资产", why: s.resume >= 70 ? "简历价值高，二开 Demo 是面试利器" : "内容资产长期复用，且可反向引流", effort: "中" as const },
  ];

  return {
    projectId: p.id,
    generatedAt: new Date().toISOString().slice(0, 10),
    sections,
    verdict,
    oneLiner: oneLiner(p, s),
    opportunities,
    onePersonStartup,
    copyPath,
    dna,
    recommendedActions,
  };
}

function oneLiner(p: Project, s: ReturnType<typeof computeScores>): string {
  if (s.opportunity >= 80) return `「${p.name}」正处于高机会窗口：增长快、需求强、商业化路径清晰，建议优先关注并验证。`;
  if (s.money >= 75) return `「${p.name}」是成熟的赚钱标的：商业模式已验证，适合包装成服务或垂直 SaaS。`;
  if (s.resume >= 75) return `「${p.name}」是优秀的简历项目：技术含量高、生态完整，二开后是面试杀手锏。`;
  if (s.skill >= 75) return `「${p.name}」非常适合 Skill 化：核心能力可封装为可复用 Agent Skill。`;
  return `「${p.name}」值得纳入雷达持续观察，结合自身目标（学习/副业/简历）决定投入深度。`;
}

function problemFor(p: Project): string {
  const map: Record<string, string> = {
    ollama: "本地运行大模型门槛高、安装复杂",
    langchain: "LLM 应用开发缺少统一抽象与可组合框架",
    dify: "非工程师无法快速搭建 AI 应用与 Agent 工作流",
    "open-webui": "自托管 AI 服务缺少好用的统一对话界面",
    n8n: "业务自动化与 AI 能力割裂，需要统一编排",
    "browser-use": "RPA/网页自动化脚本脆弱，无法应对页面变化",
    openhands: "软件工程自动化停留在辅助，无法自主闭环",
    "claude-code": "终端开发者缺少可规划、可执行的 AI 结对编程",
    codex: "缺少开源、可本地化的终端编码 Agent",
    comfyui: "AI 图像工作流缺少可视化、可复现的节点编排",
    "money-printer": "短视频创作耗时长，无法规模化产出",
    "mcp-servers": "AI 与外部工具之间缺少标准互联协议",
    "anthropic-skills": "Agent 能力无法标准化、可复用打包",
    markitdown: "文档转结构化 Markdown 成本高、格式混乱",
    ragflow: "企业文档复杂格式导致 RAG 检索质量差",
    storm: "长文研究写作需要大量人工调研",
    "anything-llm": "企业/个人搭建知识库问答成本高",
  };
  return map[p.slug] ?? "AI 能力与真实业务场景之间缺少可落地的产品化桥梁";
}

function usersFor(p: Project): string {
  const map: Record<string, string> = {
    ollama: "个人开发者、AI 爱好者、需要本地推理的团队",
    dify: "产品经理、非工程师、中小企业 AI 负责人",
    n8n: "运营、增长团队、自动化咨询师",
    "open-webui": "自托管爱好者、中小团队、隐私敏感企业",
    comfyui: "设计师、内容创作者、AI 工作流创作者",
    "browser-use": "RPA 工程师、运营、电商与数据采集团队",
    "claude-code": "全栈开发者、技术管理者",
    "mcp-servers": "AI 应用开发者、Agent 平台方",
    "anthropic-skills": "Agent 开发者、效率工具作者",
    "money-printer": "自媒体、短视频创作者、MCN",
    markitdown: "RAG 工程师、文档处理团队、内容团队",
    storm: "研究员、学生、深度内容作者",
    ragflow: "企业知识管理负责人、IT 团队",
  };
  return map[p.slug] ?? `关注「${catNames(p)}」领域的开发者、产品经理与创业者`;
}

function inputsFor(p: Project): string {
  if (p.categories.includes("coding")) return "自然语言需求、代码库、Issue";
  if (p.categories.includes("video")) return "主题/脚本/素材";
  if (p.categories.includes("image")) return "提示词、参考图";
  if (p.categories.includes("audio")) return "文本/语音/参考音色";
  if (p.categories.includes("rag") || p.categories.includes("pkm")) return "文档、网页、数据库";
  if (p.categories.includes("automation")) return "任务描述、业务流程、网页";
  return "用户指令、数据、配置";
}

function coreFor(p: Project): string {
  if (p.categories.includes("agent")) return "任务规划 → 工具调用 → 结果验证的多 Agent 编排";
  if (p.categories.includes("coding")) return "代码理解 → 计划生成 → 编辑执行 → 测试修复";
  if (p.categories.includes("rag")) return "文档解析 → 向量化 → 检索 → 生成";
  if (p.categories.includes("image")) return "扩散/生成模型推理与工作流调度";
  if (p.categories.includes("video")) return "脚本、配音、画面与剪辑的自动组装";
  if (p.categories.includes("automation")) return "意图理解 → 浏览器/API 操作 → 结果校验";
  return "模型能力 + 领域逻辑 + 交互闭环";
}

function outputsFor(p: Project): string {
  if (p.categories.includes("coding")) return "可运行代码、补丁、PR、测试结果";
  if (p.categories.includes("video")) return "成品短视频/视频文件";
  if (p.categories.includes("image")) return "生成图像与工作流文件";
  if (p.categories.includes("audio")) return "语音/音乐/音频文件";
  if (p.categories.includes("rag")) return "带引用的答案、知识库、报告";
  return "结果、报告、可复用资产";
}

function techFor(p: Project): string {
  const parts: string[] = [];
  if (p.categories.includes("agent")) parts.push("Agent 编排与工具调用");
  if (p.categories.includes("rag")) parts.push("向量检索与混合召回");
  if (p.categories.includes("llm") || p.categories.includes("infra")) parts.push("推理加速与模型优化");
  if (p.categories.includes("vision") || p.categories.includes("image")) parts.push("视觉模型与图像管线");
  if (p.categories.includes("audio")) parts.push("语音/音频信号处理");
  parts.push(`${p.language} 工程实现`);
  return parts.join("、");
}

function architectureFor(p: Project): string {
  if (p.categories.includes("agent")) return "Agent Runtime（规划/执行/记忆）→ 工具层 → 模型 Provider → 可观测层";
  if (p.categories.includes("rag")) return "Ingestion 管道 → 向量库 → Retriever → LLM 生成 → 引用校验";
  if (p.categories.includes("coding")) return "CLI/IDE 前端 → 代码索引 → 计划 Agent → 沙箱执行器";
  if (p.categories.includes("automation")) return "任务解析 → 浏览器/API 驱动层 → 校验与重试 → 事件日志";
  if (p.categories.includes("image") || p.categories.includes("video")) return "前端工作流编辑器 → 节点引擎 → 模型服务 → 资源缓存";
  return "接入层 → 核心引擎 → 数据层 → 展示层";
}

function featuresFor(p: Project): string {
  const core: string[] = [];
  if (p.categories.includes("agent")) core.push("多 Agent 编排");
  if (p.categories.includes("coding")) core.push("代码生成/补全");
  if (p.categories.includes("rag")) core.push("知识库问答");
  if (p.categories.includes("image")) core.push("图像生成与编辑");
  if (p.categories.includes("video")) core.push("视频自动生成");
  if (p.categories.includes("audio")) core.push("语音/音频生成");
  if (p.categories.includes("automation")) core.push("流程自动化");
  if (p.categories.includes("pkm")) core.push("个人知识管理");
  core.push("可配置/可扩展接口");
  return core.slice(0, 5).join("、");
}

function auxFor(p: Project): string {
  return ["插件/扩展市场", "API/CLI", "自托管部署", "多用户与权限", "数据统计与可视化"].slice(0, p.profile.ecosystem >= 7 ? 5 : 3).join("、");
}

function stageFor(p: Project): string {
  const g = growthRate(p, 30);
  if (p.releases >= 100 && g < 8) return "成熟期";
  if (g > 15) return "爆发增长期";
  if (g > 6) return "成长期";
  return "早期/成熟稳定期";
}

function competitionFor(p: Project): string {
  const c = p.profile.competition;
  if (c >= 7) return "赛道成熟，巨头与众多开源项目并存，靠差异化与垂直化突围";
  if (c >= 5) return "竞争中等，存在差异化与垂直化空间";
  return "相对蓝海，竞争者少，先发优势明显";
}

function moatFor(p: Project): string {
  const prof = p.profile;
  if (prof.ecosystem >= 8) return "生态与社区网络效应（插件/教程/集成）";
  if (prof.innovation >= 8) return "技术领先与架构创新";
  if (prof.commercialPotential >= 8) return "商业产品化先发与品牌";
  return "垂直场景深耕与易用性";
}

function businessModelFor(p: Project): string {
  const prof = p.profile;
  if (prof.commercialPotential >= 8) return "开源核心 + 托管云/企业版 + 服务生态";
  if (prof.commercialPotential >= 6) return "以开源获客，通过服务/咨询/培训变现";
  return "以社区与影响力为主，商业化探索期";
}

function industriesFor(p: Project): string {
  const map: Record<string, string> = {
    "money-printer": "自媒体、电商、营销",
    comfyui: "设计、广告、游戏、内容",
    "open-webui": "企业、教育、个人效率",
    dify: "金融、零售、医疗、政务",
    n8n: "运营、客服、电商、SaaS",
    "browser-use": "电商、数据、招聘、金融",
    ragflow: "金融、法律、制造、政务",
    "anything-llm": "教育、咨询、中小企业",
    "mcp-servers": "软件、AI 平台、SaaS",
    "anthropic-skills": "软件、效率工具、咨询",
    markitdown: "法律、金融、内容、知识管理",
    storm: "研究、媒体、教育",
  };
  return map[p.slug] ?? "软件、互联网、教育、内容、企业服务";
}

function startupFor(p: Project): string {
  const ideas = buildOpportunities(p, computeScores(p));
  return ideas.slice(0, 2).map((i) => i.name).join("、") + " 等方向（详见下方产品机会清单）。";
}

function weaknessesFor(p: Project): string {
  const prof = p.profile;
  const w: string[] = [];
  if (prof.competition >= 7) w.push("赛道拥挤，同质化竞品多");
  if (prof.commercialPotential < 6) w.push("商业化路径不清晰");
  if (prof.ecosystem < 6) w.push("生态与文档待完善");
  if (p.openIssues > 500) w.push(`Issue 积压较多（${p.openIssues.toLocaleString()} 个）`);
  if (p.contributors < 200) w.push("核心贡献者集中，Bus Factor 风险");
  if (w.length === 0) w.push("社区规模大但治理复杂度高");
  return w.join("；");
}

function improvementsFor(p: Project): string {
  const prof = p.profile;
  const im: string[] = [];
  if (prof.commercialPotential < 7) im.push("补齐企业版：SSO、审计、私有化部署");
  im.push("强化可观测性与用量分析");
  im.push("完善模板/示例库降低上手成本");
  im.push("建立贡献者激励与社区治理机制");
  return im.join("；");
}

function finalVerdict(p: Project, s: ReturnType<typeof computeScores>): string {
  if (s.opportunity >= 80) return `${p.name} 不建议直接复制，但值得快速拆解其核心流程，并结合垂直场景（如${industriesFor(p).split("、")[0]}）重新包装，具备较高的副业与创业转化率。`;
  if (s.money >= 75) return `${p.name} 商业模式已被验证，个人最适合做「部署实施服务」或「垂直定制版」，30 天内可启动变现。`;
  if (s.resume >= 75) return `${p.name} 是极佳的简历/作品集项目：建议 7 天完成垂直二开 Demo，重点讲清「为什么这样设计」与「如何用 AI 提效」。`;
  if (s.skill >= 75) return `${p.name} 的核心能力非常适合封装成 Agent Skill，可复用于 Claude Code / Codex，形成个人效率资产。`;
  return `${p.name} 值得关注与学习，但需结合自身目标（学习/副业/简历）决定投入深度，避免盲目复制。`;
}


function rolesFor(p: Project): string {
  const roles: string[] = [];
  if (p.categories.includes("coding") || p.categories.includes("devtools")) roles.push("AI Engineer", "Full Stack AI Developer");
  if (p.categories.includes("agent")) roles.push("AI Agent Engineer", "AI PM");
  if (p.categories.includes("saas") || p.categories.includes("sidehustle")) roles.push("AI Product Manager", "AI 创业者");
  if (p.categories.includes("research") || p.categories.includes("llm")) roles.push("AI 研究员");
  if (p.categories.includes("image") || p.categories.includes("video") || p.categories.includes("content")) roles.push("AI 内容创作者", "AI 产品设计师");
  if (roles.length === 0) roles.push("AI 产品经理", "AI 工程师");
  return roles.slice(0, 3).join("、");
}

function mvpTimeFor(p: Project): string {
  const d = p.profile.sideHustleFit >= 7 ? "7 天" : p.profile.productValue >= 7 ? "14 天" : "30 天";
  return `MVP 建议 ${d} 内完成（7 / 14 / 30 / 90 天档位可选）`;
}

function buildOpportunities(p: Project, s: ReturnType<typeof computeScores>): ProjectReport["opportunities"] {
  const base = p.tagline;
  const cat = p.categories[0] ?? "agent";
  const ideas: { name: string; target: string; pain: string; feature: string; ai: string; mvp: string; model: string; moat: string; diff: "低" | "中" | "高"; time: string; pot: number }[] = [
    {
      name: `${p.name} 垂直版 · ${industriesFor(p).split("、")[0]}场景`,
      target: `${industriesFor(p).split("、")[0]}行业的中小团队`,
      pain: "通用开源项目无法开箱即用，需要行业适配",
      feature: "行业模板 + 开箱即用配置 + 专属数据源接入",
      ai: "复用开源能力 + 行业微调/RAG",
      mvp: "选 3 个行业场景做模板，7 天可上线",
      model: "SaaS 订阅 + 实施服务",
      moat: "行业 Know-how + 模板资产",
      diff: "中", time: "30 天", pot: 88,
    },
    {
      name: `${p.name} 托管云服务（Open-Source → SaaS）`,
      target: "不想自建的技术团队与个人",
      pain: "自托管运维成本高",
      feature: "一键托管、监控、多租户、企业安全",
      ai: "开源核心 + 运维自动化",
      mvp: "单租户托管 + 计费，14 天可上线",
      model: "按席位/用量订阅",
      moat: "托管体验 + SLA",
      diff: "中", time: "45 天", pot: 92,
    },
    {
      name: `${p.name} Skill / Agent 封装`,
      target: "Claude Code / Codex 重度用户",
      pain: "能力分散，无法在 Agent 工作流中复用",
      feature: "把核心能力封装为可调用 Skill",
      ai: "提示工程 + 工具封装",
      mvp: "发布 1 个 Skill 到市场，3 天可上线",
      model: "Skill 市场 / 付费订阅",
      moat: "早期生态位 + 分发渠道",
      diff: "低", time: "7 天", pot: 80,
    },
    {
      name: `${p.name} 内容/培训变现`,
      target: "自媒体、教育者、企业培训",
      pain: "AI 工具普及但缺乏系统化内容",
      feature: "教程、课程、模板包、社群",
      ai: "AI 辅助内容生产",
      mvp: "系列短视频 + 模板包，7 天启动",
      model: "课程 + 会员 + 模板",
      moat: "内容资产 + 私域流量",
      diff: "低", time: "14 天", pot: 75,
    },
    {
      name: `${p.name} 实施与定制服务`,
      target: "需要落地的中小企业",
      pain: "内部无人懂如何部署与定制",
      feature: "部署、定制开发、培训、运维",
      ai: "用 AI 提效交付流程",
      mvp: "接 3 个付费项目验证",
      model: "项目制 / 年费服务",
      moat: "交付口碑 + 行业案例",
      diff: "低", time: "7 天启动", pot: 78,
    },
  ];
  return ideas.map((i) => ({
    name: i.name,
    targetUsers: i.target,
    painPoint: i.pain,
    coreFeatures: i.feature,
    aiCapabilities: i.ai,
    mvp: i.mvp,
    businessModel: i.model,
    moat: i.moat,
    devDifficulty: i.diff,
    devTime: i.time,
    potential: i.pot,
  }));
}
