/**
 * Pull live Twitter/X messages (read-only) into data/twitter-live.json
 *
 * Backends (merged; first non-empty source is labeled, all tweets kept):
 *   1. nitter public RSS of AI accounts  (stable, no login)
 *   2. twitter-cli feed                  (agent-reach; skipped fast on lock/auth errors)
 *   3. Trends24 topics                   (last-resort pulses)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import path from "path";
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { parseRssOrAtom, toIsoDate } from "./lib/feeds";
import type { TwitterLiveItem, TwitterLiveSnapshot } from "../src/lib/intel/twitter-types";

const root = path.join(__dirname, "..");
const outFile = path.join(root, "data", "twitter-live.json");
const MAX = 120;
const NITTER_BASE = (process.env.NITTER_BASE || "https://nitter.net").replace(/\/$/, "");
const AI_HANDLES = [
  "OpenAI",
  "AnthropicAI",
  "GoogleDeepMind",
  "cursor_ai",
  "karpathy",
  "sama",
  "huggingface",
  "AIatMeta",
  "DeepSeek_AI",
  "vercel",
];

function extraPath(): string {
  return [
    path.join(homedir(), ".local/bin"),
    path.join(homedir(), ".agent-reach-venv/bin"),
    "/opt/homebrew/bin",
    process.env.PATH || "",
  ].join(path.delimiter);
}

function withTwitterEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, PATH: extraPath() };
  const cfg = path.join(homedir(), ".agent-reach", "config.yaml");
  if (!existsSync(cfg)) return env;
  const text = readFileSync(cfg, "utf8");
  for (const [key, envKey] of [
    ["twitter_auth_token", "TWITTER_AUTH_TOKEN"],
    ["twitter_ct0", "TWITTER_CT0"],
    ["auth_token", "TWITTER_AUTH_TOKEN"],
    ["ct0", "TWITTER_CT0"],
  ] as const) {
    if (env[envKey]) continue;
    const m = text.match(new RegExp(`^${key}:\\s*["']?([^\\s"']+)`, "m"));
    if (m?.[1]) env[envKey] = m[1];
  }
  return env;
}

function run(bin: string, args: string[], timeoutMs = 10_000): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync(bin, args, {
    cwd: root,
    env: withTwitterEnv(),
    encoding: "utf8",
    timeout: timeoutMs,
    killSignal: "SIGKILL",
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || result.error?.message || "",
  };
}

function which(name: string): string | null {
  const hit = spawnSync("which", [name], { env: withTwitterEnv(), encoding: "utf8" });
  const p = (hit.stdout || "").trim();
  if (hit.status === 0 && p) return p;
  const fallback = path.join(homedir(), ".local/bin", name);
  return existsSync(fallback) ? fallback : null;
}

function asIso(raw: unknown, fallback: string): string {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    return new Date(ms).toISOString();
  }
  const s = String(raw || "").trim();
  if (!s) return fallback;
  const t = Date.parse(s);
  return Number.isNaN(t) ? fallback : new Date(t).toISOString();
}

function tweetId(url: string, text: string, handle: string): string {
  const m = url.match(/status\/(\d+)/);
  if (m) return `tw-${m[1]}`;
  return `tw-${createHash("sha1").update(`${handle}|${text}`).digest("hex").slice(0, 16)}`;
}

function pick(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

function unwrapRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (o.ok === false || o.error) return [];
  for (const k of ["tweets", "items", "data", "results", "timeline"]) {
    if (Array.isArray(o[k])) return unwrapRows(o[k]);
  }
  return [];
}

function parseJsonish(stdout: string): Record<string, unknown>[] {
  const text = stdout.trim();
  if (!text) return [];
  const start = text.search(/[\[{]/);
  if (start < 0) return [];
  try {
    return unwrapRows(JSON.parse(text.slice(start)));
  } catch {
    return [];
  }
}

function toXUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(?:www\.)?nitter\.[^/]+/i, "https://x.com")
    .replace(/#m$/, "")
    .trim();
}

function rowsToItems(rows: Record<string, unknown>[], source: string, fetchedAt: string, kind: TwitterLiveItem["kind"]): TwitterLiveItem[] {
  const out: TwitterLiveItem[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const user = (row.user && typeof row.user === "object" ? (row.user as Record<string, unknown>) : row) as Record<string, unknown>;
    const text = pick(row, ["text", "full_text", "content", "title", "tweet", "body"]).replace(/\s+/g, " ").trim();
    if (text.length < 4) continue;
    const handle = pick(user, ["screen_name", "username", "handle", "userName"]).replace(/^@/, "");
    const author = pick(user, ["name", "display_name", "displayName", "author"]) || handle || "Twitter";
    let url = pick(row, ["url", "link", "permalink", "tweet_url"]);
    const idRaw = pick(row, ["id_str", "id", "tweet_id"]);
    if (!url && handle && idRaw) url = `https://x.com/${handle}/status/${idRaw}`;
    if (!url && idRaw) url = `https://x.com/i/status/${idRaw}`;
    url = toXUrl(url);
    const publishedAt = asIso(row.created_at || row.createdAt || row.time || row.date, fetchedAt);
    const id = tweetId(url, text, handle);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      author,
      handle,
      text: text.slice(0, 480),
      url: url || `https://x.com/search?q=${encodeURIComponent(text.slice(0, 80))}`,
      publishedAt,
      fetchedAt,
      kind,
      source,
    });
  }
  return out;
}

function loadPrev(): TwitterLiveItem[] {
  try {
    if (!existsSync(outFile)) return [];
    const snap = JSON.parse(readFileSync(outFile, "utf8")) as TwitterLiveSnapshot;
    return Array.isArray(snap.items) ? snap.items : [];
  } catch {
    return [];
  }
}

function merge(prev: TwitterLiveItem[], incoming: TwitterLiveItem[]): TwitterLiveItem[] {
  const hasTweets = incoming.some((it) => it.kind === "tweet");
  const base = hasTweets ? prev.filter((it) => it.kind === "tweet") : [];
  const seen = new Set<string>();
  const out: TwitterLiveItem[] = [];
  for (const it of [...incoming, ...base]) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
    if (out.length >= MAX) break;
  }
  return out.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, MAX);
}

function tryTwitterCli(fetchedAt: string): TwitterLiveItem[] {
  // Locked/expired cookies 403 every 15s would hammer X. Opt in via TWITTER_CLI=1 (hourly).
  if (process.env.TWITTER_CLI !== "1") return [];
  const bin = which("twitter");
  if (!bin) return [];
  const r = run(bin, ["feed", "-n", "15", "--json"], 10_000);
  const blob = `${r.stdout}\n${r.stderr}`;
  if (/temporarily locked|not_authenticated|ClientTransaction|Denied by access control/i.test(blob)) {
    return [];
  }
  return rowsToItems(parseJsonish(r.stdout), "twitter-cli:feed", fetchedAt, "tweet");
}

async function fetchNitterXml(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      redirect: "follow",
    });
    if (res.ok) {
      const body = await res.text();
      if (body.includes("<item")) return body;
    }
  } catch {
    // fall through to curl
  } finally {
    clearTimeout(timer);
  }
  const curl = spawnSync("curl", ["-sS", "-m", "12", "-A", "Mozilla/5.0", "-L", url], {
    encoding: "utf8",
    timeout: 14_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return curl.stdout || "";
}

async function fetchNitter(fetchedAt: string): Promise<TwitterLiveItem[]> {
  const results = await Promise.all(
    AI_HANDLES.map(async (handle) => {
      const xml = await fetchNitterXml(`${NITTER_BASE}/${handle}/rss`);
      if (!xml.includes("<item")) return [] as TwitterLiveItem[];
      const items: TwitterLiveItem[] = [];
      for (const row of parseRssOrAtom(xml)) {
        const text = (row.title || "").replace(/\s+/g, " ").trim();
        if (text.length < 4) continue;
        if (/^R to @/i.test(text)) continue;
        const url = toXUrl(row.url || `https://x.com/${handle}`);
        const fromUrl = url.match(/x\.com\/([^/]+)/i)?.[1] || handle;
        items.push({
          id: tweetId(url, text, fromUrl),
          author: fromUrl,
          handle: fromUrl,
          text: text.slice(0, 480),
          url,
          publishedAt: toIsoDate(row.publishedAt) || fetchedAt,
          fetchedAt,
          kind: "tweet",
          source: `nitter:${handle}`,
        });
      }
      return items;
    }),
  );
  const flat = results.flat();
  if (!flat.length) console.warn("[twitter:sync] nitter returned 0 items");
  return flat;
}

function fallbackTrends(fetchedAt: string): TwitterLiveItem[] {
  const hotFile = path.join(root, "data", "global-hot-topics.json");
  if (!existsSync(hotFile)) return [];
  try {
    const snap = JSON.parse(readFileSync(hotFile, "utf8")) as {
      platforms?: { name?: string; items?: { title?: string; url?: string }[] }[];
    };
    const group = (snap.platforms || []).find((p) => /twitter|x 趋势/i.test(p.name || ""));
    return (group?.items || [])
      .slice(0, 8)
      .map((it, i) => {
        const title = (it.title || "").trim();
        return {
          id: tweetId(it.url || "", title, `trend-${i}`),
          author: "Twitter/X 趋势",
          handle: "",
          text: title,
          url: it.url || `https://x.com/search?q=${encodeURIComponent(title)}`,
          publishedAt: fetchedAt,
          fetchedAt,
          kind: "trend" as const,
          source: "trends24-fallback",
        };
      })
      .filter((it) => it.text);
  } catch {
    return [];
  }
}

async function main() {
  if (process.env.INTEL_OFFLINE === "1" || process.env.RADAR_OFFLINE === "1") {
    console.log("[twitter:sync] skipped (offline)");
    return;
  }
  const fetchedAt = new Date().toISOString();
  mkdirSync(path.dirname(outFile), { recursive: true });

  const [cliItems, nitterItems] = await Promise.all([
    Promise.resolve().then(() => {
      try {
        return tryTwitterCli(fetchedAt);
      } catch (err) {
        console.warn("[twitter:sync] twitter-cli failed", err instanceof Error ? err.message : err);
        return [] as TwitterLiveItem[];
      }
    }),
    fetchNitter(fetchedAt).catch((err) => {
      console.warn("[twitter:sync] nitter failed", err instanceof Error ? err.message : err);
      return [] as TwitterLiveItem[];
    }),
  ]);

  let incoming = [...nitterItems, ...cliItems];
  const parts = [
    nitterItems.length ? `nitter:${nitterItems.length}` : "",
    cliItems.length ? `twitter-cli:${cliItems.length}` : "",
  ].filter(Boolean);
  let source = parts.join("+") || "none";

  if (!incoming.length) {
    incoming = fallbackTrends(fetchedAt);
    source = incoming.length ? "trends24-fallback" : "empty";
  }

  const items = merge(loadPrev(), incoming);
  const snap: TwitterLiveSnapshot = {
    schemaVersion: 1,
    fetchedAt,
    source,
    count: items.length,
    items,
  };
  writeFileSync(outFile, JSON.stringify(snap, null, 2), "utf8");
  console.log(`[twitter:sync] source=${source} new=${incoming.length} buffer=${items.length} → data/twitter-live.json`);
}

main().catch((err) => {
  console.error("[twitter:sync]", err instanceof Error ? err.message : err);
  process.exit(1);
});
