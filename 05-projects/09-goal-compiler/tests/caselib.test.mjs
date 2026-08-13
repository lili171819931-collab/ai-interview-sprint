/**
 * caselib.test.mjs — 案例库自动收录 + 相似搜索单元测试
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCaseMeta, saveCase, saveCaseByType, removeCase, searchCases, categoriesOf, compileCase } from '../public/js/caselib.mjs';
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

test('saveCase 完整记录：同类型不同输入不覆盖（每次新增保留）', () => {
  const a = compile('做一个自动记账机器人，自动同步银行卡账单');
  const b = compile('做一个自动记账机器人，支持语音记账'); // 同 领域·意图，不同输入
  let list = saveCase([], toCaseMeta(a));
  list = saveCase(list, toCaseMeta(b));
  assert.equal(list.length, 2, '完整记录应保留两条（不覆盖）');
  assert.equal(categoriesOf(list).length, 1, '但两者属于同一类目');
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

test('saveCaseByType：只收集不同类型（按 领域·意图 去重）', () => {
  const a = compile('做一个自动整理报销发票的小程序，拍照识别金额');   // 效率/自动化 · 构建
  const b = compile('做一个自动记账的机器人，自动同步银行卡账单');     // 效率/自动化 · 构建（同类型）
  const c = compile('用 AI 帮我系统提升英语口语');                     // 学习/成长 · 学习
  let list = [];
  list = saveCaseByType(list, toCaseMeta(a));
  list = saveCaseByType(list, toCaseMeta(b)); // 同 领域·意图 → 替换
  assert.equal(list.length, 1, '同类型应只保留 1 条');
  list = saveCaseByType(list, toCaseMeta(c));
  assert.equal(list.length, 2, '不同类型应新增');
  assert.equal(list[0].title, c.analysis.entities.object, '新类型置顶');
  const metaA = toCaseMeta(a), metaB = toCaseMeta(b);
  assert.equal(metaA.domain + '·' + metaA.intent, metaB.domain + '·' + metaB.intent, '两者类型一致');
});
