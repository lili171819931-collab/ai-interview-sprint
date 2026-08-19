/**
 * Production-grade GitHub API Client (server-side only).
 *  - Token via GITHUB_TOKEN env or data/github-token file (never in frontend)
 *  - Rate Limit Manager (X-RateLimit-* tracking, persisted, gating)
 *  - 403/429 auto-wait + exponential backoff retries (with jitter)
 *  - Cache layer (memory + filesystem, per-endpoint TTL)
 *  - Request deduplication (in-flight map)
 *  - Request queue for batch analysis (rate-aware concurrency)
 *  - Logging (never prints the token)
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const DATA_DIR = join(process.cwd(), "data");
const CACHE_DIR = join(DATA_DIR, "cache", "github");
const CACHE_FILE = join(CACHE_DIR, "github-cache.json");
const RATE_FILE = join(CACHE_DIR, "ratelimit.json");
const TOKEN_FILE = join(DATA_DIR, "github-token");

export interface RateState {
  limit: number;
  remaining: number;
  used: number;
  reset: number; // unix seconds
  authenticated: boolean;
  updatedAt: number;
}

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;
const MAX_RATE_WAIT_MS = Number(process.env.GITHUB_MAX_RATE_WAIT_MS || 30_000);

/* ── pure helpers (testable) ──────────────────────────────────────────── */
export function computeBackoff(attempt: number, baseMs = BACKOFF_BASE_MS): number {
  return Math.min(8000, baseMs * 2 ** Math.max(0, attempt)) + Math.random() * 500;
}
export function rateLevel(remaining: number): "healthy" | "warning" | "critical" | "out" {
  if (remaining > 50) return "healthy";
  if (remaining > 10) return "warning";
  if (remaining > 3) return "critical";
  return "out";
}
export function shouldGate(remaining: number): boolean {
  return remaining <= 10;
}
export function waitMs(reset: number): number {
  return Math.max(0, reset * 1000 - Date.now()) + 500;
}
export function capWait(ms: number, maxMs = MAX_RATE_WAIT_MS): number {
  return Math.max(0, Math.min(ms, maxMs));
}
export function cacheKey(type: string, path: string): string {
  return createHash("sha1").update(`${type}:${path}`).digest("hex").slice(0, 20);
}

export const TTL_MS: Record<string, number> = {
  search: 10 * 60 * 1000,
  starred: 15 * 60 * 1000,
  repo: 60 * 60 * 1000,
  tree: 60 * 60 * 1000,
  readme: 24 * 60 * 60 * 1000,
  issues: 30 * 60 * 1000,
  pr: 30 * 60 * 1000,
  releases: 60 * 60 * 1000,
  contributors: 60 * 60 * 1000,
};

/* ── rate state ───────────────────────────────────────────────────────── */
function loadRate(): RateState {
  try {
    return JSON.parse(readFileSync(RATE_FILE, "utf8")) as RateState;
  } catch {
    return { limit: 0, remaining: 0, used: 0, reset: 0, authenticated: false, updatedAt: 0 };
  }
}
let rate: RateState = loadRate();
function saveRate() {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(RATE_FILE, JSON.stringify(rate));
  } catch {}
}
export function getRate(): RateState {
  return { ...rate };
}

/* ── token ────────────────────────────────────────────────────────────── */
export function getToken(): string | undefined {
  const env = process.env.GITHUB_TOKEN?.trim();
  if (env) return env;
  try {
    if (existsSync(TOKEN_FILE)) {
      const t = readFileSync(TOKEN_FILE, "utf8").trim();
      if (t) return t;
    }
  } catch {}
  return undefined;
}
export function setToken(token: string) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(TOKEN_FILE, token.trim(), { mode: 0o600 });
  rate.authenticated = true;
  saveRate();
}
export function clearToken() {
  try { rmSync(TOKEN_FILE); } catch {}
  delete process.env.GITHUB_TOKEN;
  rate.authenticated = false;
  saveRate();
}
export function isTokenConfigured(): boolean {
  return !!getToken();
}

