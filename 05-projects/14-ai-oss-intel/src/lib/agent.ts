/**
 * AI AGENT Product + Workflow Reverse Engineering — two independent
 * first-class analysis layers:
 *  REPORT A · AI AGENT PRODUCT DIRECTOR REPORT (24 sections)
 *  REPORT B · WORKFLOW REVERSE ENGINEERING REPORT (26 sections)
 *  + AI AGENT MASTER MAP (interactive diagram)
 * Source-driven variants for live projects.
 */
import { computeScores, formatPct, formatSigned, formatStars } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import { buildHiddenNeeds, buildJTBD, dataOf, deepNeedOf, problemOf, targetUsersOf, sceneOf, aiCapabilityOf, workflowOf, businessOf, latentNeedOf, growthOf, moatOf } from "@/lib/learning";
import { answerQuestion, type MapNode } from "@/lib/master";
import { buildDirectorReport } from "@/lib/director";
import { categoryOf } from "@/lib/categories";
import type { Project } from "@/lib/types";
import type { LiveRepo } from "@/lib/live";
import type { SourceIntel } from "@/lib/source";

function agentTier(p: Project): string {
  if (p.categories.includes("agent")) return "AI Agent";
  if (p.categories.includes("automation")) return "AI Workflow / Automation";
  if (p.categories.includes("coding")) return "AI Copilot / Coding Agent";
  if (p.categories.includes("rag") || p.categories.includes("pkm")) return "AI Assistant（RAG 增强）";
  return "AI Enhanced Tool";
}

function necessity(p: Project): { matrix: string[]; judge: string } {
  const isAgent = p.categories.includes("agent");
  return {
    matrix: [
      "Traditional Software：能部分解决，但无自主决策/Tool 调用（自动化 ✕ · 决策 ✕ · Tool ✕）",
      "Chatbot：能对话，但无法执行多步任务（自动化 ✕ · 决策 ✕ · Tool ✕）",
      "Copilot：能辅助，但依赖用户驱动（自动化 ◐ · 决策 ✕ · Tool ◐）",
      "Workflow：能固定流程，但无法动态决策（自动化 ✓ · 决策 ✕ · Tool ✓）",
      "Agent：" + (isAgent ? "能动态规划+决策+Tool 调用，真正自主执行（自动化 ✓ · 决策 ✓ · Tool ✓）" : "过度设计，固定 Workflow 即可满足（自动化 ✓ · 决策 ◐ · Tool ✓）"),
      "Multi-Agent：" + (isAgent ? "仅在需要分工协作时必要，当前多属包装（自动化 ✓ · 决策 ✓ · Tool ✓）" : "不必要"),
    ],
    judge: isAgent
      ? `Agent 是真正必要的：任务「${workflowOf(p)}」需要动态规划、Tool 调用与失败重试，普通 Chatbot/Workflow 无法覆盖（[INFERENCE]）。`
      : `Agent 更多是产品包装：任务可用固定 Workflow/AI 增强完成，不必上升到 Agent（[INFERENCE]）。判断依据：${categoryOf(p.categories[0] ?? "agent").name} 定位 + 无多步自主编排需求。`,
  };
}

