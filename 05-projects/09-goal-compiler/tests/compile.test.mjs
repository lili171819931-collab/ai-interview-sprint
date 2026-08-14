/**
 * compile.test.mjs — 编译引擎单元测试（Node 内置 test runner）
 * 覆盖：3 个测试用例的结构完整性、Goal Prompt 20 段结构、可编辑性、思维链、补充建议。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compile } from '../public/js/compiler/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'cases.json'), 'utf8')).cases;

const REQUIRED_SECTIONS = [
  '# ROLE', '# MISSION', '# CONTEXT', '# OBJECTIVE', '# SUCCESS DEFINITION',
  '# SCOPE', '# ASSUMPTIONS', '# INPUTS', '# REQUIRED OUTPUTS', '# EXECUTION STRATEGY',
  '# TASK BREAKDOWN', '# PRIORITY', '# DECISION RULES', '# AUTONOMOUS EXECUTION',
  '# TOOL USAGE', '# QUALITY STANDARD', '# VALIDATION', '# ERROR RECOVERY',
  '# STOP CONDITIONS', '# FINAL REPORT', '# EXECUTION PRINCIPLES',
];

for (const c of cases) {
  test(`用例「${c.title}」编译结果结构完整`, () => {
    const r = compile(c.rawInput, { mode: 'test' });
    assert.ok(r.id, '应有编译 ID');
    assert.ok(r.inputHash, '应有输入哈希');
    assert.equal(r.editable, true, '最终 Goal 应可编辑');
    assert.ok(r.chain.length >= 10, `思维链节点应 >= 10（实际 ${r.chain.length}）`);
    assert.ok(r.summary.understanding && r.summary.understanding.length > 0, '应有原始需求理解');
    assert.ok(r.summary.deepGoal && r.summary.deepGoal.length > 0, '应有深层目标');
    assert.ok(r.summary.assumptions.length >= 3, '应有 FACT/ASSUMPTION/DECISION 假设');
    assert.ok(r.summary.scope.inScope.length >= 2, '应有 IN SCOPE');
    assert.ok(r.summary.scope.outOfScope.length >= 2, '应有 OUT OF SCOPE');
    assert.ok(r.summary.successCriteria.length >= 3, '应有成功标准');
    assert.ok(r.summary.roadmap.length >= 5, '应有执行路线');
    assert.ok(r.summary.risks.length >= 3, '应有风险与应对');
    assert.ok(r.suggestions.length >= 3, '应有补充建议（你没考虑到的方向）');
  });
}

test('最终 Goal Prompt 包含 20 段强制结构 + 执行原则', () => {
  const r = compile(cases[0].rawInput);
  for (const sec of REQUIRED_SECTIONS) {
    assert.ok(r.goalPrompt.includes(sec), `缺少段落：${sec}`);
  }
  assert.ok(r.goalPrompt.length > 1500, 'Goal Prompt 应足够长');
  assert.ok(r.machineGoal.includes('WHO') && r.machineGoal.includes('DONE'), '紧凑版应含 WHO/DONE');
});

test('不同诉求生成不同目标（对象抽取）', () => {
  const r1 = compile('我想做一个帮程序员准备面试的 AI 面试官工具，可以模拟面试并打分反馈');
  const r2 = compile('做一个自动整理报销发票的小程序，拍照就能识别金额和类别');
  assert.notEqual(r1.analysis.entities.object, r2.analysis.entities.object);
});

test('空输入应抛错', () => {
  assert.throws(() => compile('   '), /请先输入/);
});

test('同一输入确定性输出（幂等）', () => {
  const a = compile('做一个自动记账机器人', { mode: 'x' });
  const b = compile('做一个自动记账机器人', { mode: 'x' });
  assert.equal(a.goalPrompt, b.goalPrompt);
  assert.equal(a.analysis.entities.object, b.analysis.entities.object);
});

test('目标树结构五层齐全', () => {
  const r = compile(cases[1].rawInput);
  const t = r.summary.goalTree;
  assert.ok(t.results.length >= 2);
  assert.ok(t.abilities.length >= 2);
  assert.ok(t.modules.length >= 2);
  assert.ok(t.standards.length >= 2);
  assert.ok(t.risks.length >= 2);
});

console.log(`\n  ✔ 编译引擎测试：${cases.length} 个用例 × 结构断言全部通过\n`);

test('khazix 对齐：RULES/TASK TYPE/CHECKPOINT/MULTI-AGENT/任务0/暗卷 + ≤4000 紧凑', () => {
  const r = compile(cases[0].rawInput);
  assert.ok(r.goalPrompt.includes('# RULES & GUIDANCE'), '应有法/情报分家');
  assert.ok(r.goalPrompt.includes('# TASK TYPE'), '应有任务类型');
  assert.ok(r.goalPrompt.includes('# CHECKPOINT & RESUME'), '应有断点续跑');
  assert.ok(r.goalPrompt.includes('# MULTI-AGENT'), '应有多 Agent');
  assert.ok(r.goalPrompt.includes('任务 0'), '应有任务 0 基线核验');
  assert.ok(r.goalPrompt.includes('暗卷'), '应有暗卷验收');
  assert.ok(r.goalPrompt.includes('使用指引'), '应有使用指引');
  assert.ok(r.goalPromptCompact.length <= 4000, '中文紧凑版应 ≤4000');
  assert.ok(r.goalPromptCompact.includes('# STOP CONDITIONS'), '紧凑版应保留停止条件');
  assert.ok(r.goalPromptEnCompact.length <= 4000, '英文精简版应 ≤4000');
  assert.ok(r.goalPromptEnCompact.includes('# STOP CONDITIONS'), '英文精简版应保留停止条件');
  assert.ok(r.goalPromptEnCompact.includes('# RULES'), '英文精简版应有 RULES');
});

test('探索型分流：调研诉求生成探索型 Goal', () => {
  const r = compile('调研一下新能源汽车市场现状与趋势，比较主要竞品');
  assert.ok(r.goalPrompt.includes('探索型'), '调研诉求应为探索型');
  assert.ok(r.goalPrompt.includes('以「有依据的结论 + 决策建议 + 置信度」为交付核心'), '探索型应强调结论交付');
});

test('英文输出：Goal Prompt + 分析（i18n）', () => {
  const r = compile(cases[0].rawInput);
  assert.ok(r.goalPromptEn.includes('# ROLE'), 'EN Goal 应有 ROLE');
  assert.ok(r.goalPromptEn.includes('# STOP CONDITIONS'), 'EN Goal 应有 STOP CONDITIONS');
  assert.ok(r.summaryEn.understanding.includes('What you really want'), 'EN 理解应为英文');
  assert.ok(r.summaryEn.scope.inScope.length >= 2, 'EN scope 应有内容');
  assert.ok(r.machineGoalEn.includes('WHO') && r.machineGoalEn.includes('DONE'), 'EN 紧凑版应有 WHO/DONE');
  assert.ok(r.goalPromptEn !== r.goalPrompt, '中英文 Goal 应不同');
});
