/**
 * 行业专家实战报告（Industry Expert Practical Report）— business-first expert
 * analysis for every project: industry, real customers, scenarios, cases,
 * JTBD, pain map, alternatives, value chain, ROI, willingness to pay,
 * opportunity matrix, expert redesign, one-page conclusion, final judgment.
 * 严禁退化成软件功能介绍 —— 从客户出发、从业务出发、从价值出发。
 */
import { computeScores, formatPct, formatSigned, formatStars } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import { buildHiddenNeeds, buildJTBD, targetUsersOf, problemOf, sceneOf, coreFeatureOf, deepNeedOf, latentNeedOf, businessOf, growthOf, moatOf, workflowOf, aiCapabilityOf, dataOf } from "@/lib/learning";
import { buildFactSheet, buildKillerFeature, buildProduct2, buildCloningPlan } from "@/lib/master";
import { buildDirectorReport } from "@/lib/director";
import { categoryOf } from "@/lib/categories";
import type { Project } from "@/lib/types";
import type { LiveRepo } from "@/lib/live";
import type { SourceIntel } from "@/lib/source";

export function expertIdentity(p: Project): string[] {
  const cat = p.categories[0] ?? "agent";
  if (cat === "agent" || cat === "automation") return ["AI Agent 产品专家", "企业 AI 应用专家", "AI 工作流专家", "自动化专家", "企业数字化转型专家", "AI 商业化专家"];
  if (cat === "devtools" || cat === "coding" || cat === "devproductivity" || cat === "infra") return ["Developer Tools 产品专家", "软件工程专家", "开发者工作流专家", "DevOps 专家", "AI Coding 专家", "开源商业化专家"];
  if (cat === "video" || cat === "image" || cat === "audio" || cat === "content" || cat === "selfmedia") return ["视频/内容产品专家", "在线教育专家", "企业培训专家", "内容创作者专家", "自媒体运营专家", "MCN 专家", "创作者经济专家"];
  if (cat === "data" || cat === "rag" || cat === "research" || cat === "llm") return ["数据产品专家", "BI 专家", "企业数据治理专家", "数据科学家", "企业管理决策专家"];
  if (cat === "saas" || cat === "productivity" || cat === "ecommerce" || cat === "marketing") return ["SaaS 产品专家", "企业数字化专家", "运营增长专家", "电商/营销专家"];
  return ["行业专家联合评审委员会", "SaaS 产品专家", "企业数字化专家", "增长专家"];
}

