// 生成快照数据：data/competitors-snapshot.json · data/thinking-chain.json
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(path.join(ROOT, 'data'), { recursive: true });

const competitors = require(path.join(ROOT, 'src/data/competitors.js'));
const chain = require(path.join(ROOT, 'src/data/thinking-chain.js'));

const snapshot = {
  generatedAt: new Date().toISOString(),
  trust: 'snapshot', // 快照数据：由 crawl-skills.mjs 在有网环境抓取真实数据后覆盖
  schema: 'creatoros-competitor/v1',
  featureKeys: competitors.FEATURE_KEYS,
  sources: [
    { name: 'GitHub Search API', status: 'snapshot' },
    { name: 'Awesome 列表', status: 'snapshot' },
    { name: 'Toolify', status: 'mock' },
    { name: 'Product Hunt', status: 'mock' },
    { name: '行业网站（新榜/蝉妈妈等）', status: 'mock' },
  ],
  items: competitors.competitors,
  market: competitors.market,
};

const chainSnapshot = {
  generatedAt: new Date().toISOString(),
  schema: 'creatoros-thinking-chain/v1',
  phases: chain.phases,
  nodes: chain.nodes,
};

writeFileSync(path.join(ROOT, 'data/competitors-snapshot.json'), JSON.stringify(snapshot, null, 2));
writeFileSync(path.join(ROOT, 'data/thinking-chain.json'), JSON.stringify(chainSnapshot, null, 2));
console.log('✅ 快照已生成：');
console.log('  data/competitors-snapshot.json  (' + snapshot.items.length + ' 条竞品)');
console.log('  data/thinking-chain.json        (' + chain.nodes.length + ' 个思维链节点)');