export function buildAgentDirectorReport(p: Project): { n: number; title: string; body: string }[] {
  const r = buildReverseEngineering(p);
  const s = computeScores(p);
  const needs = buildHiddenNeeds(p);
  const jtbd = buildJTBD(p);
  const nec = necessity(p);
  const director = buildDirectorReport(p);
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const tier = agentTier(p);
  return [
    f(1, "Executive Summary", `产品形态判定：${tier}（依据：${p.categories.map((c) => categoryOf(c).name).join("/")}）。Agent 必要性：${nec.judge} 总监 Verdict：${director.verdict}（${director.overall}/100）。`),
    f(2, "Product Strategy", `${p.name}＝「${p.tagline}」；战略：${businessOf(p)}；目标用户：${targetUsersOf(p)}。`),
    f(3, "User", targetUsersOf(p) + "；场景：" + sceneOf(p)),
    f(4, "Problem", problemOf(p)),
    f(5, "JTBD", `When ${jtbd.when} → I want ${jtbd.want} → So that ${jtbd.soThat}`),
    f(6, "Agent Necessity", nec.matrix.join("；") + "；判断：" + nec.judge),
    f(7, "Agent Positioning", `${tier} — Agent 的「核心任务」：${r.productToTech.feature}；Human Job → Agent Job → Tool Job → System Job：目标设定（Human）→ 规划/执行/校验（Agent）→ 工具调用（Tool）→ 状态/存储（System）。`),
    f(8, "Agent Responsibility", `Agent 负责：${r.productToTech.feature} 的 Planning/Reasoning/Tool Selection/Execution/Validation；Agent 不负责：最终决策/审批（Human）；Human 负责：Goal/Approval/Decision；Tool 负责：外部能力；System 负责：状态/权限/审计。`),
    f(9, "Agent UX", `Onboarding → Goal → Task Input → Agent Understanding → Planning → Execution → Progress → Human Intervention → Result → Feedback → Learning；信任来源：Progress 可视化 + 结果可解释 + 可撤销。`),
    f(10, "Agent Autonomy", `当前等级：${p.categories.includes("agent") ? "L3（AI Executes，人在回路）" : "L2（AI Copilot）"}；下一阶段：${p.categories.includes("agent") ? "可提升至 L4（AI Autonomous）+ 关键节点保留 Human Approval" : "先到 L3 验证价值，再决定是否提自主性"}。`),
    f(11, "Human-in-the-loop", `模式：${p.categories.includes("agent") ? "Semi Autonomous（Human Approval + Human Correction）" : "Human-in-the-loop（Validation 由人确认）"}；Human×Agent×System：Goal(Human) / Planning(Agent) / Tool Selection(Agent) / Execution(Agent) / Approval(Human) / Validation(Human+Agent) / Final Decision(Human)。`),
    f(12, "AI Architecture", r.aiArchitecture.map((a) => `${a.component}:${a.role}`).join("；")),
    f(13, "Agent Architecture", p.categories.includes("agent") ? `User → Orchestrator → Planner → Reasoner → Tool Selector → Tool → Observation → Memory → Planner → Final Output；为什么 Agent：${r.productToTech.productRequirement} 需多步编排。` : "当前非多 Agent；单步增强（[INFERENCE]）"),
    f(14, "Tool Architecture", r.featureToCode.map((x) => `${x.feature}:${x.chain.slice(0, 4).join("→")}`).join("；")),
    f(15, "MCP", p.categories.includes("mcp") ? "使用 MCP：标准化工具接入，生态互操作；不用 MCP 则需自建工具层" : "未使用 MCP（可选接入，[HYPOTHESIS]）"),
    f(16, "Memory", `短期/会话记忆：${latentNeedOf(p)}；Memory 是否提升价值：${p.categories.includes("pkm") || p.categories.includes("agent") ? "是（资产沉淀+个性化）" : "有限（工具型产品）"}[HYPOTHESIS]。`),
    f(17, "Reliability", `失败处理：Retry + Fallback + Human Review；可观测：${r.sourceArchitecture.tree.includes("tests/") ? "有测试目录（[CONFIRMED]）" : "待确认"}。`),
    f(18, "Security", "Permission/Auth + Tool Guardrail + Cost/Token Limit + Human Approval（[HYPOTHESIS]，以源码为准）"),
    f(19, "Cost", `单次任务成本：LLM Token + ${p.categories.includes("rag") ? "Embedding/检索 + " : ""}Tool/API；估算低量级（$0.01-0.1）；商业化可行性：${s.money >= 70 ? "可（毛利健康）" : "需用量分层"}。`),
    f(20, "Business", `${r.businessModelDetail.moneyPoint}；谁付钱：${targetUsersOf(p).split("、")[0]}（Power/企业）`),
    f(21, "Growth", growthOf(p)),
    f(22, "Moat", moatOf(p) + "；如果 Agent 消失企业损失：自动化产出与「" + latentNeedOf(p) + "」的资产沉淀。" ),
    f(23, "Agent 2.0", `若模型能力 10×：从「工具」进化为「自主助理」——默认目标→自主执行→审核，并把每次使用沉淀为资产/模板市场（${director.conclusions.buildNext}）。`),
    f(24, "Product Director Verdict", `${director.verdict} — ${director.verdictWhy} 押注：${director.conclusions.bet}`),
  ];
}

