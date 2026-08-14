/**
 * index.mjs — Goal Compiler 主入口
 * compile(rawInput, options) → 完整编译结果（分析 + 思维链 + 摘要 + Goal Prompt）
 */
import { analyze } from './analyzer.mjs';
import { buildOutput, compactGoalPrompt } from './goal.mjs';
import { buildOutputEn, buildGoalPromptEnCompact } from './goal-en.mjs';
import { buildChain } from './chain.mjs';
import { buildDivergence } from '../divergence.mjs';

let seq = 0;
function shortHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h).toString(36).slice(0, 8);
}

export function compile(rawInput, options = {}) {
  const raw = String(rawInput || '').trim();
  if (!raw) {
    throw new Error('请先输入一段原始诉求');
  }
  const { analysis, chain } = buildChain(raw);
  const output = buildOutput(analysis);
  const en = buildOutputEn(analysis);
  const id = `GC-${Date.now().toString(36)}-${(++seq).toString(36)}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    inputHash: shortHash(raw),
    mode: options.mode || 'standard',
    analysis,
    chain,
    divergence: buildDivergence(analysis),
    summary: output.summary,
    summaryEn: en.summary,
    suggestions: output.suggestions,
    goalPrompt: output.goalPrompt,
    goalPromptCompact: compactGoalPrompt(output.goalPrompt),
    goalPromptEn: en.goalPrompt,
    goalPromptEnCompact: buildGoalPromptEnCompact(analysis),
    machineGoal: output.machineGoal,
    machineGoalEn: en.machineGoal,
    keywordTop: output.keywordTop,
    editable: true,
    qualityLevel: 3,
  };
}

export function compileForTest(rawInput) {
  const r = compile(rawInput, { mode: 'test' });
  return {
    id: r.id,
    summary: r.summary,
    suggestions: r.suggestions,
    goalPrompt: r.goalPrompt,
    machineGoal: r.machineGoal,
    chainLength: r.chain.length,
    analysis: {
      intent: r.analysis.intent,
      domains: r.analysis.domains,
      entities: r.analysis.entities,
      gaps: r.analysis.gaps,
    },
  };
}

export default { compile, compileForTest };