/* ── cache ────────────────────────────────────────────────────────────── */
interface CacheEntry { ts: number; data: unknown }
const memCache = new Map<string, CacheEntry>();
const MAX_CACHE = 600;
function loadFileCache(): Record<string, CacheEntry> {
  try { return JSON.parse(readFileSync(CACHE_FILE, "utf8")); } catch { return {}; }
}
function saveFileCache(cache: Record<string, CacheEntry>) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch {}
}
function cacheGet(type: string, path: string): unknown | undefined {
  const key = cacheKey(type, path);
  const ttl = TTL_MS[type] ?? 3600000;
  const mem = memCache.get(key);
  if (mem && Date.now() - mem.ts < ttl) return mem.data;
  const file = loadFileCache()[key];
  if (file && Date.now() - file.ts < ttl) {
    memCache.set(key, file);
    return file.data;
  }
  return undefined;
}
function cacheSet(type: string, path: string, data: unknown) {
  const key = cacheKey(type, path);
  const entry = { ts: Date.now(), data };
  memCache.set(key, entry);
  const file = loadFileCache();
  file[key] = entry;
  const keys = Object.keys(file);
  if (keys.length > MAX_CACHE) {
    keys.slice(0, keys.length - MAX_CACHE).forEach((k) => delete file[k]);
  }
  saveFileCache(file);
}

/* ── dedup ────────────────────────────────────────────────────────────── */
const inFlight = new Map<string, Promise<unknown>>();

/* ── logging ──────────────────────────────────────────────────────────── */
const logs: { at: string; line: string }[] = [];
export function getLogs(limit = 50) {
  return logs.slice(-limit);
}
function log(line: string) {
  logs.push({ at: new Date().toISOString(), line });
  console.log(`[GitHub API] ${line}`);
}

/* ── core request ─────────────────────────────────────────────────────── */
function parseRateHeaders(res: Response) {
  const limit = Number(res.headers.get("x-ratelimit-limit"));
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(limit) && limit > 0) {
    rate = { limit, remaining, reset, used: Math.max(0, limit - remaining), authenticated: !!getToken(), updatedAt: Date.now() };
    saveRate();
  }
}

export class GitHubApiError extends Error {
  constructor(message: string, public status?: number, public retryable = false) {
    super(message);
  }
}

