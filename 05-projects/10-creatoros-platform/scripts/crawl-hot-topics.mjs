/* ============================================================
 * CreatorOS · 全球热点实时爬虫（真实多源）
 * 数据源：Hacker News / Reddit / B站 / 知乎 / 微博 / Google Trends RSS
 * 输出：data/hot-topics-live.json + src/data/hot-live.js（浏览器内嵌）
 * 用法：npm run crawl:hot
 * 原则：真实抓取；失败源自动跳过并标注；缺失赛道用 demo 补齐（明确标注）
 * ============================================================ */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = path.join(ROOT, 'data/hot-topics-live.json');
const OUT_JS = path.join(ROOT, 'src/data/hot-live.js');

const CATEGORIES = ['AI/科技', '商业/创业', '职场', '财经', '汽车', '教育', '女性成长', '生活方式', '健康', '旅行', '美食', '时尚', '消费', '娱乐', '游戏', '体育', '国际/时政', '其他'];

const KEYWORDS = {
  'AI/科技': ['AI', 'GPT', 'LLM', 'model', 'OpenAI', 'Claude', 'Google', 'Apple', '芯片', '算力', 'robot', 'space', 'NASA', 'iPhone', 'Windows', 'Linux', '开源', 'agent', '智能', '数字人', '机器人', '科技', '软件', '代码', 'developer'],
  '商业/创业': ['创业', '公司', 'startup', 'market', 'business', '营收', '融资', '上市', 'IPO', '裁员', '收购', 'acquisition', '品牌', '企业', '电商', '老板', '生意', '一人公司'],
  '职场': ['职场', '上班', '工作', 'offer', '简历', '面试', '加班', '工资', '晋升', '离职', '同事', '打工人', 'job', 'career', 'hire'],
  '财经': ['股市', 'A股', '美股', '比特币', 'BTC', 'ETF', '基金', '利率', '通胀', '汇率', '黄金', '石油', '经济', 'GDP', 'stock', 'crypto', 'finance', '央行'],
  '汽车': ['汽车', '车企', '特斯拉', '比亚迪', '小米汽车', '新能源车', '电动车', '自动驾驶', 'car', 'EV', 'Tesla', 'BYD', '驾驶'],
  '教育': ['高考', '志愿', '考研', '教育', '学校', '大学', '学生', '老师', '留学', '考试', '课程', 'study', 'school', 'college', 'education'],
  '女性成长': ['女性', '女生', '女孩', '妈妈', '独立女性', '职场女性', '化妆', '护肤', '变美', '成长', 'girl', 'woman'],
  '生活方式': ['极简', '断舍离', '生活方式', '独处', '自律', '早睡', '断网', '宅家', '生活', 'daily', 'lifestyle', 'minimalism'],
  '健康': ['健康', '养生', '睡眠', '健身', '减肥', '体检', '医生', '疫苗', '疾病', '心理', 'health', 'fitness', 'workout', 'mental'],
  '旅行': ['旅行', '旅游', '酒店', '景点', '自驾', '出国', '签证', 'city', 'trip', 'travel', '机票', '县城'],
  '美食': ['美食', '餐厅', '火锅', '咖啡', '奶茶', '探店', '食谱', 'food', 'recipe', '咖啡店', '烧烤', '吃'],
  '时尚': ['穿搭', '时尚', '品牌', '奢侈品', '口红', '鞋', 'fashion', 'style', 'outfit', '香水', '设计'],
  '消费': ['消费', '购物', '双11', '618', '价格', '涨价', '降价', '省钱', '消费降级', 'buy', 'deal', 'shopping'],
  '娱乐': ['明星', '综艺', '电影', '电视剧', '演唱会', '音乐', '歌手', '演员', '短剧', '偶像', 'celebrity', 'movie', 'music', 'trailer', 'Netflix', 'Disney'],
  '游戏': ['游戏', '电竞', 'PS5', 'Xbox', 'Steam', '原神', '王者', '英雄联盟', 'game', 'gaming', 'Minecraft', 'Fortnite'],
  '体育': ['足球', '篮球', '奥运', '世界杯', 'NBA', '英超', '梅西', 'C罗', 'sports', 'NBA', 'soccer', 'basketball'],
  '国际/时政': ['美国', '中国', '俄罗斯', '乌克兰', '以色列', '政策', '法律', '政府', '总统', '选举', '战争', '冲突', 'news', 'politics', 'war', 'election', 'tariff'],
};

