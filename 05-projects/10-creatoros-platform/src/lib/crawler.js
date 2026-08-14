/* ============================================================
 * CreatorOS 竞品情报爬虫管线（Adapter 架构）
 * 数据真实性原则：无网络/未接入 → 明确标注 Mock / 快照 / API 未接入
 * scripts/crawl-skills.mjs 可在有网环境执行真实抓取并合并入库
 * ============================================================ */
(function (global) {
  'use strict';

  const PIPELINE = [
    { id: 'discover', name: '发现数据源', desc: '枚举 GitHub / Awesome 列表 / Toolify / Product Hunt / 行业网站等来源' },
    { id: 'fetch', name: '抓取', desc: '按 Adapter 拉取原始数据（HTTP/API/页面解析）' },
    { id: 'clean', name: '清洗', desc: '去重、字段归一、剔除无效条目' },
    { id: 'structure', name: '结构化', desc: '映射为统一 Schema：name/category/source/features/评分' },
    { id: 'store', name: '入库', desc: '写入 data/competitors-snapshot.json（快照）' },
    { id: 'analyze', name: '分析', desc: '覆盖率 / 差距 / 定位象限 / 产品总监报告' },
  ];

  const SOURCE_ADAPTERS = [
    { id: 'github', name: 'GitHub Search API', status: 'snapshot', endpoint: 'GET /search/repositories?q=creator+OR+content+OS+OR+自媒体', note: '脚本 crawl-skills.mjs 已实现，需网络' },
    { id: 'awesome', name: 'Awesome 列表 / 导航站', status: 'snapshot', endpoint: 'raw.githubusercontent.com · awesome-creator-tools 等', note: '已收录快照条目' },
    { id: 'toolify', name: 'Toolify / AI 导航', status: 'mock', endpoint: 'https://www.toolify.ai', note: 'Mock 数据，待接页面解析' },
    { id: 'producthunt', name: 'Product Hunt', status: 'mock', endpoint: 'https://www.producthunt.com', note: 'Mock 数据，待接官方 API' },
    { id: 'industry', name: '行业网站（新榜/蝉妈妈等）', status: 'mock', endpoint: '榜单/API', note: 'Mock 数据，合规授权后接入' },
    { id: 'wechat', name: '公众号 / 知识星球 Skill 市场', status: 'todo', endpoint: '—', note: '待调研，重点关注 Claude/GPT Skill 类产品' },
  ];

  /* 快照是否可信：标注每个来源状态 */
  function sourceTrust() {
    const byStatus = SOURCE_ADAPTERS.reduce((m, s) => ((m[s.status] = (m[s.status] || 0) + 1), m), {});
    return { byStatus, snapshotRatio: Math.round(((byStatus.snapshot || 0) / SOURCE_ADAPTERS.length) * 100) };
  }

  /* 管线执行（浏览器演示：带步骤进度；Node 可直接同步调用） */
  async function runPipeline(snapshot, opts = {}) {
    const onStep = opts.onStep || (() => {});
    const started = Date.now();
    const log = [];
    for (const step of PIPELINE) {
      onStep({ step, phase: 'running' });
      if (opts.delay) await new Promise((r) => setTimeout(r, opts.delay));
      log.push({ step: step.id, status: 'ok', at: new Date().toISOString() });
      onStep({ step, phase: 'done' });
    }
    const items = (snapshot && snapshot.items) || [];
    onStep({ phase: 'complete', summary: { items: items.length, sources: (snapshot && snapshot.sources) || [], timeMs: Date.now() - started } });
    return { items, log, timeMs: Date.now() - started };
  }

  const api = { PIPELINE, SOURCE_ADAPTERS, sourceTrust, runPipeline };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CreatorOS = global.CreatorOS || {};
  global.CreatorOS.crawler = api;
})(typeof window !== 'undefined' ? window : globalThis);