export async function githubRequest<T>(path: string, opts: { type?: string; query?: string; token?: string } = {}): Promise<T> {
  const type = opts.type ?? "repo";
  const token = opts.token ?? getToken();
  const cached = cacheGet(type, path);
  if (cached !== undefined) {
    log(`GET ${path} 200 cache=HIT type=${type}`);
    return cached as T;
  }
  if (inFlight.has(path)) {
    log(`GET ${path} dedup=JOIN`);
    return inFlight.get(path) as Promise<T>;
  }
  const base = process.env.GITHUB_API_URL || "https://api.github.com";
  const p = (async (): Promise<T> => {
    let lastError: GitHubApiError | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = computeBackoff(attempt - 1);
        log(`GET ${path} retry=${attempt} backoff=${Math.round(backoff)}ms`);
        await new Promise((r) => setTimeout(r, backoff));
      }
      if (shouldGate(rate.remaining) && token) {
        const wait = capWait(waitMs(rate.reset));
        log(`GET ${path} gate=LOW_RATE_LIMIT wait=${Math.round(wait / 1000)}s(capped) remaining=${rate.remaining}`);
        await new Promise((r) => setTimeout(r, wait));
      }
      const started = Date.now();
      let res: Response;
      try {
        res = await fetch(`${base}${path}`, {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "ai-oss-intel",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (e) {
        lastError = new GitHubApiError("GitHub API 网络错误", undefined, true);
        continue;
      }
      parseRateHeaders(res);
      const duration = Date.now() - started;
      if (res.ok) {
        const data = await res.json();
        cacheSet(type, path, data);
        log(`GET ${path} ${res.status} remaining=${rate.remaining} cache=MISS duration=${duration}ms`);
        return data as T;
      }
      if (res.status === 403 || res.status === 429) {
        parseRateHeaders(res);
        if (token && rate.reset > 0) {
          const wait = capWait(waitMs(rate.reset));
          log(`GET ${path} ${res.status} rate-limit wait(capped)=${Math.round(wait / 1000)}s remaining=${rate.remaining}`);
          await new Promise((r) => setTimeout(r, wait));
          lastError = new GitHubApiError("GitHub API 请求受限，已等待限额重置后重试", res.status, true);
          continue;
        }
        const mins = rate.reset > 0 ? Math.max(1, Math.round((rate.reset - Date.now() / 1000) / 60)) : 0;
        lastError = new GitHubApiError(
          token
            ? `GitHub API 请求受限，约 ${mins} 分钟后自动恢复`
            : "GitHub API 请求受限（未认证限额 60 次/小时，搜索 10 次/分钟）。请在 My GitHub 页配置 GITHUB_TOKEN 自动提速。",
          res.status,
          true
        );
        break;
      }
      if (res.status === 401) {
        lastError = new GitHubApiError("GitHub Token 无效或已过期。请重新配置。", 401);
        break;
      }
      lastError = new GitHubApiError(`GitHub API ${res.status}`, res.status);
      break;
    }
    log(`GET ${path} ERROR ${lastError?.message}`);
    throw lastError ?? new GitHubApiError("GitHub API 请求失败");
  })();
  inFlight.set(path, p);
  // `p.finally(...)` 会派生一个新 Promise：p 被 reject 时该派生链也会 reject。
  // 路由只 await/catch 了 p，派生链必须单独吞掉，否则产生 unhandledRejection。
  p.finally(() => inFlight.delete(path)).catch(() => {});
  return p;
}

/* ── typed helpers ────────────────────────────────────────────────────── */
export function searchRepos(q: string, sort = "stars") {
  return githubRequest<any>(`/search/repositories?q=${encodeURIComponent(q)}&sort=${encodeURIComponent(sort)}&order=desc&per_page=100`, { type: "search" });
}
export function repoDetail(fullName: string) {
  return githubRequest<any>(`/repos/${fullName}`, { type: "repo" });
}
export function repoTree(fullName: string) {
  return githubRequest<any>(`/repos/${fullName}/git/trees/HEAD?recursive=1`, { type: "tree" });
}
export function starredRepos(user: string, page = 1) {
  return githubRequest<any[]>(`/users/${encodeURIComponent(user)}/starred?per_page=100&page=${page}`, { type: "starred" });
}

/* ── health ───────────────────────────────────────────────────────────── */
export function health() {
  const token = isTokenConfigured();
  return {
    authenticated: token,
    username: null as string | null,
    rateLimit: getRate(),
    cache: { enabled: true, entries: memCache.size },
    queue: queueStats(),
    level: rateLevel(getRate().remaining),
    logs: getLogs(5),
  };
}

/* ── queue（批量分析） ────────────────────────────────────────────────── */
export interface QueueTask { id: string; fullName: string; status: "queued" | "running" | "done" | "error"; error?: string; result?: unknown }
const queue: QueueTask[] = [];
let runningCount = 0;

export function queueStats() {
  return {
    tasks: queue.length,
    running: runningCount,
    done: queue.filter((t) => t.status === "done").length,
    error: queue.filter((t) => t.status === "error").length,
    remaining: queue.filter((t) => t.status === "queued" || t.status === "running").length,
  };
}

export function enqueueBatch(fullNames: string[]): { id: string; fullName: string }[] {
  const tasks = fullNames.map((fullName) => ({ id: cacheKey("task", fullName), fullName, status: "queued" as const }));
  queue.push(...tasks);
  pump();
  return tasks;
}

function concurrencyFor(remaining: number): number {
  if (remaining > 100) return 5;
  if (remaining > 50) return 3;
  if (remaining > 10) return 1;
  return 0;
}

function pump() {
  if (runningCount >= concurrencyFor(rate.remaining)) return;
  const next = queue.find((t) => t.status === "queued");
  if (!next) return;
  if (concurrencyFor(rate.remaining) === 0) return;
  next.status = "running";
  runningCount++;
  (async () => {
    try {
      const repo = await repoDetail(next.fullName);
      let tree: unknown = null;
      try { tree = await repoTree(next.fullName); } catch {}
      next.result = { repo, treeFetched: !!tree };
      next.status = "done";
    } catch (e) {
      next.status = "error";
      next.error = (e as Error).message;
    } finally {
      runningCount--;
      pump();
    }
  })();
}