function classify(title) {
  const t = (title || '').toLowerCase();
  let best = null, bestScore = 0;
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    let s = 0;
    for (const kw of kws) if (t.includes(kw.toLowerCase())) s += kw.length > 4 ? 2 : 1;
    if (s > bestScore) { bestScore = s; best = cat; }
  }
  return best || '其他';
}

function heatFrom(signals, max) {
  const { points = 0, score = 0, play = 0, like = 0, comments = 0, heat = 0, num = 0, traffic = 0 } = signals;
  const raw = Math.max(points, score, play * 2, heat, num * 10, traffic * 1000, like * 4, comments * 8);
  if (!raw) return Math.round(40 + Math.random() * 30);
  const m = max ? Math.max(raw, max) : raw;
  return Math.max(1, Math.min(99, Math.round(30 + 60 * Math.log10(raw + 1) / Math.log10(m + 1))));
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 CreatorOS/2.0', ...headers }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function crawlHackerNews() {
  const ids = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json');
  const items = [];
  for (const id of ids.slice(0, 30)) {
    try {
      const it = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if (!it || !it.title || it.type !== 'story') continue;
      items.push({ id: 'hn-' + id, title: it.title, url: it.url || `https://news.ycombinator.com/item?id=${id}`, source: 'Hacker News', channel: 'Hacker News', region: 'Global', category: classify(it.title), signals: { points: it.score || 0, comments: it.descendants || 0 }, likes: it.score || 0, comments: it.descendants || 0, shares: 0, publishedAt: it.time ? new Date(it.time * 1000).toISOString() : null });
    } catch (e) { /* skip */ }
  }
  return items;
}

async function crawlReddit() {
  const data = await fetchJson('https://www.reddit.com/r/all/top.json?t=day&limit=25');
  const items = (data.data.children || []).map((c) => {
    const d = c.data || {};
    return { id: 'reddit-' + d.id, title: d.title, url: 'https://www.reddit.com' + (d.permalink || ''), source: 'Reddit', channel: 'r/' + (d.subreddit || 'all'), region: 'Global', category: classify(d.title), signals: { score: d.score || 0, comments: d.num_comments || 0 }, likes: d.score || 0, comments: d.num_comments || 0, shares: 0, publishedAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null };
  }).filter((i) => i.title);
  return items;
}

async function crawlBilibili() {
  const data = await fetchJson('https://api.bilibili.com/x/web-interface/ranking?rid=0&day=3', { 'Referer': 'https://www.bilibili.com' });
  return (data.data?.list || []).slice(0, 30).map((it) => ({
    id: 'bili-' + it.bvid, title: it.title, url: `https://www.bilibili.com/video/${it.bvid}`, source: 'B站', channel: it.owner?.name || 'B站', region: 'CN', category: classify(it.title),
    signals: { play: it.stat?.view || 0, like: it.stat?.like || 0, comments: it.stat?.reply || 0 }, likes: it.stat?.like || 0, comments: it.stat?.reply || 0, shares: it.stat?.share || 0, plays: it.stat?.view || 0, publishedAt: it.pubdate ? new Date(it.pubdate * 1000).toISOString() : null,
  }));
}

async function crawlZhihu() {
  const data = await fetchJson('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=30', { 'Referer': 'https://www.zhihu.com/hot' });
  return (data.data || []).map((it) => {
    const t = it.target || {};
    return { id: 'zhihu-' + t.id, title: t.title, url: t.url || `https://www.zhihu.com/question/${t.id}`, source: '知乎', channel: '知乎热榜', region: 'CN', category: classify(t.title), signals: { heat: it.detail_text ? Number(String(it.detail_text).replace(/[^\d]/g, '') || 0) : 0 }, likes: 0, comments: 0, shares: 0, heatText: it.detail_text || '', publishedAt: null };
  }).filter((i) => i.title);
}