export function buildExpertReport(p: Project): { n: number; title: string; body: string }[] {
  const r = buildReverseEngineering(p);
  const s = computeScores(p);
  const needs = buildHiddenNeeds(p);
  const jtbd = buildJTBD(p);
  const director = buildDirectorReport(p);
  const killer = buildKillerFeature(p);
  const p2 = buildProduct2(p);
  const clone = buildCloningPlan(p);
  const cat = categoryOf(p.categories[0] ?? "agent");
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const users = targetUsersOf(p).split("、");
  const stars5 = (v: number) => "★".repeat(Math.max(0, Math.min(5, Math.round(v / 20)))) + "☆".repeat(5 - Math.max(0, Math.min(5, Math.round(v / 20))));

  return [
    f(1, "项目基本信息", buildFactSheet(p).map((x) => `${x.k}：${x.v}`).join(" · ")),
    f(2, "行业专家身份", `本报告由「${expertIdentity(p).join(" / ")}」联合评审（依据：${cat.name} 定位自动切换专家身份）。`),
    f(3, "行业背景", `行业：${cat.name} · 子行业/细分赛道：${sceneOf(p)}；上下游：AI 模型/数据 → 应用 → 企业服务；典型用户：${users[0] ?? "—"}；过去 5 年：AI/云/SaaS 让门槛大幅下降，模型能力成为新杠杆；为什么现在出现：${p.categories.includes("agent") ? "Agent/MCP 生态成熟" : "AI 能力产品化窗口"}（[INFERENCE]）。`),
    f(4, "真实客户画像", `3 类核心用户：① ${users[0] ?? "SMB"}（高频任务：${coreFeatureOf(p)}；痛点：${problemOf(p)}；购买者≈使用者，付费意愿中高）② 中型团队（协作与复用；决策者=部门负责人）③ 大型企业（统一/合规；决策者=负责人，付费者=老板，受益人=员工）。注意 User ≠ Buyer ≠ Decision Maker ≠ Beneficiary。`),
    f(5, "核心业务场景", `场景 1「${sceneOf(p)}」：触发=${deepNeedOf(p)}；原始流程=${r.userJourney.slice(0, 6).map((u) => u.step).join("→")}；当前方案=手工/多工具组合；痛点=${needs.core}。场景 2「团队协作与资产复用」：痛点=能力分散、无法沉淀（[INFERENCE]）。`),
    f(6, "真实/典型案例", `【行业典型案例推演】Case 1（${users[0] ?? "核心用户"}）：每周高频执行「${coreFeatureOf(p)}」，原方案耗时 2-4 小时/次，产品介入后可替代 ${r.productDnaFlow.slice(0, 4).join("→")}，节省时间/人力；Case 2（团队）：统一工作流+资产沉淀；Case 3（企业）：合规+私有化。案例为推演，须用真实客户访谈验证（【假设】）。`),
    f(7, "用户 Jobs-to-be-Done", `When ${jtbd.when} → I want ${jtbd.want} → So that ${jtbd.soThat}；Functional Job=${deepNeedOf(p)}；Emotional Job=专业/可控/不焦虑；Social Job=高效/数字化领先（[专家判断]）。`),
    f(8, "用户痛点地图", `Pain Score（频率×严重×成本×替代难度）：痛点A「${problemOf(p)}」→ P0；痛点B「上手与结果不确定性」→ P1；痛点C「${latentNeedOf(p)} 未满足」→ P2。`),
    f(9, "当前替代方案", `替代方案地图：人工（高成本/低效）· Excel/Notion（低自动化）· 传统软件（专业门槛）· 其他 SaaS（分散）· 外包（贵）· 自己开发（慢）；本项目真正替代的=人工+多工具组合，而非同类软件（[专家判断]）。`),
    f(10, "产品价值链", `价值链：需求→信息→决策→${coreFeatureOf(p)}→审核→执行→分发→反馈→优化→商业结果；当前切入点=${r.productToTech.feature}；上游机会=${dataOf(p)}；下游机会=${latentNeedOf(p)}；可向前/向后延伸→${p2.newProduct}→平台/生态。`),
    f(11, "核心价值判断", `表面卖「${p.tagline}」，实际卖「${deepNeedOf(p)}」，再进一步「${latentNeedOf(p)}」；真正的价值单位：${s.sideHustle >= 70 ? "节省时间 + 降低人工 + 提高产出" : "降低专业门槛 + 提高决策/生产效率"}。`),
    f(12, "商业价值（ROI）", `【估算模型】若用户每周节省 10 小时、人力成本 $50/h → 年节省 ~$26,000；若定价 $3,000/年 → ROI ≈ 8.7×；若定价 $1,000/年 → ROI ≈ 26×。具体以真实访谈/报价验证（【假设】）。`),
    f(13, "用户付费意愿", `谁最愿意付费：${users[0] ?? "核心用户"}中的 Power/企业用户（“不用它会损失更多钱”）；付费触发点=用量限制/团队协作/合规需求；免费用户=“觉得好用”但未到付费阈值。`),
    f(14, "核心功能价值排序", `P0 生死级：${r.productToTech.feature}；P1 核心竞争力：${r.featureToCode[1]?.feature ?? "结果导出/分享"}；P2 体验增强：模板/历史；P3 后期：${r.featureToCode[3]?.feature ?? "高级功能"}。若只保留 3 个：${clone.mvp.split("+").slice(0, 3).join("、")}；若只开发 1 个：${r.productToTech.feature}；最可能形成护城河：${moatOf(p)}。`),
    f(15, "产品设计建议", `因为【${users[0] ?? "核心用户"}】在【${sceneOf(p)}】存在【${problemOf(p)}】，当前靠人工/多工具，因此建议【${r.productToTech.feature} → ${latentNeedOf(p)} 的默认沉淀】，预计降低时间/人力成本并提高产出（可追溯到客户需求）。`),
    f(16, "AI 化机会", `当前人工 Workflow：${r.userJourney.slice(0, 8).map((u) => u.step).join("→")}；可 AI 化：${workflowOf(p)}；可 Agent 化：${p.categories.includes("agent") ? "规划/执行/校验" : "多步任务自动化"}；演进：Human → AI Copilot → AI Agent → Multi-Agent。`),
    f(17, "AI Agent 机会", `哪些步骤 Agent 化：${p.categories.includes("agent") ? "任务规划+工具调用+失败重试" : "高频重复环节"}；哪些需 Tool：搜索/代码/浏览器/文件；哪些需人工审批：最终结果/高风险动作（[专家判断]）。`),
    f(18, "Workflow 重构机会", `真实用户工作流：触发→输入→收集→AI 分析→决策→执行→人工审核→自动执行→结果→反馈→优化；节点标记：人工=目标/审批，AI=分析/生成，Agent=规划/执行，Tool=外部能力，Data=上下文；判断：最大价值来自 Workflow 重构（把人工环节 AI/Agent 化），而非功能堆叠（[专家判断]）。`),
    f(19, "竞争格局", `同类=${cat.name} 竞品；替代=人工/多工具/外包；自研=大企业内建；AI 通用工具=ChatGPT 等；传统 SaaS。用户为什么选它：${p.tagline} 的零门槛+开源；为什么不选：成熟度/生态；真正竞争对手=${director.conclusions.realMoat} 之外的“人工+旧工作流”；开源优势=信任/传播，限制=商业化需托管/企业版（[INFERENCE]）。`),
    f(20, "开源商业化机会", `OSS 优势：社区/信任/技术传播/免费获客；商业化机会：Cloud / Enterprise / SaaS / API / Premium / Support / Consulting / Marketplace；最合理模式：${businessOf(p)}（[专家判断]）。`),
    f(21, "产品机会地图", `Opportunity Matrix（用户价值 × 实现难度）：⭐⭐⭐⭐⭐ 立即做=${r.productToTech.feature} 垂直化；⭐⭐⭐⭐ 重点储备=${latentNeedOf(p)} 资产化；⭐⭐⭐ 中期=${p2.newProduct} 平台化；⭐⭐ 低优先级=高级报告/导出；⭐ 不建议=与核心无关的社区/社交。`),
    f(22, "专家重新设计方案", `服务谁=${users[0] ?? "核心用户"}；最核心场景=${sceneOf(p)}；第一个用户为何用=解决「${problemOf(p)}」；第一周完成=${r.productToTech.feature} 最小闭环；MVP 砍掉=${r.featureToCode.slice(2).map((x) => x.feature).join("、")}；最值得 AI 化=${workflowOf(p).split("→")[0]}；Agent 化=${p.categories.includes("agent") ? "规划/执行" : "高频重复环节"}；自动化=校验/分发；保留人工=最终决策/高风险动作；最终形态=${p2.newProduct.includes("平台") ? "Platform" : p.categories.includes("agent") ? "Agent" : "SaaS/Workflow"}（为什么：${director.conclusions.whyWins}）。`),
    f(23, "MVP 建议", `MVP=${clone.mvp}；核心指标=激活率/周完成 Job/留存；周期=${clone.timeline}；团队=${clone.team}；成本=${clone.cost}。`),
    f(24, "用户验证方案", `找 10 个客户：${users.slice(0, 3).join("、")} 的 Power 用户/团队负责人；验证：痛点真实度/使用频率/付费意愿/留存/ROI/Workflow（用访谈+落地页+试用）。`),
    f(25, "商业化建议", `定价：Free 引流 + Pro（用量/协作）+ Team/Enterprise（合规/私有化）；先验证 ROI 叙事再规模化；GTM：社区 + 内容 + 行业案例（[专家判断]）。`),
    f(26, "专家一页纸结论", `行业价值 ${stars5(s.opportunity)} · 用户痛点 ${stars5(Math.round(p.profile.userDemand * 10))} · 使用频率 ${stars5(Math.round(p.profile.userDemand * 10))} · 用户规模 ${stars5(s.opportunity)} · 付费意愿 ${stars5(s.money)} · 产品价值 ${stars5(s.product)} · 技术壁垒 ${stars5(s.technical)} · AI 化潜力 ${stars5(Math.round(p.profile.innovation * 10))} · Agent 化潜力 ${stars5(p.categories.includes("agent") ? 90 : Math.round(p.profile.innovation * 8))} · 商业化潜力 ${stars5(s.commercial)} · 开源优势 ${stars5(s.health)} · 创业机会 ${stars5(s.sideHustle)} · 产品改造空间 ${stars5(s.product)} · 推荐程度 ${stars5(s.opportunity)}。`),
    f(27, "“真正解决的是什么”最终判断", `这个项目真正解决的不是「${p.tagline}」，而是「${deepNeedOf(p)}」；它真正的商业机会不是「${cat.name} 工具」，而是「${latentNeedOf(p)}」的基础设施/平台机会。是否值得继续产品化/商业化：${director.verdict}（${director.verdictWhy}）。`),
  ];
}

