/* ============================================================
 * CreatorOS 竞品情报真实爬虫 CLI（需网络）
 * 用法：npm run crawl
 * 行为：无网/API 失败时自动回退到快照数据并明确标注，绝不伪造
 * ============================================================ */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = path.join(ROOT, 'data/competitors-snapshot.json');

const QUERIES = [
  'content creator OS', '自媒体', 'short video script AI', 'social media growth tool',
  'claude skills content', 'chatgpt skills creator', 'awesome creator tools',
];

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': 'creatoros-crawler/1.0', ...(opts.headers || {}) }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function crawlGitHub() {
  const out = [];
  for (const q of QUERIES.slice(0, 4)) {
    try {
      const data = await fetchJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=5`);
      for (const it of (data.items || [])) {
        out.push({
          name: it.full_name, category: 'GitHub 仓库', source: 'GitHub Search API', sourceType: 'github',
          url: it.html_url, rating: null, stars: it.stargazers_count,
          desc: (it.description || '').slice(0, 200), pricing: '开源/未知', targetUser: '开发者',
          breadth: 50, aiDepth: 50, features: {},
          strengths: [it.language || '多语言'], weaknesses: ['待人工评估'],
          directorNote: '来自 GitHub 实时检索，建议人工复核后入库。',
        });
      }
      console.log(`  GitHub「${q}」→ ${data.items?.length || 0} 条`);
    } catch (e) {
      console.log(`  ⚠ GitHub「${q}」失败：${e.message}`);
    }
  }
  return out;
}

async function main() {
  console.log('\n🔍 CreatorOS 竞品情报爬虫\n');
  const old = existsSync(SNAPSHOT) ? JSON.parse(readFileSync(SNAPSHOT, 'utf8')) : { items: [], sources: [] };
  const live = [];
  try { live.push(...await crawlGitHub()); } catch (e) { console.log('⚠ 网络不可用：' + e.message); }

  if (live.length) {
    // 去重合并：保留快照，追加新条目（按 url 去重）
    const seen = new Set(old.items.map((i) => i.url));
    const merged = [...old.items, ...live.filter((i) => !seen.has(i.url))];
    const snapshot = {
      generatedAt: new Date().toISOString(),
      trust: 'mixed', // 混合：快照 + 实时抓取
      schema: 'creatoros-competitor/v1',
      featureKeys: old.featureKeys || [],
      sources: [...old.sources, { name: 'GitHub Search API（实时）', status: 'live' }],
      items: merged,
      market: old.market || { opportunities: [], threats: [] },
    };
    writeFileSync(SNAPSHOT, JSON.stringify(snapshot, null, 2));
    console.log(`✅ 已合并入库：快照 ${old.items.length} + 新增 ${merged.length - old.items.length} = ${merged.length} 条`);
  } else {
    console.log('⚠ 未能抓取真实数据（离线/限流）。保持快照不变，未伪造任何数据。');
    console.log('  当前快照：' + old.items.length + ' 条（data/competitors-snapshot.json）');
  }
}

main();
