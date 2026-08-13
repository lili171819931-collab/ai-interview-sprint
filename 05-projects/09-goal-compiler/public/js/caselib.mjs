/**
 * caselib.mjs — 案例库自动收录与相似搜索（纯函数，可测试）
 * 每次编译 → 自动收录为「用户案例」；按关键词搜索相似需求，点击可参考完整分析。
 */
import { compile } from './compiler/index.mjs';

export function toCaseMeta(result) {
  const a = result.analysis;
  return {
    id: result.id,
    title: a.entities.object || '未命名需求',
    rawInput: a.raw,
    domain: a.domains.primary,
    intent: a.intent.label,
    inputHash: result.inputHash,
    createdAt: result.createdAt,
    source: 'user',
    goalLen: result.goalPrompt.length,
    keywords: a.keywords.slice(0, 5).map((k) => k.word),
  };
}

/** 按 inputHash 去重，新案例置顶，最多保留 N 条 */
export function saveCase(list, meta, max = 200) {
  const rest = (list || []).filter((c) => c.inputHash !== meta.inputHash);
  return [meta, ...rest].slice(0, max);
}

/** 只收集「不同类型」的需求：按 领域·意图 组合去重，同类型仅保留最新一条 */
export function saveCaseByType(list, meta, max = 60) {
  const key = (m) => `${m.domain}·${m.intent}`;
  const rest = (list || []).filter((c) => key(c) !== key(meta));
  return [meta, ...rest].slice(0, max);
}

export function removeCase(list, id) {
  return (list || []).filter((c) => c.id !== id);
}

/** 相似度检索：对标题/原文/领域/意图/关键词打分 */
export function searchCases(list, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [...(list || [])];
  const tokens = q.split(/\s+/).filter(Boolean);
  return (list || [])
    .map((c) => {
      const hay = `${c.title} ${c.rawInput} ${c.domain} ${c.intent} ${(c.keywords || []).join(' ')}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (hay.includes(t)) score += t.length >= 3 ? 3 : 2;
      }
      // 原文包含查询词 → 更高相关
      if (tokens.some((t) => c.rawInput.toLowerCase().includes(t))) score += 4;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}

export function categoriesOf(list) {
  const m = {};
  for (const c of list || []) {
    const key = `${c.domain} · ${c.intent}`;
    m[key] = (m[key] || 0) + 1;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

/** 点击用户案例：确定性重编译，得到完整分析供参考 */
export function compileCase(meta) {
  return compile(meta.rawInput, { mode: 'case-ref' });
}

export default { toCaseMeta, saveCase, saveCaseByType, removeCase, searchCases, categoriesOf, compileCase };
