/**
 * Live GitHub data layer — pulls real-time repositories from the GitHub
 * Search API on each category view, cached in localStorage (TTL 30 min)
 * with a manual refresh, and gracefully falls back to the local snapshot.
 * Client-side only (browser CORS to api.github.com).
 */
import type { CategoryId } from "@/lib/types";
import { isOpenSourceLicense, LICENSE_QUALIFIER } from "@/lib/licenses";
import { proxySearch } from "@/lib/githubProxy";

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
  agent: ["topic:ai-agent stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:ai-agents stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  skill: ["topic:claude-code skills:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:ai-skills stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  mcp: ["topic:mcp stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:model-context-protocol stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  coding: ["topic:ai-coding stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:code-generation stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  devtools: ["topic:developer-tools stars:>1000 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:ai-tools stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  saas: ["topic:saas stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:ai-saas stars:>100 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  productivity: ["topic:productivity stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:assistant stars:>1000 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  automation: ["topic:automation stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:rpa stars:>100 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  content: ["topic:content-creation stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:ai-content stars:>100 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  selfmedia: ["topic:social-media stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:social-media-automation stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  video: ["topic:video-generation stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:text-to-video stars:>100 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  image: ["topic:stable-diffusion stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:image-generation stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  audio: ["topic:text-to-speech stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:speech-recognition stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  writing: ["topic:writing stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:ai-writing stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  resume: ["topic:resume stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:career stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:job-search stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  sidehustle: ["topic:side-project stars:>100 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:monetization stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:creator-economy stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  money: ["topic:fintech stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:creator-economy stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:monetization stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  ecommerce: ["topic:ecommerce stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:shopify stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  marketing: ["topic:marketing stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:marketing-automation stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  data: ["topic:data-analysis stars:>1000 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:data-science stars:>1000 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  rag: ["topic:rag stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:retrieval-augmented-generation stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  llm: ["topic:llm stars:>1000 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:large-language-model stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  vision: ["topic:computer-vision stars:>1000 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:object-detection stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  robotics: ["topic:robotics stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:ros stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  education: ["topic:education stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:learning stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  research: ["topic:research stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:deep-research stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  infra: ["topic:mlops stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:llm-infrastructure stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  devproductivity: ["topic:developer-experience stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:productivity-tools stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  pkm: ["topic:knowledge-management stars:>200 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:second-brain stars:>50 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
  life: ["topic:productivity stars:>500 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)", "topic:lifehack stars:>20 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"],
};

export function categoryQueries(id: CategoryId): string[] {
  return CATEGORY_QUERIES[id] ?? ["topic:ai stars:>1000 fork:false (license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)"];
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

export function normalize(it: any): LiveRepo | null {
  if (!it?.full_name) return null;
  // 仅开源项目：License 校验（非开源直接丢弃）
  if (!isOpenSourceLicense(it.license?.spdx_id)) return null;
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
  // 生产级路径：经服务器 /api/github 代理（Token + Rate Limit + 缓存 + Retry）
  const proxied = await proxySearch(q);
  if (proxied?.items) return proxied.items;
  // 降级路径：直连 GitHub（未认证，限流 10/分钟）
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) {
    if (res.status === 403 || res.status === 429) throw new Error("GitHub API rate limit（未认证 10 次/分钟）；请配置 Token 或稍后重试");
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
  // 至少拉取 100 条：用「本分类宽泛查询」补齐（保持分类相关，不做跨分类凑数）
  if (map.size < 100) {
    const broad = CATEGORY_BROAD[id];
    if (broad) {
      try {
        const items = await fetchPage(broad);
        for (const it of items) {
          if (map.size >= 100) break;
          const repo = normalize(it);
          if (repo && !map.has(repo.fullName)) map.set(repo.fullName, repo);
        }
      } catch {}
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

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

/** Heuristic Opportunity Score for live repos (no full profile available). */
export function liveOpportunityScore(repo: LiveRepo): number {
  const pop = clamp((Math.log10(repo.stars + 1) / 5.3) * 100);
  const spd = clamp(starsPerDay(repo) * 3.5);
  const hay = `${repo.name} ${repo.description ?? ""} ${repo.topics.join(" ")} ${repo.language ?? ""}`.toLowerCase();
  const ai = /agent|llm|gpt|rag|mcp|ai|ml|model|retriev|embedding|automation|intelligence/i.test(hay) ? 18 : 6;
  const topicsBoost = Math.min(8, repo.topics.length * 2);
  return Math.round(clamp(pop * 0.32 + spd * 0.4 + ai + topicsBoost + (repo.license ? 4 : 0)));
}

/** Ensure the category live list reaches the target (fill with a broad AI fallback). */
/** 每分类的宽泛兜底查询（无星标门槛）：确保实时拉取能凑满 100 条本分类真实开源项目（替代通用 AI 补齐）。 */
const CATEGORY_BROAD: Record<string, string> = {
  agent: "(topic:ai-agent OR topic:ai-agents OR topic:agent) fork:false " + LICENSE_QUALIFIER,
  skill: "(topic:claude-code OR topic:ai-skills OR topic:skills) fork:false " + LICENSE_QUALIFIER,
  mcp: "(topic:mcp OR topic:model-context-protocol) fork:false " + LICENSE_QUALIFIER,
  coding: "(topic:ai-coding OR topic:code-generation OR topic:copilot) fork:false " + LICENSE_QUALIFIER,
  devtools: "(topic:developer-tools OR topic:ai-tools OR topic:cli) fork:false " + LICENSE_QUALIFIER,
  saas: "(topic:saas OR topic:ai-saas) fork:false " + LICENSE_QUALIFIER,
  productivity: "(topic:productivity OR topic:assistant OR topic:personal-assistant) fork:false " + LICENSE_QUALIFIER,
  automation: "(topic:automation OR topic:workflow OR topic:rpa) fork:false " + LICENSE_QUALIFIER,
  content: "(topic:content-creation OR topic:ai-content OR topic:writing) fork:false " + LICENSE_QUALIFIER,
  selfmedia: "(topic:social-media OR topic:content OR topic:blog) fork:false " + LICENSE_QUALIFIER,
  video: "(topic:video OR topic:text-to-video OR topic:ffmpeg) fork:false " + LICENSE_QUALIFIER,
  image: "(topic:image-generation OR topic:diffusion OR topic:stable-diffusion) fork:false " + LICENSE_QUALIFIER,
  audio: "(topic:audio OR topic:tts OR topic:speech OR topic:music) fork:false " + LICENSE_QUALIFIER,
  writing: "(topic:writing OR topic:markdown OR topic:docs) fork:false " + LICENSE_QUALIFIER,
  resume: "(topic:resume OR topic:career OR topic:job) fork:false " + LICENSE_QUALIFIER,
  sidehustle: "(topic:side-project OR topic:monetization OR topic:startup) fork:false " + LICENSE_QUALIFIER,
  money: "(topic:fintech OR topic:creator-economy OR topic:monetization) fork:false " + LICENSE_QUALIFIER,
  ecommerce: "(topic:ecommerce OR topic:shopify OR topic:commerce) fork:false " + LICENSE_QUALIFIER,
  marketing: "(topic:marketing OR topic:seo OR topic:growth) fork:false " + LICENSE_QUALIFIER,
  data: "(topic:data-science OR topic:data-analysis OR topic:analytics) fork:false " + LICENSE_QUALIFIER,
  rag: "(topic:rag OR topic:retrieval-augmented-generation OR topic:vector-database) fork:false " + LICENSE_QUALIFIER,
  llm: "(topic:llm OR topic:large-language-models OR topic:generative-ai) fork:false " + LICENSE_QUALIFIER,
  vision: "(topic:computer-vision OR topic:object-detection OR topic:ocr) fork:false " + LICENSE_QUALIFIER,
  robotics: "(topic:robotics OR topic:ros OR topic:autonomous OR topic:drones) fork:false " + LICENSE_QUALIFIER,
  education: "(topic:education OR topic:learning OR topic:course) fork:false " + LICENSE_QUALIFIER,
  research: "(topic:research OR topic:paper OR topic:scientific) fork:false " + LICENSE_QUALIFIER,
  infra: "(topic:infrastructure OR topic:kubernetes OR topic:database OR topic:devops) fork:false " + LICENSE_QUALIFIER,
  devproductivity: "(topic:developer-experience OR topic:developer-tools OR topic:productivity) fork:false " + LICENSE_QUALIFIER,
  pkm: "(topic:knowledge-management OR topic:notes OR topic:second-brain) fork:false " + LICENSE_QUALIFIER,
  life: "(topic:personal-knowledge OR topic:life-os OR topic:digital-garden) fork:false " + LICENSE_QUALIFIER,
};

const FALLBACK_FILL = "topic:ai stars:>100 fork:false " + LICENSE_QUALIFIER;
