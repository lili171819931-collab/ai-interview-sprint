/**
 * Unified platform database (client store).
 * Single source of truth: local seed snapshot + live GitHub repos merged by
 * fullName. `syncGlobal()` pulls curated real-time data from the GitHub Search
 * API (paced to stay under the unauthenticated rate limit), caches it for
 * 30 min, and notifies every consumer (Discover / Insights / category boards /
 * My GitHub) so the whole platform stays in sync.
 */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalize, type LiveRepo } from "@/lib/live";

export interface DbState {
  repos: LiveRepo[];
  fetchedAt: number;
  source: "live" | "cache" | "seed";
  error?: string;
  syncing?: boolean;
}

/** Curated global queries — ~9 requests per sync (under 10/min unauth limit). */
const GLOBAL_QUERIES = [
  "topic:ai-agent stars:>300 fork:false",
  "topic:llm stars:>800 fork:false",
  "topic:rag stars:>150 fork:false",
  "topic:mcp stars:>50 fork:false",
  "topic:ai-coding stars:>300 fork:false",
  "topic:stable-diffusion stars:>300 fork:false",
  "topic:computer-vision stars:>500 fork:false",
  "topic:automation stars:>300 fork:false",
  "topic:saas stars:>300 fork:false",
];

const CACHE_KEY = "aioss.db.global";
const TTL_MS = 30 * 60 * 1000;
const PACE_MS = 750;

let inFlight: Promise<DbState> | null = null;

function readCache(): DbState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DbState;
  } catch {
    return null;
  }
}
function writeCache(state: DbState) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("aioss.db.change"));
  } catch {}
}

async function fetchPage(q: string): Promise<any[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) {
    if (res.status === 403 || res.status === 429) throw new Error("GitHub API rate limit（未认证 10 次/分钟）");
    throw new Error(`GitHub API ${res.status}`);
  }
  const data = await res.json();
  return data.items ?? [];
}

export async function syncGlobal(force = false): Promise<DbState> {
  const cache = readCache();
  if (!force && cache && cache.repos.length > 0 && Date.now() - cache.fetchedAt < TTL_MS) {
    return { ...cache, source: "cache" };
  }
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const map = new Map<string, LiveRepo>();
    let error: string | undefined;
    try {
      for (const q of GLOBAL_QUERIES) {
        try {
          const items = await fetchPage(q);
          for (const it of items) {
            const r = normalize(it);
            if (r && !map.has(r.fullName)) map.set(r.fullName, r);
          }
        } catch (e) {
          error = (e as Error).message;
          break;
        }
        await new Promise((r) => setTimeout(r, PACE_MS));
      }
      const state: DbState = { repos: [...map.values()].slice(0, 900), fetchedAt: Date.now(), source: "live", error };
      writeCache(state);
      return state;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export function getDb(): DbState {
  const cache = readCache();
  if (cache && cache.repos.length > 0) return cache;
  return { repos: [], fetchedAt: 0, source: "seed" };
}

export function subscribeDb(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("aioss.db.change", cb);
  return () => window.removeEventListener("aioss.db.change", cb);
}

/** React hook: unified DB with auto-sync (when stale) + manual refresh. */
export function useDb() {
  const [state, setState] = useState<DbState>(() => getDb());
  const [syncing, setSyncing] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const unsub = subscribeDb(() => setState(getDb()));
    if (!started.current) {
      started.current = true;
      const cached = getDb();
      if (!cached || cached.repos.length === 0 || Date.now() - cached.fetchedAt > TTL_MS) {
        setSyncing(true);
        syncGlobal(false)
          .then((s) => { setState(s); setSyncing(false); })
          .catch(() => setSyncing(false));
      }
    }
    return unsub;
  }, []);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const s = await syncGlobal(true);
      setState(s);
    } finally {
      setSyncing(false);
    }
  }, []);

  return { state, syncing, refresh };
}

/** Merge helpers: seed projects enriched with live repos + extra live-only repos. */
export interface MergedRow {
  seed?: import("@/lib/types").Project;
  live?: LiveRepo;
}
export function mergeRows(repos: LiveRepo[]): MergedRow[] {
  const byName = new Map(repos.map((r) => [r.fullName.toLowerCase(), r]));
  const rows: MergedRow[] = [];
  const { PROJECTS } = require("@/data/projects") as typeof import("@/data/projects");
  for (const p of PROJECTS) rows.push({ seed: p, live: byName.get(p.fullName.toLowerCase()) });
  for (const r of repos) {
    if (!PROJECTS.some((p) => p.fullName.toLowerCase() === r.fullName.toLowerCase())) rows.push({ live: r });
  }
  return rows;
}
