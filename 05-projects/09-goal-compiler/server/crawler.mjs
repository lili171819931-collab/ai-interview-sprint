/**
 * crawler.mjs — 竞品情报爬虫（服务端）
 * 数据源：
 *  1. GitHub Search API（仓库/技能库，实时）
 *  2. Hacker News Algolia API（讨论热度，实时）
 *  3. 内置精选竞品库 data/competitors.db.json（离线兜底 + 人工研判）
 * 零第三方依赖，Node >= 18（全局 fetch）。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export function loadCuratedDB() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'data', 'competitors.db.json'), 'utf8'));
  } catch {
    return [];
  }
}

async function fetchJSON(url, headers = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'goal-compiler-crawler/1.0', Accept: 'application/json', ...headers }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function githubSearch(query, perPage = 8) {
  const q = encodeURIComponent(query);
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=${perPage}`;
  const data = await fetchJSON(url);
  return (data.items || []).map((it) => ({
    name: it.full_name,
    title: it.full_name.split('/')[1],
    url: it.html_url,
    source: 'GitHub',
    description: (it.description || '').slice(0, 220),
    stars: it.stargazers_count || 0,
    language: it.language || '',
    updatedAt: (it.updated_at || '').slice(0, 10),
    topics: (it.topics || []).slice(0, 6),
    kind: 'repo/skill',
  }));
}

export async function hnSearch(query, hits = 8) {
  const q = encodeURIComponent(query);
  const url = `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=${hits}`;
  const data = await fetchJSON(url);
  return (data.hits || []).filter((h) => h.title).map((h) => ({
    name: h.title.slice(0, 120),
    title: h.title.slice(0, 120),
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: 'Hacker News',
    description: (h.story_text || h.title || '').replace(/<[^>]+>/g, '').slice(0, 220),
    stars: h.points || 0,
    language: '',
    updatedAt: (h.created_at || '').slice(0, 10),
    topics: ['discussion'],
    kind: 'discussion',
  }));
}

function curatedFilter(db, query) {
  const q = (query || '').toLowerCase();
  if (!q) return db.slice(0, 10);
  const tokens = q.split(/\s+/).filter(Boolean);
  return db
    .map((it) => {
      const hay = `${it.name} ${it.title} ${it.description} ${(it.tags || []).join(' ')}`.toLowerCase();
      const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
      return { it, score };
    })
    .filter((x) => x.score > 0 || q.length < 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.it);
}

export function curatedSearch(query) {
  return curatedFilter(loadCuratedDB(), query).map((it) => ({ ...it, source: it.source || '精选库' }));
}

/**
 * 综合检索：并行调用各数据源，返回合并去重列表
 */
export async function competitiveSearch({ q = 'goal compiler', sources = ['github', 'hackernews', 'curated'] } = {}) {
  const tasks = [];
  if (sources.includes('github')) tasks.push(githubSearch(q).catch((e) => ({ error: `github: ${e.message}` })));
  if (sources.includes('hackernews')) tasks.push(hnSearch(q).catch((e) => ({ error: `hackernews: ${e.message}` })));
  if (sources.includes('curated')) tasks.push(Promise.resolve(curatedSearch(q)));

  const results = await Promise.all(tasks);
  const errors = [];
  const items = [];
  for (const r of results) {
    if (r && r.error) errors.push(r.error);
    else if (Array.isArray(r)) items.push(...r);
  }
  // 去重（按 name+url）
  const seen = new Set();
  const dedup = items.filter((it) => {
    const key = `${it.name}|${it.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { query: q, sources, items: dedup.slice(0, 40), errors, fetchedAt: new Date().toISOString() };
}