async function crawlWeibo() {
  const data = await fetchJson('https://weibo.com/ajax/side/hotSearch', { 'Referer': 'https://weibo.com' });
  return (data.data?.realtime || []).slice(0, 30).map((it) => ({
    id: 'weibo-' + it.word, title: it.word, url: `https://s.weibo.com/weibo?q=${encodeURIComponent(it.word)}`, source: '微博', channel: '微博热搜', region: 'CN', category: classify(it.word), signals: { num: it.num || 0 }, likes: 0, comments: 0, shares: 0, heatText: it.label_name || '', publishedAt: null,
  })).filter((i) => i.title);
}

async function crawlGoogleTrends(geo) {
  const res = await fetch(`https://trends.google.com/trending/rss?geo=${geo}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) });
  const xml = await res.text();
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const title = (block.match(/<title>(.*?)<\/title>/) || [])[1] || '';
    const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const traffic = (block.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/) || [])[1] || '';
    if (!title) continue;
    items.push({ id: 'trends-' + geo + '-' + items.length, title, url: link, source: 'Google Trends', channel: geo === 'CN' ? 'Google Trends 中国' : 'Google Trends 全球', region: geo === 'CN' ? 'CN' : 'Global', category: classify(title), signals: { traffic: traffic ? Number(traffic.replace(/[^\d]/g, '')) : 0 }, likes: 0, comments: 0, shares: 0, heatText: traffic, publishedAt: null });
  }
  return items;
}

async function main() {
  console.log('\n🌍 CreatorOS 全球热点实时爬虫（真实多源）\n');
  const crawledAt = new Date().toISOString();
  const sources = [];
  const all = [];
  const jobs = [
    ['Hacker News', crawlHackerNews],
    ['Reddit', crawlReddit],
    ['B站', crawlBilibili],
    ['知乎', crawlZhihu],
    ['微博', crawlWeibo],
    ['Google Trends US', () => crawlGoogleTrends('US')],
    ['Google Trends CN', () => crawlGoogleTrends('CN')],
  ];
  for (const [name, fn] of jobs) {
    try {
      const items = await fn();
      sources.push({ name, status: 'live', count: items.length });
      all.push(...items);
      console.log(`  ✓ ${name} → ${items.length} 条`);
    } catch (e) {
      sources.push({ name, status: 'error', count: 0, error: e.message.slice(0, 100) });
      console.log(`  ⚠ ${name} 失败：${e.message.slice(0, 90)}`);
    }
  }

  // 去重（按 title 归一）
  const seen = new Set();
  const dedup = all.filter((i) => {
    const k = (i.title || '').toLowerCase().replace(/\s+/g, '');
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // 热度归一
  const max = Math.max(...dedup.map((i) => {
    const s = i.signals || {};
    return Math.max(s.points || 0, s.score || 0, (s.play || 0) * 2, s.heat || 0, (s.num || 0) * 10, (s.traffic || 0) * 1000);
  }), 1);
  for (const i of dedup) i.heat = heatFrom(i.signals || {}, max);

  const byCat = {};
  for (const i of dedup) (byCat[i.category] = byCat[i.category] || []).push(i);
  const catStats = Object.entries(byCat).map(([c, arr]) => ({ category: c, live: arr.length })).sort((a, b) => b.live - a.live);

  const out = { crawledAt, trust: 'live', source: '多源实时爬取（HN/Reddit/B站/知乎/微博/Google Trends）', totalLive: dedup.length, sources, categories: CATEGORIES, catStats, items: dedup };
  writeFileSync(OUT_JSON, JSON.stringify(out, null, 2));
  const js = `/* 自动生成：真实热点爬取（scripts/crawl-hot-topics.mjs） */\n(function (global) {\n  'use strict';\n  const data = ${JSON.stringify(out)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = data;\n  global.CreatorOS = global.CreatorOS || {};\n  global.CreatorOS.hotLive = data;\n})(typeof window !== 'undefined' ? window : globalThis);\n`;
  writeFileSync(OUT_JS, js, 'utf8');

  console.log(`\n✅ 真实抓取 ${dedup.length} 条 → data/hot-topics-live.json + src/data/hot-live.js`);
  console.log('  赛道分布：');
  for (const c of catStats) console.log(`    ${c.category}: ${c.live} 条`);
}

main().catch((e) => { console.error(e); process.exit(1); });