export function buildWorkflowReport(p: Project): { n: number; title: string; body: string }[] {
  const r = buildReverseEngineering(p);
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const isAgent = p.categories.includes("agent");
  return [
    f(1, "User Goal", deepNeedOf(p)),
    f(2, "Trigger", `用户出现「${sceneOf(p)}」相关需求时（触发点：任务/问题出现）`),
    f(3, "Input", "用户目标/需求文本（+可选文件/上下文）"),
    f(4, "Intent", "意图识别：解析目标与关键参数（AI：LLM）"),
    f(5, "Planning", isAgent ? "任务分解 + 规划（Agent Planner）" : "固定流程编排（Workflow）"),
    f(6, "Task Decomposition", r.productDnaFlow.slice(1, 6).join(" → ") || "输入→处理→输出"),
    f(7, "Context", "会话/任务上下文组装（+ 可选知识）"),
    f(8, "Retrieval", p.categories.includes("rag") || p.categories.includes("pkm") ? "知识库/向量检索（RAG）" : "按需取数"),
    f(9, "Tool Selection", isAgent ? "Agent 动态选工具" : "固定工具链"),
    f(10, "Tool Execution", "调用搜索/代码/浏览器/文件等外部能力"),
    f(11, "Observation", "读取工具结果/中间状态"),
    f(12, "Reasoning", "LLM 基于观察推理"),
    f(13, "Decision", "判断下一步/是否完成"),
    f(14, "Action", "执行动作/生成内容"),
    f(15, "Validation", "结果校验（结构化输出/规则/引用）"),
    f(16, "Human Review", "人在回路：审核/修改/批准"),
    f(17, "Output", r.productToTech.output),
    f(18, "Memory", `历史/资产沉淀（${latentNeedOf(p)}）`),
    f(19, "Failure Path", "LLM 失败/Tool 失败/网络失败/数据失败/权限失败 → Retry/Fallback/Human"),
    f(20, "Retry", "工具/模型失败自动重试（限次）"),
    f(21, "Fallback", "降级模型/换工具/结果降级提示"),
    f(22, "Cost", "单次成本 = Input Tokens + LLM Calls + " + (p.categories.includes("rag") ? "Embedding/Retrieval + " : "") + "Tool/API + Storage（估算低量级）"),
    f(23, "Latency", "LLM Latency + Tool Latency + Network + Retrieval + Processing；用户等待最久的一步：LLM 生成/多步执行（[INFERENCE]）"),
    f(24, "Bottleneck", "瓶颈：多步串行执行 + 模型生成时间；可并行化 Tool/检索"),
    f(25, "Optimization", "并行工具调用 / 缓存 / 流式输出 / 小模型预筛 / 缩短路径"),
    f(26, "Workflow 2.0", `推荐新 Workflow：${isAgent ? "目标→并行检索+工具→合并推理→验证→人在回路" : "把高频分支固定化，低频分支交给 Agent"}；可减少步骤与延迟，提升可靠性。`),
  ];
}

