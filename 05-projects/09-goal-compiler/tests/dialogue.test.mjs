/**
 * dialogue.test.mjs — AI 多轮澄清式输入引擎测试
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextQuestion, addTurn, transcriptToInput, dialogueSummary } from '../public/js/dialogue.mjs';

test('逐轮提问：先问用户，再问时间盒', () => {
  let tr = [];
  let q = nextQuestion(tr);
  assert.ok(q && q.qid === 'user', '第一步应问目标用户');
  tr = addTurn(tr, q.qid, q.question, '程序员和求职者');
  q = nextQuestion(tr);
  assert.ok(q && q.qid === 'timebox', '第二步应问时间盒');
});

test('信息足够时不再提问', () => {
  const tr = [
    { qid: 'user', question: '谁', answer: '程序员' },
    { qid: 'timebox', question: '时间', answer: '2周内完成P0' },
    { qid: 'budget', question: '预算', answer: '免费开源' },
    { qid: 'acceptance', question: '验收', answer: '核心流程跑通+测试通过' },
    { qid: 'platform', question: '形态', answer: '网页' },
    { qid: 'scope', question: '补充', answer: '帮程序员准备AI面试' },
  ];
  assert.equal(nextQuestion(tr), null, '信息完整应无后续问题');
});

test('transcriptToInput 聚合 Q&A 为可编译输入', () => {
  const tr = [{ qid: 'user', question: '目标用户？', answer: '程序员' }];
  const input = transcriptToInput(tr, '做一个 AI 面试官工具');
  assert.ok(input.includes('做一个 AI 面试官工具'));
  assert.ok(input.includes('Q：目标用户？'));
  assert.ok(input.includes('A：程序员'));
  assert.equal(dialogueSummary(tr).length, 1);
});
