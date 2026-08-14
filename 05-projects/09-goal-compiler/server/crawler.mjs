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

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** 按源+查询 的 TTL 缓存：避免限流（Reddit 429 等） */
const CACHE = new Map();
const TTL = { github: 600000, hackernews: 600000, npm: 600000, stackoverflow: 600000, huggingface: 600000, gitee: 600000, devto: 600000, reddit: 1800000 };
function cachedFn(source, key, fn) {
  const ck = `${source}|${key}`;
  const hit = CACHE.get(ck);
  if (hit && Date.now() - hit.at < (TTL[source] || 600000)) return Promise.resolve(hit.items);
  return fn().then((items) => { CACHE.set(ck, { at: Date.now(), items }); return items; });
}

async function fetchJSON(url, headers = {}, timeoutMs = 12000, ua = BROWSER_UA) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/json, text/html, application/rss+xml', ...headers }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** 拉取原始文本（用于 RSS/HTML 类源） */
async function fetchText(url, headers = {}, timeoutMs = 12000, ua = BROWSER_UA) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/rss+xml, application/xml, text/xml, */*', ...headers }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** 清洗检索词：折叠空白、压缩到目标长度，避免各源 API 400/超限 */
export function sanitizeQuery(query, maxLen = 60) {
  let q = String(query || '').trim().replace(/\s+/g, ' ');
  if (q.length < 2) return q;
  if (q.length <= maxLen) return q;
  // 超长：先按空格截断到完整词，再硬截断
  let cut = q.slice(0, maxLen);
  const sp = cut.lastIndexOf(' ');
  if (sp > maxLen * 0.5) cut = cut.slice(0, sp);
  return cut.trim();
}