/** AI AGENT MASTER MAP（交互图） */
export function buildAgentMasterMap(p: Project): MapNode[] {
  const r = buildReverseEngineering(p);
  const isAgent = p.categories.includes("agent");
  const N = (node: string, detail: string, questions: string[]): Omit<MapNode, "answers"> => ({ node, detail, explain: [`${detail}（本产品：${r.productToTech.feature}）`, "为什么：见下方自问自答"], questions, evidence: "Inferred" });
  const nodes: Omit<MapNode, "answers">[] = [
    N("USER", targetUsersOf(p), ["谁最先用？", "谁最先付费？"]),
    N("GOAL", deepNeedOf(p), ["用户真正要什么？"]),
    N("INTENT", "意图识别", ["怎么识别意图？"]),
    N("TASK DECOMPOSITION", "任务拆解", ["拆成几步？"]),
    N("PLANNER", isAgent ? "动态规划" : "固定流程", ["为什么 Agent 而不是固定流程？"]),
    N("MEMORY / RAG / CONTEXT", `${isAgent ? "记忆+检索+上下文" : "上下文/检索"}`, ["数据从哪来？", "RAG 是核心吗？"]),
    N("AGENT", isAgent ? "规划/决策/执行" : "单步增强", ["为什么需要 Agent？", "没有 AI 会怎样？"]),
    N("TOOL A/B/C", "工具调用", ["哪些工具核心？", "工具失败怎么办？"]),
    N("OBSERVATION", "观察结果", ["如何读取结果？"]),
    N("REASONING", "推理", ["智能发生在哪一步？"]),
    N("DECISION", "决策", ["何时判定完成？"]),
    N("ACTION", "执行动作", ["执行什么？"]),
    N("VALIDATION", "校验", ["结果可靠吗？"]),
    N("SUCCESS → RESULT", "成功出结果", ["结果可审核吗？"]),
    N("FAILURE → RETRY", "失败重试", ["失败怎么恢复？"]),
    N("HUMAN ← FALLBACK", "人在回路/降级", ["何时交给人工？"]),
    N("OUTPUT", r.productToTech.output, ["输出是什么？"]),
    N("MEMORY", latentNeedOf(p), ["是否沉淀资产？"]),
    N("NEXT TASK", "进入下一任务", ["能否复用？"]),
  ];
  return nodes.map((n) => ({ ...n, answers: n.questions.map((q) => answerQuestion(p, n.node, q)) }));
}

/* ── 源码驱动版 ─────────────────────────────────────────────────── */
export function buildSourceAgentDirectorReport(repo: LiveRepo, intel: SourceIntel): { n: number; title: string; body: string }[] {
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const hasAgent = intel.aiComponents.some((a) => /Agent/.test(a));
  return [
    f(1, "Executive Summary", `形态判定：${hasAgent ? "检出 Agent 组件" : "AI 增强/Workflow（未检出 Agent）"}（[INFERENCE]）；依据：依赖清单与主题 ${intel.aiComponents.join(" / ") || "—"}。`),
    f(2, "Product Strategy", `「${intel.tagline}」；开源（${repo.license ?? "—"}）→ 托管/API（[INFERENCE]）。`),
    f(3, "User", "以 README 定位（[INFERENCE]）"),
    f(4, "Problem", repo.description ?? intel.tagline),
    f(5, "JTBD", `When 用户处于「${intel.tagline}」场景 → I want 一键获得结果 → So that 提升效率（[INFERENCE]）`),
    f(6, "Agent Necessity", `Agent 组件检出：${hasAgent ? "是" : "否"}；判断：${hasAgent ? "多步任务需编排（[INFERENCE]）" : "固定 Workflow 可满足（[HYPOTHESIS]）"}。`),
    f(7, "Agent Positioning", hasAgent ? "Agent 承担规划/工具/执行" : "AI 增强，非 Agent 形态"),
    f(8, "Agent Responsibility", "规划/执行/校验（Agent）· 目标/决策（Human）· 工具（Tool）· 状态（System）"),
    f(9, "Agent UX", "Onboarding → Goal → 执行 → 结果 → 审核（[HYPOTHESIS]）"),
    f(10, "Agent Autonomy", hasAgent ? "L3（AI Executes）" : "L2（AI Copilot）"),
    f(11, "Human-in-the-loop", "结果审核 + 错误恢复（[HYPOTHESIS]）"),
    f(12, "AI Architecture", intel.aiComponents.join(" / ") || "待确认"),
    f(13, "Agent Architecture", hasAgent ? "规划→工具→观察→推理→输出（[INFERENCE]）" : "非 Agent"),
    f(14, "Tool Architecture", intel.moduleMap.filter((m) => /工具/.test(m.role)).map((m) => m.module).join(" / ") || "待确认"),
    f(15, "MCP", intel.aiComponents.some((a) => /MCP/.test(a)) ? "使用 MCP" : "未检出"),
    f(16, "Memory", "待源码确认（[HYPOTHESIS]）"),
    f(17, "Reliability", "Retry/Fallback 待确认"),
    f(18, "Security", "权限/Guardrail 待确认"),
    f(19, "Cost", "待评估（LLM/基础设施）"),
    f(20, "Business", `开源 → 托管/API（${repo.license ?? "—"}）`),
    f(21, "Growth", `Stars ${formatStars(repo.stars)} · 更新 ${repo.updatedAt}`),
    f(22, "Moat", "数据/社区/工作流（[HYPOTHESIS]）"),
    f(23, "Agent 2.0", "垂直化 + 资产化（[HYPOTHESIS]）"),
    f(24, "Product Director Verdict", repo.stars > 20000 ? "Invest" : "Watch" + "（实时信号）"),
  ];
}

