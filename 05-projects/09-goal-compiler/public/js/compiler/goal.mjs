/**
 * goal.mjs — Goal 生成器（Goal Compiler 引擎 · 第二层）
 * 基于分析结果生成：①-⑧ 结构化摘要 + 补充建议 + 最终 20 段 Machine-Executable Goal Prompt。
 * 纯逻辑、零 DOM 依赖。
 */
import { _internal } from './analyzer.mjs';

const { DOMAIN_SUGGESTIONS } = _internal;

function joinCJK(arr, fallback = '待明确') {
  if (!arr || arr.length === 0) return fallback;
  return arr.slice(0, 4).join('、');
}

function pickKeywords(kw, n = 4) {
  return (kw || []).slice(0, n).map((k) => k.word).join('、') || '核心关键词';
}

function cap(s, n = 120) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

/** 目标树生成：最终目标 -> 核心结果/核心能力/工作模块/验收标准/风险与约束 */
export function buildGoalTree(analysis) {
  const { entities, domains, intent, keywords } = analysis;
  const subject = entities.object || '目标对象';
  const domain = domains.primary;
  const results = [
    `产出「${subject}」的可运行成果（P0 最小闭环）`,
    '形成清晰、可验收的执行文档与关键指标',
    '沉淀可复用方法/资产，便于后续迭代',
  ];
  const abilities = [
    `按${domain}最佳实践组织方案`,
    '主动补全缺失信息并标注假设',
    '结果优先、验证闭环的自主执行能力',
  ];
  const modules = [
    `需求建模：把模糊诉求转化为目标树与边界`,
    '架构与实现：按路线图交付核心功能',
    '验证与验收：以可复现证据证明完成',
  ];
  const standards = [
    '核心流程可真实运行（Level ≥ 3）',
    '关键路径完成实际验证并记录证据',
    '交付物满足验收标准，无未标注假设',
  ];
  const risks = [
    '信息不足导致方向偏差 → 用假设+默认方案兜底',
    '范围蔓延 → 严格 IN/OUT SCOPE 与优先级',
    '验证缺失 → 强制 Execute→Verify→Prove',
  ];
  return {
    goal: `把「${cap(analysis.raw, 40)}」编译并交付为一个可自主执行的${intent.label}任务`,
    results, abilities, modules, standards, risks,
  };
}

/** 关键假设：FACT / ASSUMPTION / DECISION 三态 */
export function buildAssumptions(analysis) {
  const { facts, entities, gaps, domains } = analysis;
  const factsList = (facts.length ? facts.slice(0, 3) : ['用户提供的原始诉求']).map((f) => `FACT: ${cap(f, 50)}`);
  const assumptions = [
    `ASSUMPTION: 目标用户/受益人群以「${entities.targetUser || '诉求发起者本人'}」为默认对象`,
    `ASSUMPTION: 领域定位按「${domains.primary}」最佳实践推进，若有偏差可在编辑阶段修正`,
    `ASSUMPTION: 默认以最小可行闭环（P0）为先，先跑通再优化`,
  ];
  const decisions = [
    `DECISION: 对${gaps.length} 处信息缺口采用「最合理默认方案」先行推进（详见风险节）`,
    'DECISION: 高风险未知仅在阻塞且错误成本极高时才询问',
  ];
  return { facts: factsList, assumptions, decisions };
}

/** 任务边界 */
export function buildScope(analysis) {
  const subject = analysis.entities.object || '目标成果';
  return {
    inScope: [
      `完成「${subject}」的核心能力与主流程（P0）`,
      '输出可验收的交付物与验证证据',
      '建立失败恢复与上下文管理机制',
    ],
    outOfScope: [
      '与核心目标无关的锦上添花功能',
      '未经 P0 验证前的规模化/商业化扩张',
      '用户未要求且不影响结果的完美主义打磨',
    ],
    optional: [
      '竞品调研与差异化分析',
      '可视化看板 / 汇报材料',
      '商业化与增长实验',
    ],
  };
}

/** 成功标准 */
export function buildSuccessCriteria(analysis) {
  const subject = analysis.entities.object || '目标成果';
  return [
    `「${subject}」核心流程真实运行通过，非概念演示`,
    '所有交付物满足 Definition of Done（功能/逻辑/数据/UI/技术/验证/异常/文档/验收）',
    '每个关键假设有标注，每个完成声明有可复现证据',
    '输出结果达到质量门槛 Level ≥ 3（稳定运行）',
  ];
}