export function buildExpertOnePager(p: Project): { label: string; stars: number }[] {
  const s = computeScores(p);
  const mk = (label: string, v: number) => ({ label, stars: Math.max(0, Math.min(5, Math.round(v / 20))) });
  return [
    mk("行业价值", s.opportunity),
    mk("用户痛点", p.profile.userDemand * 10),
    mk("使用频率", p.profile.userDemand * 10),
    mk("用户规模", s.opportunity),
    mk("付费意愿", s.money),
    mk("产品价值", s.product),
    mk("技术壁垒", s.technical),
    mk("AI 化潜力", p.profile.innovation * 10),
    mk("Agent 化潜力", p.categories.includes("agent") ? 90 : p.profile.innovation * 8),
    mk("商业化潜力", s.commercial),
    mk("开源优势", s.health),
    mk("创业机会", s.sideHustle),
    mk("产品改造空间", s.product),
    mk("推荐程度", s.opportunity),
  ];
}

export function buildExpertFinalJudgment(p: Project): { surface: string; deep: string; opportunity: string } {
  return {
    surface: `真正解决的不是「${p.tagline}」`,
    deep: `而是「${deepNeedOf(p)}」`,
    opportunity: `真正的商业机会不是「${categoryOf(p.categories[0] ?? "agent").name} 工具」，而是「${latentNeedOf(p)}」的基础设施/平台机会。`,
  };
}

