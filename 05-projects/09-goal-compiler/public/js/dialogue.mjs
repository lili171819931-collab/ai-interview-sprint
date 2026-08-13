/**
 * dialogue.mjs — AI 多轮澄清式输入（规则引擎，零依赖）
 * 基于分析缺口，逐轮向用户提问澄清；答案累积为结构化上下文，最终编译。
 * 纯函数，可测试。
 */
import { analyze } from './compiler/analyzer.mjs';

const QUESTIONS = [
  { id: 'user', detect: (a) => !a.entities.targetUser || a.entities.targetUser === '本人/自己', ask: (a) => '这个需求主要面向谁？目标用户/受益人群是？（例如：程序员 / 产品经理 / 我自己）' },
  { id: 'timebox', detect: (a) => !/时间|周|月|天|deadline|DDL/i.test(a.raw), ask: () => '期望在什么时间范围内完成？有 Deadline 或时间盒吗？（例如：2 周内做出 P0）' },
  { id: 'budget', detect: (a) => !/(预算|成本|付费|收费|盈利|免费|开源|钱)/.test(a.raw), ask: () => '预算或成本预期如何？是个人使用还是商业化？（例如：免费开源 / 计划订阅收费）' },
  { id: 'acceptance', detect: (a) => !/(验收|成功|完成标准|衡量|指标|怎么样算|如何判断|目标\s*是)/.test(a.raw), ask: () => '你判断「完成」的核心标准是什么？可量化的目标或验收指标？（例如：核心流程可跑通 + 100 个测试通过）' },
  { id: 'platform', detect: (a) => !/(平台|网页|小程序|App|桌面|命令行|微信|浏览器)/.test(a.raw) && a.intent.type === 'build', ask: () => '最终形态是哪种？（例如：网页 / 小程序 / App / 桌面 / 命令行工具）' },
  { id: 'scope', detect: (a) => a.sentenceCount < 2, ask: () => '能再补充一两句背景吗？比如它要解决的具体问题或场景？' },
];

/** 根据最新分析结果，返回下一个需要澄清的问题（无则 null） */
export function nextQuestion(transcript) {
  const inputText = transcriptToInput(transcript);
  const a = analyze(inputText);
  for (const q of QUESTIONS) {
    if (!transcript.some((t) => t.qid === q.id) && q.detect(a)) return { qid: q.id, question: q.ask(a) };
  }
  return null;
}

/** 追加一轮问答 */
export function addTurn(transcript, qid, question, answer) {
  const a = String(answer || '').trim();
  if (!a) return transcript;
  return [...transcript, { qid, question, answer: a }];
}

/** 把对话转成可编译输入（保留原始 + 逐轮 Q&A） */
export function transcriptToInput(transcript, initialRaw = '') {
  const parts = [initialRaw.trim()];
  if (!parts[0]) parts.shift();
  const qa = transcript.filter((t) => t.answer);
  if (qa.length) {
    parts.push('[多轮澄清]');
    for (const t of qa) parts.push(`Q：${t.question}\nA：${t.answer}`);
  }
  return parts.join('\n');
}

/** 生成澄清摘要（用于结果展示） */
export function dialogueSummary(transcript) {
  return transcript.filter((t) => t.answer).map((t) => ({ q: t.question, a: t.answer }));
}

export default { nextQuestion, addTurn, transcriptToInput, dialogueSummary };