/** 执行路线 */
export function buildRoadmap() {
  return [
    { phase: 'Discovery', goal: '澄清真实目标与价值', output: '需求理解 + 目标树' },
    { phase: 'Requirement Modeling', goal: '把需求转为规格', output: '边界/交付物/验收标准' },
    { phase: 'Architecture', goal: '确定技术方案', output: '架构与模块划分' },
    { phase: 'Implementation', goal: '实现 P0 闭环', output: '可运行核心功能' },
    { phase: 'Integration & Testing', goal: '联调与测试', output: '测试报告与修复' },
    { phase: 'Validation', goal: '对照验收标准验证', output: '验收证据' },
    { phase: 'Documentation & Acceptance', goal: '沉淀文档并交付', output: '最终交付包' },
  ];
}

/** 风险与应对 */
export function buildRisks(analysis) {
  const risks = [
    { risk: '信息缺口导致方向偏差', level: '高', mitigation: '建立 FACT/ASSUMPTION/DECISION 三态标注，低风险未知自行决策' },
    { risk: '范围蔓延、为追求完整而无限扩大', level: '高', mitigation: '严格 IN/OUT SCOPE + P0-P3 优先级，禁止越界' },
    { risk: '把「理论上可行」当作「已验证」', level: '中', mitigation: '强制 Execute → Verify → Prove，每个完成声明附证据' },
    { risk: '长任务执行中丢失上下文', level: '中', mitigation: '维护 Current State / Next Action / Key Decisions 上下文表' },
  ];
  if (analysis.gaps.length) {
    risks.push({ risk: `存在 ${analysis.gaps.length} 处信息缺口（${joinCJK(analysis.gaps, '待补充')}）`, level: '中', mitigation: '以最合理默认方案先行，输出中显式标注' });
  }
  return risks;
}

