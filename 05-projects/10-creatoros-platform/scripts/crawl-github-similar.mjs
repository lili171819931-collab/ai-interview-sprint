/* ============================================================
 * 真实爬取：GitHub 相似功能项目（search API · 需网络）
 * 输出：data/github-similar-projects.json（含链接 + 时间戳 + Star）
 * 用法：npm run crawl:github
 * ============================================================ */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data/github-similar-projects.json');

const QUERIES = [
  { q: 'content creator economy tools', note: '创作者经济工具' },
  { q: 'social media analytics dashboard', note: '社媒数据分析' },
  { q: '短剧 OR 自媒体 OR 爆款', note: '中文自媒体/爆款' },
  { q: 'short video AI generator', note: 'AI 短视频' },
  { q: 'viral video analysis', note: '爆款视频分析' },
  { q: 'content repurposing AI', note: '内容再利用' },
  { q: 'tiktok analytics', note: 'TikTok 分析' },
  { q: 'influencer marketing platform', note: '网红营销平台' },
];

async function searchRepo(q, perPage = 10) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'creatoros-crawler/2.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
  const data = await res.json();
  return (data.items || []).map((it) => ({
    id: it.full_name,
    name: it.full_name,
    url: it.html_url,
    description: (it.description || '').slice(0, 300),
    stars: it.stargazers_count,
    forks: it.forks_count,
    language: it.language || null,
    topics: it.topics || [],
    license: it.license?.spdx_id || 'unknown',
    owner: it.owner?.login || '',
    createdAt: it.created_at,
    updatedAt: it.updated_at,
    pushedAt: it.pushed_at,
    query: '',
    note: '',
  }));
}

async function main() {
  console.log('\n🔍 正在联网爬取 GitHub 相似功能项目…\n');
  const crawledAt = new Date().toISOString();
  const items = [];
  const seen = new Set();
  for (const { q, note } of QUERIES) {
    try {
      const rows = await searchRepo(q);
      for (const r of rows) {
        if (!seen.has(r.id)) { seen.add(r.id); r.query = q; r.note = note; items.push(r); }
      }
      console.log(`  ✓ "${q}" → ${rows.length} 条`);
    } catch (e) {
      console.log(`  ⚠ "${q}" 失败：${e.message.slice(0, 120)}`);
    }
    await new Promise((r) => setTimeout(r, 1200)); // 限流缓冲
  }
  items.sort((a, b) => b.stars - a.stars);
  const out = {
    crawledAt,
    trust: 'live', // 真实联网数据
    source: 'GitHub Search API (search/repositories, sort=stars)',
    total: items.length,
    items,
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\n✅ 已写入 ${OUT}`);
  console.log(`   共 ${items.length} 个真实项目（含链接 / Star / 更新时间）`);
  for (const it of items.slice(0, 12)) {
    console.log(`   ★ ${it.stars}  ${it.name}  (${it.updatedAt.slice(0, 10)})  ${it.url}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