export function buildSourceWorkflowReport(repo: LiveRepo, intel: SourceIntel): { n: number; title: string; body: string }[] {
  const f = (n: number, title: string, body: string) => ({ n, title, body });
  const hasAgent = intel.aiComponents.some((a) => /Agent/.test(a));
  return [
    f(1, "User Goal", intel.tagline),
    f(2, "Trigger", "用户出现相关需求时"),
    f(3, "Input", "目标/需求文本"),
    f(4, "Intent", "意图识别（LLM）"),
    f(5, "Planning", hasAgent ? "Agent 规划" : "固定流程"),
    f(6, "Task Decomposition", "输入→处理→输出（[INFERENCE]）"),
    f(7, "Context", "上下文组装"),
    f(8, "Retrieval", intel.aiComponents.some((a) => /RAG|向量/.test(a)) ? "检索（RAG）" : "按需取数"),
    f(9, "Tool Selection", hasAgent ? "动态选工具" : "固定工具链"),
    f(10, "Tool Execution", "调用外部能力"),
    f(11, "Observation", "读取结果"),
    f(12, "Reasoning", "LLM 推理"),
    f(13, "Decision", "判定完成"),
    f(14, "Action", "执行动作"),
    f(15, "Validation", "结果校验"),
    f(16, "Human Review", "人在回路"),
    f(17, "Output", intel.features[0] ?? "结果"),
    f(18, "Memory", "待确认"),
    f(19, "Failure Path", "Tool/LLM 失败 → Retry/Fallback"),
    f(20, "Retry", "自动重试"),
    f(21, "Fallback", "降级提示"),
    f(22, "Cost", "待评估"),
    f(23, "Latency", "待评估"),
    f(24, "Bottleneck", "多步执行/模型生成"),
    f(25, "Optimization", "并行/缓存/流式"),
    f(26, "Workflow 2.0", hasAgent ? "目标→并行工具→推理→验证" : "高频分支固定化"),
  ];
}

export function buildSourceAgentMasterMap(repo: LiveRepo, intel: SourceIntel): MapNode[] {
  const N = (node: string, detail: string, questions: string[]): Omit<MapNode, "answers"> => ({ node, detail, explain: [detail + "（源码驱动，[INFERENCE]）"], questions, evidence: "Inferred" });
  const nodes: Omit<MapNode, "answers">[] = [
    N("USER", intel.tagline, ["谁最先用？"]),
    N("GOAL", intel.tagline, ["要什么？"]),
    N("INTENT", "意图识别", ["怎么识别？"]),
    N("PLANNER", intel.aiComponents.some((a) => /Agent/.test(a)) ? "Agent 规划" : "固定流程", ["Agent 还是固定？"]),
    N("MEMORY / RAG / CONTEXT", intel.aiComponents.join(" · ") || "待确认", ["数据从哪来？"]),
    N("AGENT", intel.aiComponents.some((a) => /Agent/.test(a)) ? "Agent 执行" : "AI 增强", ["为什么需要 AI？"]),
    N("TOOLS", intel.moduleMap.find((m) => /工具/.test(m.role))?.module ?? "tools/", ["哪些工具？"]),
    N("OBSERVATION / REASONING / DECISION", "观察→推理→决策", ["智能在哪一步？"]),
    N("ACTION", "执行动作", ["执行什么？"]),
    N("VALIDATION → RESULT / RETRY", "校验→结果/重试", ["失败怎么办？"]),
    N("HUMAN ← FALLBACK", "人在回路", ["何时人工？"]),
    N("OUTPUT", intel.features[0] ?? "结果", ["输出什么？"]),
    N("NEXT TASK", "复用", ["能否复用？"]),
  ];
  return nodes.map((n) => ({ ...n, answers: n.questions.map((q) => `以「${n.node}」为准（源码驱动）：${intel.tagline}[INFERENCE]`) }));
}
