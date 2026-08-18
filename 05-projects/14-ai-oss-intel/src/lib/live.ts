/**
 * Live GitHub data layer — pulls real-time repositories from the GitHub
 * Search API on each category view, cached in localStorage (TTL 30 min)
 * with a manual refresh, and gracefully falls back to the local snapshot.
 * Client-side only (browser CORS to api.github.com).
 */
import type { CategoryId } from "@/lib/types";

export interface LiveRepo {
  fullName: string;
  name: string;
  owner: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  description: string | null;
  topics: string[];
  createdAt: string;   // 发布时间
  updatedAt: string;
  homepage: string | null;
  license: string | null;
}

export interface LiveState {
  repos: LiveRepo[];
  fetchedAt: number;
  source: "live" | "cache" | "seed";
  error?: string;
}

/** Category → GitHub search queries (primary topics, then fallback). */
const CATEGORY_QUERIES: Record<CategoryId, string[]> = {
  agent: ["topic:ai-agent stars:>500 fork:false", "topic:ai-agents stars:>200 fork:false"],
  skill: ["topic:claude-code skills:>50 fork:false", "topic:ai-skills stars:>20 fork:false"],
  mcp: ["topic:mcp stars:>50 fork:false", "topic:model-context-protocol stars:>20 fork:false"],
  coding: ["topic:ai-coding stars:>500 fork:false", "topic:code-generation stars:>500 fork:false"],
  devtools: ["topic:developer-tools stars:>1000 fork:false", "topic:ai-tools stars:>500 fork:false"],
  saas: ["topic:saas stars:>500 fork:false", "topic:ai-saas stars:>100 fork:false"],
  productivity: ["topic:productivity stars:>500 fork:false", "topic:assistant stars:>1000 fork:false"],
  automation: ["topic:automation stars:>500 fork:false", "topic:rpa stars:>100 fork:false"],
  content: ["topic:content-creation stars:>200 fork:false", "topic:ai-content stars:>100 fork:false"],
  selfmedia: ["topic:social-media stars:>500 fork:false", "topic:social-media-automation stars:>50 fork:false"],
  video: ["topic:video-generation stars:>200 fork:false", "topic:text-to-video stars:>100 fork:false"],
  image: ["topic:stable-diffusion stars:>500 fork:false", "topic:image-generation stars:>500 fork:false"],
  audio: ["topic:text-to-speech stars:>200 fork:false", "topic:speech-recognition stars:>200 fork:false"],
  writing: ["topic:writing stars:>200 fork:false", "topic:ai-writing stars:>50 fork:false"],
  resume: ["topic:job-search stars:>50 fork:false", "ai resume stars:>20 fork:false"],
  sidehustle: ["topic:side-project stars:>200 fork:false", "topic:monetization stars:>50 fork:false"],
  money: ["topic:fintech stars:>500 fork:false", "topic:monetization stars:>50 fork:false"],
  ecommerce: ["topic:ecommerce stars:>500 fork:false", "topic:shopify stars:>200 fork:false"],
  marketing: ["topic:marketing stars:>500 fork:false", "topic:marketing-automation stars:>50 fork:false"],
  data: ["topic:data-analysis stars:>1000 fork:false", "topic:data-science stars:>1000 fork:false"],
  rag: ["topic:rag stars:>200 fork:false", "topic:retrieval-augmented-generation stars:>50 fork:false"],
  llm: ["topic:llm stars:>1000 fork:false", "topic:large-language-model stars:>200 fork:false"],
  vision: ["topic:computer-vision stars:>1000 fork:false", "topic:object-detection stars:>500 fork:false"],
  robotics: ["topic:robotics stars:>500 fork:false", "topic:ros stars:>500 fork:false"],
  education: ["topic:education stars:>500 fork:false", "topic:learning stars:>500 fork:false"],
  research: ["topic:research stars:>500 fork:false", "topic:deep-research stars:>50 fork:false"],
  infra: ["topic:mlops stars:>500 fork:false", "topic:llm-infrastructure stars:>50 fork:false"],
  devproductivity: ["topic:developer-experience stars:>50 fork:false", "topic:productivity-tools stars:>50 fork:false"],
  pkm: ["topic:knowledge-management stars:>200 fork:false", "topic:second-brain stars:>50 fork:false"],
  life: ["topic:productivity stars:>500 fork:false", "topic:lifehack stars:>20 fork:false"],
};

