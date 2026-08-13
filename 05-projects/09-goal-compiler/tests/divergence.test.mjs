/**
 * divergence.test.mjs — 需求发散式分析引擎测试
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDivergence } from '../public/js/divergence.mjs';
import { compile } from '../public/js/compiler/index.mjs';

test('发散分析：功能/场景/变体/边界四类齐全且包含对象', () => {
  const r = compile('我想做一个帮程序员准备面试的 AI 面试官工具，可以模拟面试并打分反馈');
  const d = r.divergence;
  assert.ok(d.features.length >= 3, '应有推荐功能');
  assert.ok(d.scenarios.length >= 3, '应有扩展场景');
  assert.ok(d.variants.length >= 2, '应有用户变体');
  assert.ok(d.pitfalls.length >= 3, '应有边界提醒');
  assert.ok(d.summary.includes(d.subject), '摘要应包含目标对象');
  assert.ok(d.subject.length >= 2, '应有目标对象');
});

test('发散分析随需求场景变化（不同领域不同建议）', () => {
  const r1 = compile('做一个自动整理报销发票的小程序，拍照识别金额');   // 效率/自动化
  const r2 = compile('用 AI 帮我系统提升英语口语');                    // 学习/成长
  assert.notEqual(r1.divergence.scenarios[0], r2.divergence.scenarios[0], '不同领域场景建议应不同');
  assert.notEqual(r1.divergence.features[0], r2.divergence.features[0], '不同领域功能建议应不同');
});

test('发散分析：含特例分析 + 场景细节描述', () => {
  const r = compile('做一个自动整理报销发票的小程序，拍照识别金额');
  const d = r.divergence;
  assert.ok(d.edgeCases.length >= 3, '应有特例分析');
  assert.ok(d.edgeCases[0].tag === '特例分析', '特例应带标签');
  assert.ok(typeof d.scenarioDetail === 'function', '应有场景细节函数');
  const detail = d.scenarioDetail(d.scenarios[0].title);
  assert.ok(detail.includes('应用场景') && detail.includes('落地细节'), '场景细节应含应用场景与落地细节');
});
