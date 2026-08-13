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
