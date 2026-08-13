/**
 * server.mjs — Goal Compiler 平台服务端（零依赖）
 * - 静态托管 public/
 * - API：/api/health, /api/cases, /api/competitors, /api/competitive
 * 启动：node server/server.mjs [port]   （默认 8910）
 */
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { competitiveSearch } from './crawler.mjs';
import { marketData } from './market.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DATA = join(ROOT, 'data');
const PORT = Number(process.argv[2] || process.env.PORT || 8910);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readFileSafe(path) {
  try {
    const s = statSync(path);
    if (!s.isFile()) return null;
    return readFileSync(path);
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    // ---------- API ----------
    if (pathname === '/api/health') {
      return sendJSON(res, 200, { ok: true, service: 'goal-compiler', time: new Date().toISOString() });
    }
    if (pathname === '/api/cases') {
      const buf = readFileSafe(join(DATA, 'cases.json'));
      if (!buf) return sendJSON(res, 404, { error: 'cases not found' });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(buf);
    }
    if (pathname === '/api/templates/market') {
      const q = url.searchParams.get('q') || '';
      const data = await marketData({ q });
      return sendJSON(res, 200, data);
    }
    if (pathname === '/api/templates') {
      const buf = readFileSafe(join(DATA, 'templates.json'));
      if (!buf) return sendJSON(res, 404, { error: 'templates not found' });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(buf);
    }
    if (pathname === '/api/competitors') {
      const buf = readFileSafe(join(DATA, 'competitors.db.json'));
      if (!buf) return sendJSON(res, 404, { error: 'competitors db not found' });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(buf);
    }
    if (pathname === '/api/competitive') {
      const q = (url.searchParams.get('q') || 'goal compiler prompt').trim();
      const sources = (url.searchParams.get('sources') || 'github,hackernews,curated').split(',').filter(Boolean);
      const data = await competitiveSearch({ q, sources });
      return sendJSON(res, 200, data);
    }
    if (pathname.startsWith('/api/')) {
      return sendJSON(res, 404, { error: 'unknown api' });
    }

    // ---------- Static ----------
    let rel = pathname === '/' ? '/index.html' : pathname;
    // 防目录穿越
    const target = normalize(join(PUBLIC, rel));
    if (!target.startsWith(PUBLIC)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    let buf = readFileSafe(target);
    if (!buf && !extname(rel)) {
      buf = readFileSafe(join(target, 'index.html'));
    }
    if (!buf) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  } catch (err) {
    sendJSON(res, 500, { error: String(err && err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Goal Compiler 平台已启动`);
  console.log(`  ➜ 本地访问:  http://localhost:${PORT}\n`);
});
