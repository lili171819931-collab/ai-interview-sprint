/**
 * caselib.test.mjs — 案例库自动收录 + 相似搜索单元测试
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCaseMeta, saveCase, removeCase, searchCases, categoriesOf, compileCase } from '../public/js/caselib.mjs';
import { compile } from '../public/js/compiler/index.mjs';

test('toCaseMeta 提取领域/意图/标题', () => {
  const r = compile('我想做一个帮程序员准备面试的 AI 面试官工具，可以模拟面试并打分反馈');
  const meta = toCaseMeta(r);
  assert.ok(meta.title && meta.title.length >= 2, '应有标题（对象）');
  assert.ok(meta.domain, '应有领域');
  assert.ok(meta.intent, '应有意图');
  assert.ok(meta.inputHash, '应有输入哈希');
  assert.equal(meta.source, 'user');
});

test('saveCase 按 inputHash 去重并置顶', () => {
  const r1 = compile('做一个自动记账机器人');
  const r2 = compile('做一个自动记账机器人'); // 同输入
  const r3 = compile('做一个英语口语陪练 App');
  let list = [];
  list = saveCase(list, toCaseMeta(r1));
  list = saveCase(list, toCaseMeta(r2)); // 应去重
  assert.equal(list.length, 1, '同输入应去重');
  list = saveCase(list, toCaseMeta(r3));
  assert.equal(list.length, 2);
  assert.equal(list[0].title, r3.analysis.entities.object, '新案例应置顶');
});

test('searchCases 按关键词命中相似需求', () => {
  const a = compile('做一个自动整理报销发票的小程序');
  const b = compile('用 AI 提升英语口语');
  let list = saveCase(saveCase([], toCaseMeta(a)), toCaseMeta(b));
  const hit = searchCases(list, '发票');
  assert.ok(hit.length >= 1 && hit[0].inputHash === a.inputHash, '搜索发票应命中报销案例');
  const hit2 = searchCases(list, '英语');
  assert.ok(hit2.length >= 1 && hit2[0].inputHash === b.inputHash, '搜索英语应命中口语案例');
  assert.equal(searchCases(list, '不存在的词xyz').length, 0);
});

test('removeCase / categoriesOf / compileCase', () => {
  const r = compile('做一个自动记账机器人');
  let list = saveCase([], toCaseMeta(r));
  assert.equal(categoriesOf(list).length, 1, '应有分类');
  const recompiled = compileCase(list[0]);
  assert.equal(recompiled.inputHash, list[0].inputHash, '确定性重编译应一致');
  list = removeCase(list, list[0].id);
  assert.equal(list.length, 0);
});
