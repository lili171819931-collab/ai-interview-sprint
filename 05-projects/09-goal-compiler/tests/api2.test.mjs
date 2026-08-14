/**
 * api2.test.mjs — 新增数据源 API 测试（npm/stackoverflow/huggingface 真实网络 + 精选库离线）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { competitiveSearch } from '../server/crawler.mjs';

test('新数据源：npm / StackOverflow / HuggingFace（真实网络，容忍失败）', { timeout: 30000 }, async () => {
  const r = await competitiveSearch({ q: 'prompt engineering', sources: ['npm', 'stackoverflow', 'huggingface'] });
  assert.ok(Array.isArray(r.items), '应返回数组');
  // 至少一个源有结果（任一成功即满足），失败进 errors
  assert.ok(r.items.length + r.errors.length >= 1, '应有结果或明确错误');
  for (const it of r.items) {
    assert.ok(it.name && it.url && it.source, '每条应有 name/url/source');
    assert.ok(['npm', 'Stack Overflow', 'Hugging Face'].includes(it.source), '来源标记正确');
  }
});

test('数据源错误优雅降级（不抛异常）', async () => {
  const r = await competitiveSearch({ q: 'goal compiler', sources: ['curated', 'gitee'] });
  assert.ok(Array.isArray(r.items), 'curated 仍应返回');
  assert.ok(r.items.length >= 5, '精选库离线可用');
});

test('npm 修复：超长需求查询不再 400（自动截断 ≤64）', { timeout: 30000 }, async () => {
  const longQ = 'AI 面试官工具 我想做一个帮程序员准备面试的 AI 面试官工具，可以模拟面试并打分反馈，按岗位定制问题，目标用户是程序员和求职者，两周内做出 P0';
  const r = await competitiveSearch({ q: longQ, sources: ['npm'] });
  assert.ok(!r.errors.some((e) => /npm/.test(e)), `npm 不应报错（实际 ${r.errors.join('；')}）`);
  assert.ok(Array.isArray(r.items), 'npm 应返回数组');
  // sanitizeQuery 单元校验
  const { sanitizeQuery } = await import('../server/crawler.mjs');
  assert.ok(sanitizeQuery(longQ, 60).length <= 60, '清洗后应 ≤60');
  assert.ok(sanitizeQuery('  a   b  ', 60) === 'a b', '应折叠空白');
});
