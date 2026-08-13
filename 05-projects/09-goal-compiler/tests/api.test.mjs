/**
 * api.test.mjs — 服务端 API 测试（启动临时服务实例）
 * 覆盖：/api/health、/api/cases、/api/competitors、/api/competitive（精选库源离线可测）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = 18999;

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(ROOT, 'server', 'server.mjs'), String(PORT)], { stdio: 'ignore' });
    const t0 = Date.now();
    const iv = setInterval(() => {
      fetch(`http://localhost:${PORT}/api/health`).then(() => { clearInterval(iv); resolve(child); }).catch(() => {
        if (Date.now() - t0 > 8000) { clearInterval(iv); reject(new Error('server start timeout')); }
      });
    }, 200);
  });
}

async function stopServer(child) {
  child.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 300));
}

test('API: health / cases / competitors / competitive', async () => {
  const child = await startServer();
  try {
    const health = await (await fetch(`http://localhost:${PORT}/api/health`)).json();
    assert.equal(health.ok, true);

    const cases = await (await fetch(`http://localhost:${PORT}/api/cases`)).json();
    assert.ok(cases.cases.length >= 3, '应有 3 个测试用例');

    const comp = await (await fetch(`http://localhost:${PORT}/api/competitors`)).json();
    assert.ok(Array.isArray(comp) && comp.length >= 8, `精选竞品库应 >= 8（实际 ${comp.length}）`);

    const market = await (await fetch(`http://localhost:${PORT}/api/templates/market`)).json();
    assert.ok(market.byCategory.length >= 3, '模板市场应按分类聚合');
    assert.ok(market.total >= 18, `模板市场条目应 >= 18（实际 ${market.total}）`);
    assert.ok(market.byCategory.some((g) => g.items.some((it) => it.kind === 'repo')), '应含开源仓库条目');

    const tpl = await (await fetch(`http://localhost:${PORT}/api/templates`)).json();
    assert.ok(tpl.templates.length >= 8, `模板库应 >= 8（实际 ${tpl.templates.length}）`);
    assert.ok(tpl.templates.every((t) => t.raw && t.domain), '每个模板应有 raw 与 domain');

    const cr = await (await fetch(`http://localhost:${PORT}/api/competitive?q=goal+compiler&sources=curated`)).json();
    assert.ok(cr.items.length >= 5, '精选库检索应返回结果');
    assert.ok(cr.items.every((it) => it.name), '每条应有 name');

    const staticHtml = await fetch(`http://localhost:${PORT}/`);
    const html = await staticHtml.text();
    assert.ok(html.includes('Goal Compiler'), '首页应包含品牌');
  } finally {
    await stopServer(child);
  }
});
