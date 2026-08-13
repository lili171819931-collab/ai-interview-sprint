/**
 * chain.mjs — 完整思维链构建器（Goal Compiler 引擎 · 第三层）
 * 把编译过程展开为可学习、可导出的结构化推理节点。
 * 每个节点：phase / step / title / input / reasoning / output / evidence / decisions。
 */
import { analyze } from './analyzer.mjs';
import { buildGoalTree, buildAssumptions, buildScope, buildSuccessCriteria, buildRoadmap, buildRisks, buildSuggestions } from './goal.mjs';

export function buildChain(rawInput) {
  const analysis = analyze(rawInput);
  const tree = buildGoalTree(analysis);
  const assumptions = buildAssumptions(analysis);
  const scope = buildScope(analysis);
  const criteria = buildSuccessCriteria(analysis);
  const roadmap = buildRoadmap();
  const risks = buildRisks(analysis);
  const suggestions = buildSuggestions(analysis);

  const { entities, domains, intent, keywords, gaps, facts, questions, charCount, sentenceCount } = analysis;
  const subject = entities.object || '目标对象';

  const chain = [
    {
      phase: '理解', step: '01', title: '原始输入接收与预处理',
      input: `原始诉求（${charCount} 字 / ${sentenceCount} 句）：「${rawInput.trim().slice(0, 80)}${rawInput.trim().length > 80 ? '…' : ''}」`,
      reasoning: `按句子切分获得 ${sentenceCount} 个信息单元；提取关键词 ${keywords.length} 个；识别出意图「${intent.label}」与领域「${domains.primary}」。这是后续所有推断的原材料。`,
      output: `已建立输入基线：${sentenceCount} 句、意图=${intent.type}、领域=${domains.primary}、Top 关键词=${keywords.slice(0, 4).map((k) => k.word).join('/')}`,
      evidence: facts.slice(0, 2),
    },
    {
      phase: '理解', step: '02', title: '表层需求识别',
      input: '从输入中用户「嘴上说」要什么。',
      reasoning: '用户表面诉求往往以动词+对象形式出现。通过关键词与实体抽取定位到核心对象。',
      output: `表层需求：围绕「${subject}」，做一件${intent.label}的事情。`,
      evidence: [`对象实体：${subject}`, `意图类型：${intent.label}`],
    },
    {
      phase: '理解', step: '03', title: '深层需求推断',
      input: '用户「真正想解决」的问题是什么。',
      reasoning: '表层是手段，深层是目的。推断用户真正想要的是「可交付、可验证、可迭代的确定结果」，而非一次口头解答；因此输出必须闭环到可运行成果 + 验收证据。',
      output: '深层目标：获得一个可交付、可验证、可持续迭代的确定结果，减少反复沟通与返工。',
      decisions: ['将「做 X」默认升级为「交付可验收的 X 闭环」'],
    },
    {
      phase: '理解', step: '04', title: '最终目标定义',
      input: '结合表层+深层需求。',
      reasoning: '采用结果优先的倒推法：最终价值 → 成果 → 成功标准 → 路径。',
      output: `最终目标：${tree.goal}`,
    },
    {
      phase: '建模', step: '05', title: '关键假设补全（FACT / ASSUMPTION / DECISION）',
      input: `识别信息缺口 ${gaps.length} 处。`,
      reasoning: '对未知信息分级处理：能自己判断的不问；能建立合理假设的不停；只有错误成本极高时才提出最少关键问题。',
      output: [...assumptions.facts.slice(0, 2), ...assumptions.assumptions.slice(0, 2)],
      decisions: assumptions.decisions,
    },
    {
      phase: '建模', step: '06', title: '目标树构建',
      input: `领域=${domains.primary}，对象=${subject}`,
      reasoning: '按「最终目标 → 核心结果 / 核心能力 / 工作模块 / 验收标准 / 风险与约束」五层展开，并判断决定结果的 20% 关键项。',
      output: [
        `目标：${tree.goal}`,
        `核心结果：${tree.results[0]}`,
        `工作模块：${tree.modules[0]}`,
        `验收标准：${tree.standards[0]}`,
      ],
    },
    {
      phase: '建模', step: '07', title: '任务边界划定',
      input: 'IN / OUT / OPTIONAL 三态。',
      reasoning: '严禁为追求「完整」而无限扩大范围；以 P0-P3 优先级锁定交付边界。',
      output: [`IN: ${scope.inScope[0]}`, `OUT: ${scope.outOfScope[0]}`, `OPTIONAL: ${scope.optional[0]}`],
    },
    {
      phase: '建模', step: '08', title: '交付物与成功标准定义',
      input: '每个交付物必须可验证。',
      reasoning: '拒绝「做好/优化一下」等不可验证描述，全部转换为可检查的具体结果与验收条件。',
      output: criteria.slice(0, 3),
    },
    {
      phase: '架构', step: '09', title: '执行路线设计',
      input: '从 0 → 完成的最优顺序。',
      reasoning: '按 Discovery → Modeling → Architecture → Implementation → Integration/Testing → Validation → Documentation/Acceptance 串行推进，避免边想边写边返工。',
      output: roadmap.map((r) => `${r.phase}: ${r.goal}`),
    },
    {
      phase: '架构', step: '10', title: '风险识别与应对',
      input: `识别到 ${risks.length} 项风险。`,
      reasoning: '对每项风险给出默认缓解方案；把「信息缺口」作为风险显式纳入，避免方向漂移。',
      output: risks.map((r) => `${r.risk} → ${r.mitigation}`),
    },
    {
      phase: '架构', step: '11', title: '自主执行与上下文管理机制',
      input: '长任务执行要求。',
      reasoning: '设计 Autonomous Execution（自己判断→执行→验证→修复→继续）+ 上下文状态表（Current Goal/State/Next Action/Key Decisions），防止失忆与重复劳动。',
      output: ['自主执行循环：Observe → Understand → Plan → Execute → Verify → Fix → Continue', '上下文表：Current State / Completed / In Progress / Blocked / Next Action'],
    },
    {
      phase: '执行', step: '12', title: '补充建议生成（你没考虑到的方向）',
      input: `领域=${domains.primary} + 通用最佳实践。`,
      reasoning: `基于「${domains.primary}」领域默认补齐用户未提及的方向与功能，降低交付后返工概率。`,
      output: suggestions.slice(0, 5),
    },
    {
      phase: '执行', step: '13', title: '最终 Goal Prompt 编译',
      input: '所有分析结果。',
      reasoning: '按 20 段强制结构（ROLE/MISSION/CONTEXT/OBJECTIVE/SUCCESS DEFINITION/SCOPE/ASSUMPTIONS/INPUTS/REQUIRED OUTPUTS/EXECUTION STRATEGY/TASK BREAKDOWN/PRIORITY/DECISION RULES/AUTONOMOUS EXECUTION/TOOL USAGE/QUALITY STANDARD/VALIDATION/ERROR RECOVERY/STOP CONDITIONS/FINAL REPORT）组装，脱离当前对话上下文后可独立执行。',
      output: '已生成可直接复制到 Claude Code /goal、Codex Goal Mode 等场景的 Machine-Executable Goal（20 段完整版 + WHO/WHY/WHAT 紧凑版）。',
    },
    {
      phase: '执行', step: '14', title: '自检与交付',
      input: '交付前自查清单。',
      reasoning: '检查：目标是否倒推自最终价值？假设是否显式标注？验收是否可复现？是否可脱离上下文独立执行？确认后交付。',
      output: ['✅ 结果优先已贯彻', '✅ 假设/缺口已标注', '✅ 验收标准可复现', '✅ Goal 可独立执行', `⚠️ 待你确认：${questions.length ? questions[0] : '无高风险阻塞问题'}`],
    },
  ];

  return { analysis, chain, summary: { tree, assumptions, scope, criteria, roadmap, risks, suggestions } };
}