/** 你没考虑到的方向（补充建议） */
export function buildSuggestions(analysis) {
  const { domains, intent } = analysis;
  const perDomain = (DOMAIN_SUGGESTIONS[domains.primary] || []).slice(0, 5);
  const generic = [
    '定义可量化的北极星指标（一次只盯一个核心数字）',
    '设计「反馈 → 迭代」闭环：上线后如何收集真实反馈',
    '为关键路径写自动化验证，防止回归',
    '预设失败恢复与断点续跑机制，长任务不重来',
  ];
  const intentSpecific = {
    build: ['先做可演示的最小版本（Demo-first），再谈完善'],
    learn: ['设置阶段里程碑与自测关卡，量化进步'],
    research: ['给结论附来源与置信度，区分事实/推测'],
    automate: ['为自动化任务加异常告警与人工兜底'],
    create: ['建立素材库与产出节奏，保证可持续'],
    grow: ['先验证付费意愿（哪怕一个付费用户），再规模化'],
    solve: ['先复现问题（Reproduce），再谈修复'],
    personal: ['用打卡/记录让进度可见，减少意志力依赖'],
    other: ['给最终结果定一个「验收人」：谁来检查算完成'],
  };
  const seen = new Set();
  const out = [];
  for (const s of [...perDomain, ...generic, intentSpecific[intent.type]]) {
    if (s && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out.slice(0, 8);
}

/** 机器执行版 MACHINE-EXECUTABLE GOAL（WHO/WHY/WHAT…紧凑版） */
export function buildMachineGoal(analysis, tree, assumptions, scope, criteria, roadmap, risks) {
  const subject = analysis.entities.object || '目标成果';
  return [
    '## MACHINE-EXECUTABLE GOAL（紧凑版）',
    '',
    '**WHO**：你是「高级任务架构团队」——战略顾问 + 产品经理 + 工程负责人 + AI Agent 架构师 + QA 验收负责人。',
    `**WHY**：把用户的模糊想法编译为可自主执行、可人类验收的专家级任务，最终以结果而非文字证明完成。`,
    `**WHAT**：围绕「${subject}」完成从目标定义、架构、实现到验证的完整闭环，产出可运行成果与验收证据。`,
    `**OUTCOME**：${tree.goal}。`,
    `**SCOPE**：IN = ${joinCJK(scope.inScope)}；OUT = ${joinCJK(scope.outOfScope)}。`,
    `**INPUTS**：原始诉求（${analysis.charCount} 字）+ 已补全假设 ${assumptions.assumptions.length} 条 + 用户可编辑的后续修正。`,
    `**ASSUMPTIONS**：${assumptions.assumptions.map((a) => a.replace('ASSUMPTION: ', '')).join('；')}。`,
    `**PLAN**：${roadmap.map((r) => r.phase).join(' → ')}。`,
    '**PRIORITY**：P0 核心闭环 → P1 强烈建议 → P2 有余力 → P3 暂不考虑。',
    `**CONSTRAINTS**：时间/预算/合规等约束按输入中已识别项执行：${joinCJK(analysis.entities.constraints, '未显式给出，采用默认合理假设')}。`,
    '**TOOLS**：检索 → 分析 → 创建 → 修改 → 测试 → 验证，按需自主使用。',
    `**DELIVERABLES**：${subject} 可运行成果 + 目标任务书 + 验证证据 + 最终汇报。`,
    `**VALIDATION**：${criteria.join('；')}。`,
    '**QUALITY**：稳定运行（Level ≥ 3），可维护，可扩展。',
    '**FAILURE HANDLING**：定位根因 → 评估影响 → 选风险最低方案 → 修复 → 重验 → 记录；多路失败才报告阻塞。',
    `**DONE**：${criteria.slice(0, 2).join('；')}。`,
  ].join('\n');
}

/** 最终 20 段 Goal Prompt */
export function buildGoalPrompt(analysis, tree, assumptions, scope, criteria, roadmap, risks) {
  const subject = analysis.entities.object || '目标成果';
  const domain = analysis.domains.primary;
  const user = analysis.entities.targetUser || '诉求发起者';
  const constraintLine = analysis.entities.constraints.length
    ? analysis.entities.constraints.map((c) => `- ${c}`).join('\n')
    : '- 未显式给出，采用默认合理假设（时间、预算以「先跑通 P0 最小闭环」为准）';
  const gapsLine = analysis.gaps.length
    ? analysis.gaps.map((g) => `- ${g}`).join('\n')
    : '- 信息基本完整';
  const taskBreakdown = [
    `1. 需求建模：将原始诉求编译为目标树、边界与验收标准（本任务书即为产物之一）。`,
    `2. 架构设计：按「${domain}」最佳实践设计最小可行架构，明确模块与依赖。`,
    `3. 实现 P0：实现「${subject}」核心闭环，保证主要流程可真实运行。`,
    '4. 验证与修复：逐条对照验收标准执行验证，发现问题自行修复并重测。',
    '5. 沉淀交付：输出交付物清单、验证证据与最终汇报。',
  ].join('\n');

  return `# ROLE

你现在是一名「高级任务架构团队」：顶级战略咨询顾问、优秀产品经理、Principal/Staff Engineer、项目负责人、AI Agent 架构师、QA/验收负责人与企业家 Founder 的组合体。你的职责不是回答问题，而是把一份模糊诉求编译成可自主执行、可人类验收的专家级目标任务书并交付真实结果。

# MISSION

把用户诉求「${cap(analysis.raw, 60)}」编译并执行为一个完整闭环：从目标定义 → 架构 → 实现 → 验证 → 交付，最终以「可运行成果 + 验收证据」而不是文字汇报证明完成。

# CONTEXT

- 原始诉求（${analysis.charCount} 字 / ${analysis.sentenceCount} 句）：${cap(analysis.raw, 200)}
- 领域定位：${domain}；意图类型：${analysis.intent.label}
- 已识别目标用户/受益方：${user}
- 输入信息完整度：${gapsLine}

# OBJECTIVE

${tree.goal}。核心原则：结果优先（最终价值 → 成果 → 成功标准 → 路径），而不是过程优先。

# SUCCESS DEFINITION

任务成功必须同时满足：
${criteria.map((c) => `- ${c}`).join('\n')}

# SCOPE

必须完成：
${scope.inScope.map((s) => `- ${s}`).join('\n')}

不包括：
${scope.outOfScope.map((s) => `- ${s}`).join('\n')}

可选增强（P0 完成后才做）：
${scope.optional.map((s) => `- ${s}`).join('\n')}

# ASSUMPTIONS

${assumptions.facts.map((a) => `- ${a}`).join('\n')}
${assumptions.assumptions.map((a) => `- ${a}`).join('\n')}
${assumptions.decisions.map((a) => `- ${a}`).join('\n')}

# INPUTS

- 用户原始诉求：${cap(analysis.raw, 150)}
- 用户可随时编辑/修正的目标书（本平台支持人工编辑）
- 可联网检索的公开资料与工具

# REQUIRED OUTPUTS

- 「${subject}」可运行成果（核心流程真实可用，非概念 Demo）
- 目标树 / 任务边界 / 验收标准文档
- 关键路径的验证证据（命令输出、测试报告、截图等）
- 最终交付汇报（完成了什么/输出在哪/验证了什么/遗留问题/后续建议）

# EXECUTION STRATEGY

- 从最终价值倒推，先定义成功标准再动手。
- 主动补全信息：能自己判断的不要问；能建立合理假设的不要停；能先做后验证的不要等。
- 每完成一个阶段都验证实际结果，禁止 Plan → Execute → Assume success。
- 遵循执行循环：Observe → Understand → Plan → Execute → Verify → Detect → Fix → Re-test → Continue。

# TASK BREAKDOWN

${taskBreakdown}

# PRIORITY

- P0：核心闭环（不做完就无法交付）
- P1：强烈建议（显著提升质量/价值）
- P2：有余力再做（增强项）
- P3：暂不考虑（避免范围蔓延）

# DECISION RULES

- 区分 FACT（用户明确提供）/ ASSUMPTION（合理推测）/ DECISION（自主拍板），全部显式标注。
- 低风险未知信息：自行决策。高风险未知信息：采用「最合理默认方案」并标注。
- 仅当真正阻塞且错误成本极高时，才提出最少量的关键问题。

# AUTONOMOUS EXECUTION

你必须自主推进：自己判断 → 自己执行 → 自己验证 → 自己修复 → 自己继续。不要因为非关键问题停下来询问；除非遇到真实阻塞、权限不足、不可替代信息缺失或重大不可逆风险。

# TOOL USAGE

根据任务需要自主使用可用工具。优先顺序：检索 → 分析 → 创建 → 修改 → 测试 → 验证。

# QUALITY STANDARD

结果至少达到 Level 3（稳定运行），争取 Level 4（可维护）/ Level 5（可扩展）。用合理成本获得最高实际价值，不追求无意义的完美。

# VALIDATION

- 逐条对照 SUCCESS DEFINITION 执行验证，输出可复现证据。
- 每个任务格式化为：Action → Expected Result → Verification Method → Pass/Fail。
- 关键异常情况必须真实处理并记录。

# ERROR RECOVERY

发现问题：定位根因 → 判断影响范围 → 提出 ≥1 种修复方案 → 选择风险最低方案 → 执行 → 重新验证 → 记录 → 继续。失败后按 Retry → Alternative → Simplified → Fallback 顺序尝试；多路合理路径都失败后才报告阻塞。

# STOP CONDITIONS

只有在以下条件全部满足后才能停止：
- [ ] 所有 P0 交付物已产出且验证通过
- [ ] 无未标注的关键假设
- [ ] 验证证据齐全，可复现
- [ ] 最终汇报已输出

# FINAL REPORT

任务完成后汇报：
1. 完成了什么
2. 输出在哪里
3. 哪些内容经过验证（附证据）
4. 哪些问题仍存在
5. 后续建议

# EXECUTION PRINCIPLES（最重要的执行原则）

> 不要把「制定计划」误认为「完成任务」。
> 不要把「代码生成」误认为「功能完成」。
> 不要把「理论上应该可以」误认为「已经验证」。
> 不要为了等待确认而停止执行低风险任务。
> 尽可能在当前会话中完成整个任务闭环。
> 每完成一个阶段都验证实际结果；发现问题优先自行修复。
> 除非真正阻塞，否则持续推进直到达到 Definition of Done。
`;
}

/** 组装完整输出 */
export function buildOutput(analysis) {
  const tree = buildGoalTree(analysis);
  const assumptions = buildAssumptions(analysis);
  const scope = buildScope(analysis);
  const criteria = buildSuccessCriteria(analysis);
  const roadmap = buildRoadmap();
  const risks = buildRisks(analysis);
  const suggestions = buildSuggestions(analysis);
  const goalPrompt = buildGoalPrompt(analysis, tree, assumptions, scope, criteria, roadmap, risks);
  const machineGoal = buildMachineGoal(analysis, tree, assumptions, scope, criteria, roadmap, risks);

  const summary = {
    understanding: `你真正想完成的是：${cap(analysis.raw, 60)} —— 把它落地为一个可运行、可验收的成果。`,
    deepGoal: `表层是「${analysis.entities.object || '做一件事'}」；深层是获得一个可交付、可验证、可持续迭代的确定结果，并减少反复沟通与返工。`,
    assumptions: [...assumptions.facts, ...assumptions.assumptions, ...assumptions.decisions],
    goalTree: tree,
    scope,
    successCriteria: criteria,
    roadmap,
    risks,
  };

  return {
    summary,
    suggestions,
    goalPrompt,
    machineGoal,
    keywordTop: analysis.keywords.slice(0, 6).map((k) => k.word),
  };
}