export function categoryQueries(id: CategoryId): string[] {
  return CATEGORY_QUERIES[id] ?? ["topic:ai stars:>1000 fork:false"];
}

const CACHE_KEY = "aioss.live.cache";
const TTL_MS = 30 * 60 * 1000;

function readCache(): Record<string, { ts: number; repos: LiveRepo[] }> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writeCache(id: string, repos: LiveRepo[]) {
  try {
    const c = readCache();
    c[id] = { ts: Date.now(), repos };
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

function normalize(it: any): LiveRepo | null {
  if (!it?.full_name) return null;
  return {
    fullName: it.full_name,
    name: it.full_name.split("/")[1],
    owner: it.full_name.split("/")[0],
    stars: it.stargazers_count ?? 0,
    forks: it.forks_count ?? 0,
    openIssues: it.open_issues_count ?? 0,
    language: it.language ?? null,
    description: it.description ?? null,
    topics: (it.topics ?? []).slice(0, 10),
    createdAt: (it.created_at ?? "").slice(0, 10),
    updatedAt: (it.updated_at ?? "").slice(0, 10),
    homepage: it.homepage ?? null,
    license: it.license?.spdx_id ?? null,
  };
}

async function fetchPage(q: string): Promise<any[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) {
    if (res.status === 403 || res.status === 429) throw new Error("GitHub API rate limit（未认证 10 次/分钟）；请稍后再试或配置 Token");
    throw new Error(`GitHub API ${res.status}`);
  }
  const data = await res.json();
  return data.items ?? [];
}

/** Pull up to 100 real repos for a category from GitHub. */
export async function fetchCategoryLive(id: CategoryId): Promise<LiveRepo[]> {
  const map = new Map<string, LiveRepo>();
  const queries = categoryQueries(id);
  for (const q of queries) {
    if (map.size >= 100) break;
    const items = await fetchPage(q);
    for (const it of items) {
      if (map.size >= 100) break;
      const repo = normalize(it);
      if (repo && !map.has(repo.fullName)) map.set(repo.fullName, repo);
    }
  }
  return [...map.values()].slice(0, 100);
}

/** Load live data with cache; falls back to seed on failure. */
export async function loadLive(id: CategoryId, force = false): Promise<LiveState> {
  const cache = readCache()[id];
  if (!force && cache && Date.now() - cache.ts < TTL_MS) {
    return { repos: cache.repos, fetchedAt: cache.ts, source: "cache" };
  }
  try {
    const repos = await fetchCategoryLive(id);
    writeCache(id, repos);
    return { repos, fetchedAt: Date.now(), source: "live" };
  } catch (e) {
    if (cache) return { repos: cache.repos, fetchedAt: cache.ts, source: "cache", error: (e as Error).message };
    return { repos: [], fetchedAt: 0, source: "seed", error: (e as Error).message };
  }
}

/** 2026 status for a live repo (no growth history → New/Active/Relevant). */
export function liveStatus(repo: LiveRepo): "2026NEW" | "2026ACTIVE" | "2026RELEVANT" {
  const cy = parseInt(repo.createdAt.slice(0, 4), 10);
  const uy = parseInt(repo.updatedAt.slice(0, 4), 10);
  if (cy >= 2026) return "2026NEW";
  if (uy >= 2026) return "2026ACTIVE";
  return "2026RELEVANT";
}

/** Growth proxy for live repos: average stars per day since created. */
export function starsPerDay(repo: LiveRepo): number {
  const days = Math.max(1, (Date.now() - Date.parse(repo.createdAt)) / 86400000);
  return repo.stars / days;
}