/** 简易 Atom/RSS 解析（零依赖） */
function parseRss(xml, sourceName) {
  const items = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>|<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = entryRe.exec(xml))) {
    const body = m[1] || m[2] || '';
    const title = (body.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const link = (body.match(/<link[^>]*href=["']([^"']+)["']/) || [])[1] || (body.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const id = (body.match(/<id>([\s\S]*?)<\/id>/) || [])[1] || link;
    const published = (body.match(/<published>([\s\S]*?)<\/published>/) || [])[1] || '';
    const author = (body.match(/<name>([\s\S]*?)<\/name>/) || [])[1] || '';
    const summary = (body.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || '';
    const clean = (x) => x.replace(/<!\[CDATA\[|\]\]>|<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
    if (clean(title)) {
      items.push({
        name: `${sourceName}: ${clean(title).slice(0, 90)}`,
        title: clean(title),
        url: clean(id) || clean(link),
        source: sourceName,
        description: clean(summary).slice(0, 220),
        stars: 0, language: '', updatedAt: (published || '').slice(0, 10),
        topics: ['discussion'], kind: 'discussion',
      });
    }
  }
  return items;
}

const GH_TOKEN = process.env.GITHUB_TOKEN || '';
export async function githubSearch(query, perPage = 8, token = GH_TOKEN) {
  const q = encodeURIComponent(query);
  const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=${perPage}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const data = await fetchJSON(url, headers);
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

export async function npmSearch(query, hits = 8) {
  const clean = sanitizeQuery(query, 60); // npm: text 必须 2-64 字符
  if (clean.length < 2) return [];
  const q = encodeURIComponent(clean);
  const url = `https://registry.npmjs.org/-/v1/search?text=${q}&size=${hits}`;
  const data = await fetchJSON(url);
  return (data.objects || []).map((o) => ({
    name: o.package.name,
    title: o.package.name,
    url: o.package.links?.repository || o.package.links?.npm || `https://www.npmjs.com/package/${o.package.name}`,
    source: 'npm',
    description: (o.package.description || '').slice(0, 220),
    stars: o.score?.detail?.popularity ? Math.round(o.score.detail.popularity * 1000) : 0,
    language: 'npm',
    updatedAt: (o.package.date || '').slice(0, 10),
    topics: (o.package.keywords || []).slice(0, 6),
    kind: 'package',
  }));
}

export async function stackoverflowSearch(query, hits = 8) {
  const q = encodeURIComponent(query);
  const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${q}&site=stackoverflow&pagesize=${hits}&filter=default`;
  const data = await fetchJSON(url);
  return (data.items || []).map((it) => ({
    name: `SO: ${it.title.slice(0, 90)}`,
    title: it.title,
    url: it.link,
    source: 'Stack Overflow',
    description: `Score ${it.score} · Answers ${it.answer_count} · Views ${it.view_count}`,
    stars: it.score || 0,
    language: '',
    updatedAt: new Date(it.creation_date * 1000).toISOString().slice(0, 10),
    topics: (it.tags || []).slice(0, 6),
    kind: 'qa',
  }));
}

export async function huggingfaceSearch(query, hits = 8) {
  const q = encodeURIComponent(query);
  const url = `https://huggingface.co/api/models?search=${q}&limit=${hits}&sort=downloads&direction=-1`;
  const data = await fetchJSON(url);
  return (Array.isArray(data) ? data : []).map((it) => ({
    name: `HF: ${it.id || it.modelId || ''}`,
    title: it.id || it.modelId || 'model',
    url: `https://huggingface.co/${it.id || it.modelId || ''}`,
    source: 'Hugging Face',
    description: (it.pipeline_tag || it.cardData?.language || 'model').slice(0, 120),
    stars: it.downloads || 0,
    language: 'ml',
    updatedAt: (it.lastModified || '').slice(0, 10),
    topics: (it.tags || []).slice(0, 6),
    kind: 'model',
  }));
}

export async function giteeSearch(query, perPage = 8) {
  const q = encodeURIComponent(query);
  const url = `https://gitee.com/api/v5/search/repositories?q=${q}&sort=stars_count&order=desc&per_page=${perPage}`;
  const data = await fetchJSON(url, {}, 20000);
  return (Array.isArray(data) ? data : []).map((it) => ({
    name: it.full_name,
    title: it.name || it.full_name,
    url: it.html_url,
    source: 'Gitee',
    description: (it.description || '').slice(0, 220),
    stars: it.stargazers_count || 0,
    language: it.language || '',
    updatedAt: (it.updated_at || '').slice(0, 10),
    topics: (it.topics || []).slice(0, 6),
    kind: 'repo/skill',
  }));
}

const REDDIT_HOSTS = ['www.reddit.com', 'old.reddit.com', 'np.reddit.com'];
export async function redditSearch(query, hits = 8) {
  const q = encodeURIComponent(query);
  // RSS 公开可用；多主机回退 + 重试，429/403 时静默返回空（该源为 best-effort 讨论源）
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const host of REDDIT_HOSTS) {
      try {
        const xml = await fetchText(`https://${host}/search.rss?q=${q}&limit=${hits}&sort=relevance&t=year`, {}, 10000);
        const items = parseRss(xml, 'Reddit');
        if (items.length) return items;
      } catch { /* try next host */ }
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
  }
  return [];
}

export async function devtoSearch(query, hits = 8) {
  const q = encodeURIComponent(query);
  const url = `https://dev.to/api/articles?per_page=${hits}&tag=ai`;
  const data = await fetchJSON(url);
  const hay = query.toLowerCase();
  return (Array.isArray(data) ? data : [])
    .filter((it) => !hay || `${it.title || ''} ${it.description || ''} ${(it.tag_list || []).join(' ')}`.toLowerCase().includes(hay))
    .slice(0, hits)
    .map((it) => ({
      name: `Dev.to: ${(it.title || '').slice(0, 90)}`,
      title: it.title || '',
      url: it.url,
      source: 'Dev.to',
      description: `❤️ ${it.positive_reactions_count || 0} · 💬 ${it.comments_count || 0} · ${(it.description || '').slice(0, 120)}`,
      stars: it.positive_reactions_count || 0,
      language: '', updatedAt: (it.published_at || '').slice(0, 10),
      topics: (it.tag_list || []).slice(0, 6), kind: 'discussion',
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
const SOURCE_FNS = {
  github: githubSearch, hackernews: hnSearch, curated: (q) => Promise.resolve(curatedSearch(q)),
  npm: npmSearch, stackoverflow: stackoverflowSearch, huggingface: huggingfaceSearch,
  gitee: giteeSearch, reddit: redditSearch, devto: devtoSearch,
};
export const SOURCES = Object.keys(SOURCE_FNS);

export async function competitiveSearch({ q = 'goal compiler', sources = ['github', 'hackernews', 'curated'], token = '' } = {}) {
  const jobs = sources.filter((src) => SOURCE_FNS[src]).map((src) => ({
    src,
    fn: () => cachedFn(src, q, () => (src === 'github' ? githubSearch(q, 8, token || GH_TOKEN) : SOURCE_FNS[src](q))),
  }));
  // 并发上限 4，避免触发各源限流
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < jobs.length) {
      const job = jobs[idx++];
      try {
        results.push(await job.fn());
      } catch (e) {
        // Reddit 为 best-effort 讨论源，限流/封锁时静默（不展示「源暂不可用」）
        if (job.src !== 'reddit') results.push({ error: `${job.src}: ${e.message}` });
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
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