/* ── 源码驱动版 ─────────────────────────────────────────────────── */
export function buildSourceExpertReport(repo: LiveRepo, intel: SourceIntel): { n: number; title: string; body: string }[] {
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  return [
    f(1, "项目基本信息", `仓库 ${repo.fullName} · ${intel.tagline} · Stars ${formatStars(repo.stars)} · License ${repo.license ?? "—"} · 发布时间 ${repo.createdAt}`),
    f(2, "行业专家身份", `按主题/描述自动切换专家身份；当前信号：${intel.features.slice(0, 3).join(" / ") || intel.tagline}（[INFERENCE]）`),
    f(3, "行业背景", `定位「${intel.tagline}」；细分赛道与上下游待结合 Issues/官网确认（[INFERENCE]）`),
    f(4, "真实客户画像", "以 README/Issues 推断目标用户（[INFERENCE]）；需区分 User/Buyer/Decision Maker/Beneficiary（[假设]）"),
    f(5, "核心业务场景", `场景「${intel.tagline}」：触发=用户出现相关任务；原流程=手工/多工具（[HYPOTHESIS]）`),
    f(6, "真实/典型案例", "【行业典型案例推演】需以真实客户访谈验证（[假设]）"),
    f(7, "用户 Jobs-to-be-Done", `When 用户处于「${intel.tagline}」场景 → I want 一键获得结果 → So that 提升效率（[INFERENCE]）`),
    f(8, "用户痛点地图", "待 Issues/社区证据确认（[假设]）"),
    f(9, "当前替代方案", "人工/多工具/外包（[HYPOTHESIS]）"),
    f(10, "产品价值链", `切入点=「${intel.tagline}」；上下游与平台化路径待确认（[HYPOTHESIS]）`),
    f(11, "核心价值判断", `表面卖「${intel.tagline}」；实际价值单位待用户证据（[假设]）`),
    f(12, "商业价值（ROI）", "【估算模型】待定价与用户数据验证（[假设]）"),
    f(13, "用户付费意愿", "待验证（[假设]）"),
    f(14, "核心功能价值排序", `P0=「${intel.features[0] ?? intel.tagline}」；其余待源码/Issues 确认（[INFERENCE]）`),
    f(15, "产品设计建议", `针对「${intel.tagline}」相关痛点，建议强化「${intel.features[0] ?? "核心闭环"}」并补资产沉淀（[INFERENCE]）`),
    f(16, "AI 化机会", `检出 AI 组件：${intel.aiComponents.join(" / ") || "未检出"}；可 AI/Agent 化环节待确认（[INFERENCE]）`),
    f(17, "AI Agent 机会", intel.aiComponents.some((a) => /Agent/.test(a)) ? "检出 Agent 组件，可深化规划/工具/校验" : "暂未检出 Agent，可评估高频环节 Agent 化（[HYPOTHESIS]）"),
    f(18, "Workflow 重构机会", "从「输入→处理→输出」出发，把人工高频环节 AI/Agent 化（[HYPOTHESIS]）"),
    f(19, "竞争格局", "待与同类/替代方案对比（[假设]）"),
    f(20, "开源商业化机会", `License=${repo.license ?? "—"}；OSS 获客 → Cloud/Enterprise/API（[INFERENCE]）`),
    f(21, "产品机会地图", "待用户需求池（Issues）确认（[假设]）"),
    f(22, "专家重新设计方案", `聚焦「${intel.tagline}」的最小闭环，垂直化+资产化（[HYPOTHESIS]）`),
    f(23, "MVP 建议", "核心闭环 + 结果导出 + 资产沉淀（[INFERENCE]）"),
    f(24, "用户验证方案", "访谈核心用户 + 落地页验证付费意愿（[假设]）"),
    f(25, "商业化建议", "开源获客 → 托管/API/企业版（[INFERENCE]）"),
    f(26, "专家一页纸结论", `Stars ${formatStars(repo.stars)} 信号 · 商业化/ROI 待验证（[假设]）`),
    f(27, "“真正解决的是什么”最终判断", `真正解决的不是「${intel.tagline}」，而是相关用户的高频 Job；商业机会待用户需求验证（[假设]）。`),
  ];
}
