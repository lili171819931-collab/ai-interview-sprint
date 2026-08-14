/* 汇总真实爬取 + 按赛道补齐到 20+（演示条目明确标注）→ 最终热数据 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATS = ['AI/科技', '商业/创业', '职场', '财经', '汽车', '教育', '女性成长', '生活方式', '健康', '旅行', '美食', '时尚', '消费', '娱乐', '游戏', '体育', '国际/时政', '其他'];
const pools = JSON.parse(readFileSync('/tmp/cat-pools.json', 'utf8'));

const KEYWORDS = {
  'AI/科技': ['ai', 'gpt', 'llm', 'model', 'openai', 'claude', 'gemini', 'chatgpt', 'agent', 'robot', 'chip', 'nvidia', 'apple', 'google', 'microsoft', 'iphone', 'android', 'linux', 'windows', '开源', 'ai大模型', '人工智能', '数字人', '算力', '芯片', '机器人', '编程', '代码', 'developer', 'software', '科技', 'quantum', 'spacex', 'nasa', 'startup', 'show hn', 'ask hn', 'cpu', 'kernel', 'database', 'browser', 'compiler', 'dram', 'kubernetes', 'server', 'network', 'protocol', 'web', 'internet', 'language', 'hardware', 'glm', 'mistral', 'ocr', 'drone', 'diy', '自制', '发射器', '黑客', 'debug', 'unix', 'postgres', 'rust', 'python', 'javascript', 'gpu', 'api', 'sdk', 'os', '云', '计算', '工程', '机器学习', '深度学习', '工具', '技术'],
  '商业/创业': ['创业', 'company', 'business', 'startup', 'market', '营收', '融资', '上市', 'ipo', '裁员', '收购', 'acquisition', '品牌', '企业', '电商', '生意', '一人公司', '副业', 'founder', 'ceo', 'vc', 'revenue', 'profit'],
  '职场': ['职场', '上班', '工作', 'offer', '简历', '面试', '加班', '工资', '晋升', '离职', '同事', '打工人', 'job', 'career', 'hire', 'manager', 'employee'],
  '财经': ['股市', 'a股', '美股', '比特币', 'btc', 'crypto', 'etf', '基金', '利率', '通胀', '汇率', '黄金', '石油', '经济', 'gdp', 'stock', 'finance', 'bank', '央行', 'fed', 'bond', 'invest'],
  '汽车': ['汽车', '车企', '特斯拉', 'tesla', '比亚迪', '新能源车', '电动车', '自动驾驶', 'car', 'ev', 'vehicle', '充电', '电池'],
  '教育': ['高考', '志愿', '考研', '教育', '学校', '大学', '学生', '老师', '留学', '考试', '课程', 'study', 'school', 'college', 'education', 'learn', '地貌', '知识', '科普', '课堂', '教程', '高中'],
  '女性成长': ['女性', '女生', '女孩', '妈妈', '独立女性', '职场女性', '化妆', '护肤', 'girl', 'woman', 'female'],
  '生活方式': ['极简', '断舍离', '生活方式', '独处', '自律', '生活', 'lifestyle', 'minimal', 'home', 'daily', 'routine', '青春', '奋斗', '记录', 'vlog', '第一印象', '人生'],
  '健康': ['健康', '养生', '睡眠', '健身', '减肥', '体检', '医生', '疫苗', '疾病', '心理', 'health', 'fitness', 'workout', 'mental', 'food', 'diet'],
  '旅行': ['旅行', '旅游', '酒店', '景点', '自驾', '签证', 'trip', 'travel', '机票', '县城', 'city', 'island'],
  '美食': ['美食', '餐厅', '火锅', '咖啡', '奶茶', '探店', '食谱', 'food', 'recipe', 'coffee', 'cook', '吃', '厨房', '玉米', '街头', '烤', '锅'],
  '时尚': ['穿搭', '时尚', '奢侈品', '口红', '鞋', 'fashion', 'style', 'outfit', '香水', '美妆', '护肤', 'beauty'],
  '消费': ['消费', '购物', '价格', '涨价', '降价', '省钱', 'deal', 'shopping', 'buy', 'price', 'discount', 'double11', '双11'],
  '娱乐': ['明星', '综艺', '电影', '电视剧', '演唱会', '音乐', '歌手', '演员', '短剧', 'movie', 'music', 'trailer', 'netflix', 'disney', 'film', 'celebrity', 'show', '旋律', 'mv', '主打曲', '专辑', '演唱', '动画', '三体', '咒术回战', '新宝岛', '企划', '日系', '歌', '舞'],
  '游戏': ['游戏', '电竞', 'ps5', 'xbox', 'steam', '原神', '王者', '英雄联盟', 'game', 'gaming', 'minecraft', 'fortnite', 'nintendo', '影之刃', '三角洲', '绝区零', '黑神话', '塞尔达', '联动', '皮肤', '版本', '预告', 'b萌'],
  '体育': ['足球', '篮球', '奥运', '世界杯', 'nba', '英超', '梅西', 'c罗', 'sports', 'soccer', 'basketball', 'tennis', 'race'],
  '国际/时政': ['美国', '中国', '俄罗斯', '乌克兰', '以色列', '政策', '法律', '政府', '总统', '选举', '战争', '冲突', 'news', 'politics', 'war', 'election', 'tariff', 'united states', 'china', 'ukraine', 'russia'],
};

function classify(title, source) {
  const t = (title || '').toLowerCase();
  let best = '其他', bestScore = 0;
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    let s = 0;
    for (const kw of kws) if (t.includes(kw)) s += kw.length >= 4 ? 2 : 1;
    if (s > bestScore) { bestScore = s; best = cat; }
  }
  if (best === '其他' && source === 'Hacker News') return 'AI/科技'; // HN 社区技术向默认
  return best;
}

const SEARCH_URL = {
  '微博': (t) => `https://s.weibo.com/weibo?q=${encodeURIComponent(t)}`,
  'B站': (t) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(t)}`,
  '知乎': (t) => `https://www.zhihu.com/search?q=${encodeURIComponent(t)}`,
  '小红书': (t) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(t)}`,
  '抖音': (t) => `https://www.douyin.com/search/${encodeURIComponent(t)}`,
  'Google Trends': (t) => `https://www.google.com/search?q=${encodeURIComponent(t)}`,
  'Hacker News': (t) => `https://hn.algolia.com/?q=${encodeURIComponent(t)}`,
};

function demoItem(title, cat, idx, region) {
  const plat = ['小红书', 'B站', '知乎', '微博', '抖音'][idx % 5];
  return {
    id: `demo-${cat}-${idx}`, title, url: (SEARCH_URL[plat] || SEARCH_URL['知乎'])(title), source: '演示数据',
    channel: plat + ' 话题搜索', region, category: cat, trust: 'demo',
    signals: {}, heat: Math.max(55, 96 - idx * 2), likes: 0, comments: 0, shares: 0,
    demo: true, note: '演示条目 · 链接为平台搜索页（可打开）',
  };
}

const raw = JSON.parse(readFileSync(path.join(ROOT, 'data/hot-topics-live.json'), 'utf8'));
const items = raw.items.map((i) => ({ ...i, category: classify(i.title, i.source), trust: 'live' }));
// 重新按分类分桶（live）
const byCat = {};
for (const i of items) (byCat[i.category] = byCat[i.category] || []).push(i);

// 补齐到 20+/分类
const finalItems = [];
const catStats = [];
for (const cat of CATS) {
  const live = (byCat[cat] || []).slice().sort((a, b) => b.heat - a.heat);
  const pool = pools[cat] || pools['其他'] || [];
  let need = Math.max(0, 20 - live.length);
  const demo = [];
  for (let i = 0; i < need; i++) {
    const title = pool[i % pool.length] + (i >= pool.length ? `（${Math.floor(i / pool.length) + 1}）` : '');
    demo.push(demoItem(title, cat, i, cat === '其他' ? 'Global' : 'CN'));
  }
  const all = [...live, ...demo];
  finalItems.push(...all);
  catStats.push({ category: cat, live: live.length, demo: demo.length, total: all.length });
}
finalItems.sort((a, b) => (a.category === b.category ? b.heat - a.heat : CATS.indexOf(a.category) - CATS.indexOf(b.category)));

const out = {
  crawledAt: raw.crawledAt, builtAt: new Date().toISOString(), trust: 'mixed',
  source: '真实爬取（HN/B站/微博/Google Trends）+ 演示补齐（明确标注 demo）',
  sources: raw.sources || [], totalLive: raw.totalLive, total: finalItems.length, categories: CATS, catStats,
  items: finalItems,
};
writeFileSync(path.join(ROOT, 'data/hot-topics-final.json'), JSON.stringify(out, null, 2));
const js = `/* 自动生成：热点最终数据（scripts/build-hot-final.mjs） */\n(function (global) {\n  'use strict';\n  const data = ${JSON.stringify(out)};\n  if (typeof module !== 'undefined' && module.exports) module.exports = data;\n  global.CreatorOS = global.CreatorOS || {};\n  global.CreatorOS.hotLive = data;\n})(typeof window !== 'undefined' ? window : globalThis);\n`;
writeFileSync(path.join(ROOT, 'src/data/hot-live.js'), js, 'utf8');
console.log(`✅ 最终热数据 ${out.total} 条（真实 ${out.totalLive} + 演示 ${out.total - out.totalLive}）`);
for (const c of catStats) console.log(`  ${c.category}: ${c.total}（live ${c.live} / demo ${c.demo}）`);
