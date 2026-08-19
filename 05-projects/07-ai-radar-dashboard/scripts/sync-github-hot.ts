/**
 * GitHub 热点：按场景分类抓取
 * - 每类收藏最多 30
 * - 每类增速最快 30
 * 使用 agent-reach 的 GitHub 后端（gh CLI），失败则回落 GitHub REST。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { isAiRelatedText } from "../src/lib/intel/categories";
import { classifyGithubStar } from "../src/lib/intel/github-classify";
import { enrichGithubStarItem } from "../src/lib/intel/github-enrich";
import type { GithubCategory, GithubHotCategoryBucket, GithubHotItem, GithubHotSnapshot, GithubStarItem } from "../src/lib/intel/github-types";
import { GITHUB_CATEGORY_ORDER } from "../src/lib/intel/github-types";

const root = path.join(__dirname, "..");
const outFile = path.join(root, "data", "github-hot.json");
const LIMIT = 30;
const SEARCH_JSON = [
  "name",
  "fullName",
  "url",
  "description",
  "stargazersCount",
  "owner",
  "homepage",
  "license",
  "isPrivate",
  "pushedAt",
  "createdAt",
  "language",
].join(",");

type GhSearchRepo = {
  name?: string;
  fullName?: string;
  url?: string;
  description?: string | null;
  stargazersCount?: number;
  homepage?: string | null;
  isPrivate?: boolean;
  pushedAt?: string;
  createdAt?: string;
  language?: string | null;
  owner?: { login?: string; url?: string };
  license?: { key?: string; name?: string; spdxId?: string } | string | null;
};

type GhApiRepo = {
  name?: string;
  full_name?: string;
  html_url?: string;
  description?: string | null;
  homepage?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  topics?: string[];
  pushed_at?: string | null;
  created_at?: string | null;
  private?: boolean;
  license?: { spdx_id?: string | null; name?: string | null } | null;
  owner?: { login?: string; html_url?: string };
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function licenseOf(raw: GhSearchRepo["license"] | GhApiRepo["license"]): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  const rec = raw as { spdxId?: string; spdx_id?: string | null; name?: string | null; key?: string };
  const spdx = (rec.spdxId || rec.spdx_id || rec.key || "").trim();
  const name = (rec.name || "").trim();
  if (spdx && spdx !== "NOASSERTION") return spdx;
  if (name && name !== "Other") return name;
  return null;
}

function toItem(input: {
  fullName: string;
  name?: string;
  url?: string;
  description?: string | null;
  author?: string;
  authorUrl?: string;
  stars?: number;
  forks?: number;
  language?: string | null;
  topics?: string[];
  createdAt?: string | null;
  pushedAt?: string | null;
  homepage?: string | null;
  license?: string | null;
  openSource?: boolean;
}): GithubStarItem | null {
  const fullName = (input.fullName || "").trim();
  if (!fullName || !fullName.includes("/")) return null;
  const author = input.author || fullName.split("/")[0] || "";
  const description = (input.description || "").trim();
  const topics = input.topics || [];
  const language = input.language || null;
  const homepage = (input.homepage || "").trim();
  return enrichGithubStarItem({
    id: fullName,
    name: input.name || fullName.split("/")[1] || fullName,
    fullName,
    url: input.url || `https://github.com/${fullName}`,
    description,
    author,
    authorUrl: input.authorUrl || `https://github.com/${author}`,
    stars: Number(input.stars) || 0,
    forks: Number(input.forks) || 0,
    language,
    topics,
    category: classifyGithubStar({ fullName, description, language, topics }),
    starredAt: input.createdAt || new Date().toISOString(),
    pushedAt: input.pushedAt || null,
    homepage: /^https?:\/\//i.test(homepage) ? homepage : null,
    license: input.license || null,
    openSource: input.openSource ?? true,
    features: [],
  });
}

function fromSearch(row: GhSearchRepo): GithubStarItem | null {
  const fullName = (row.fullName || "").trim();
  return toItem({
    fullName,
    name: row.name,
    url: row.url,
    description: row.description,
    author: row.owner?.login,
    authorUrl: row.owner?.url,
    stars: row.stargazersCount,
    language: row.language,
    createdAt: row.createdAt,
    pushedAt: row.pushedAt,
    homepage: row.homepage,
    license: licenseOf(row.license),
    openSource: row.isPrivate ? false : true,
  });
}

function fromApi(repo: GhApiRepo): GithubStarItem | null {
  const fullName = (repo.full_name || "").trim();
  const homepage = (repo.homepage || "").trim();
  return toItem({
    fullName,
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    author: repo.owner?.login,
    authorUrl: repo.owner?.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    topics: Array.isArray(repo.topics) ? repo.topics.filter(Boolean) : [],
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    homepage,
    license: licenseOf(repo.license),
    openSource: repo.private ? false : true,
  });
}

function isAiRepo(it: GithubStarItem): boolean {
  return isAiRelatedText(`${it.fullName} ${it.description} ${it.topics.join(" ")} ${it.name}`);
}

function searchRepos(query: string, limit = 30): GhSearchRepo[] {
  const result = spawnSync(
    "gh",
    ["search", "repos", query, "--sort", "stars", "--limit", String(limit), "--json", SEARCH_JSON],
    { encoding: "utf8", timeout: 45_000, maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    console.warn("[github:hot] gh search failed", query.slice(0, 80), (result.stderr || "").slice(0, 180));
    return [];
  }
  try {
    const rows = JSON.parse(result.stdout || "[]") as GhSearchRepo[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function fetchRepo(fullName: string): Promise<GithubStarItem | null> {
  const gh = spawnSync("gh", ["api", `repos/${fullName}`], {
    encoding: "utf8",
    timeout: 20_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (gh.status === 0 && gh.stdout) {
    try {
      return fromApi(JSON.parse(gh.stdout) as GhApiRepo);
    } catch {
      /* fall through */
    }
  }
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-radar-dashboard",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
    if (!res.ok) return null;
    return fromApi((await res.json()) as GhApiRepo);
  } catch {
    return null;
  }
}

function parseTrending(html: string, period: "today" | "week"): { fullName: string; starsDelta: number }[] {
  const out: { fullName: string; starsDelta: number }[] = [];
  const blocks = html.split(/<h2 class="h3 lh-condensed">/).slice(1);
  const deltaRe = period === "week" ? /([0-9,]+)\s+stars this week/i : /([0-9,]+)\s+stars today/i;
  for (const block of blocks) {
    const m = block.match(/href="\/([^/]+)\/([^"/]+)"/);
    if (!m) continue;
    const fullName = `${m[1]}/${m[2]}`;
    const d = block.match(deltaRe);
    const starsDelta = d ? Number(d[1].replace(/,/g, "")) : 0;
    out.push({ fullName, starsDelta: Number.isFinite(starsDelta) ? starsDelta : 0 });
  }
  return out;
}

async function fetchTrending(since: "daily" | "weekly"): Promise<{ fullName: string; starsDelta: number }[]> {
  const url = `https://github.com/trending?since=${since}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ai-radar-dashboard" } });
    if (!res.ok) {
      console.warn(`[github:hot] trending ${since} HTTP ${res.status}`);
      return [];
    }
    return parseTrending(await res.text(), since === "weekly" ? "week" : "today");
  } catch (err) {
    console.warn("[github:hot] trending fetch failed", err instanceof Error ? err.message : err);
    return [];
  }
}

function rankList(
  items: GithubStarItem[],
  list: "rising" | "top",
  deltas: Map<string, number>,
  category: GithubCategory,
): GithubHotItem[] {
  const seen = new Set<string>();
  const out: GithubHotItem[] = [];
  const preferred = items.filter((it) => it.category === category);
  const rest = items.filter((it) => it.category !== category);
  const ordered = list === "rising"
    ? [...preferred, ...rest].sort((a, b) => (deltas.get(b.id) || 0) - (deltas.get(a.id) || 0) || b.stars - a.stars)
    : [...preferred, ...rest].sort((a, b) => b.stars - a.stars);
  for (const it of ordered) {
    if (seen.has(it.id) || !isAiRepo(it)) continue;
    seen.add(it.id);
    out.push({
      ...it,
      category,
      rank: out.length + 1,
      list,
      starsDelta: deltas.get(it.id) ?? null,
    });
    if (out.length >= LIMIT) break;
  }
  return out;
}

function mergeStars(rows: GithubStarItem[]): GithubStarItem[] {
  const by = new Map<string, GithubStarItem>();
  for (const it of rows) {
    const prev = by.get(it.id);
    if (!prev || it.stars > prev.stars) by.set(it.id, it);
  }
  return [...by.values()].sort((a, b) => b.stars - a.stars);
}

const CAT_QUERIES: Record<GithubCategory, { top: string[]; rising: string[] }> = {
  coding: {
    top: [
      "stars:>400 (aider OR copilot OR cursor OR kilocode OR \"coding agent\" OR \"claude code\" OR codex OR continue)",
      "topic:llm (vscode OR neovim OR cli OR ide) stars:>200",
    ],
    rising: [
      "created:>{{d30}} stars:>40 (aider OR copilot OR cursor OR \"coding agent\" OR claude-code OR kilo OR codex)",
    ],
  },
  "agent-office": {
    top: [
      "stars:>200 (n8n OR dify OR autogpt OR openclaw OR crewai OR langgraph OR mcp OR \"ai agent\")",
      "topic:ai-agents stars:>80",
    ],
    rising: [
      "created:>{{d30}} stars:>20 (n8n OR dify OR autogpt OR mcp OR langgraph OR \"ai agent\" OR openclaw)",
    ],
  },
  content: {
    top: [
      "stars:>200 (comfyui OR \"stable diffusion\" OR tts OR whisper OR \"ai video\" OR \"image generation\" OR sora)",
      "topic:generative-ai stars:>150",
    ],
    rising: [
      "created:>{{d30}} stars:>20 (comfyui OR tts OR whisper OR \"ai video\" OR \"image generation\")",
    ],
  },
  intel: {
    top: [
      "stars:>200 (firecrawl OR rag OR crawler OR scraper OR rsshub OR langchain OR \"web scraping\")",
      "topic:rag stars:>100",
    ],
    rising: [
      "created:>{{d30}} stars:>20 (rag OR firecrawl OR crawler OR scraper OR rsshub)",
    ],
  },
  growth: {
    top: [
      "stars:>80 topic:ai (saas OR marketing OR seo OR indie OR gtm)",
      "stars:>120 (indie OR \"product hunt\" OR seo) (AI OR llm)",
    ],
    rising: [
      "created:>{{d30}} stars:>15 (indie OR saas OR seo OR marketing) (AI OR llm)",
    ],
  },
  learn: {
    top: [
      "stars:>400 (awesome llm OR \"ai tutorial\" OR \"machine learning\" handbook OR \"from scratch\" OR \"ai for beginners\")",
      "topic:tutorial (llm OR \"machine-learning\") stars:>80",
    ],
    rising: [
      "created:>{{d30}} stars:>20 (tutorial OR awesome OR handbook OR course) (llm OR AI)",
    ],
  },
  infra: {
    top: [
      "stars:>300 (vllm OR ollama OR llama.cpp OR localai OR inference OR \"self-hosted\" llm)",
      "topic:inference stars:>150",
    ],
    rising: [
      "created:>{{d30}} stars:>20 (vllm OR ollama OR inference OR \"self-hosted\" OR llama.cpp)",
    ],
  },
  other: {
    top: [
      "topic:artificial-intelligence stars:>8000",
      "topic:llm stars:>20000",
    ],
    rising: [
      "created:>{{d30}} stars:>80 topic:ai",
    ],
  },
};

function expandQueries(queries: string[], d30: string, d7: string): string[] {
  return queries.map((q) => q.replaceAll("{{d30}}", d30).replaceAll("{{d7}}", d7));
}

export async function syncGithubHot(): Promise<GithubHotSnapshot | null> {
  if (process.env.INTEL_OFFLINE === "1" || process.env.RADAR_OFFLINE === "1") {
    if (existsSync(outFile)) {
      console.log("[github:hot] skipped network (offline)");
      return JSON.parse(readFileSync(outFile, "utf8")) as GithubHotSnapshot;
    }
    return null;
  }

  const created30 = daysAgo(30);
  const created7 = daysAgo(7);

  const [daily, weekly] = await Promise.all([fetchTrending("daily"), fetchTrending("weekly")]);
  const deltaMap = new Map<string, number>();
  const trendingNames: string[] = [];
  for (const row of [...daily, ...weekly]) {
    const prev = deltaMap.get(row.fullName) || 0;
    if (row.starsDelta > prev) deltaMap.set(row.fullName, row.starsDelta);
    if (!trendingNames.includes(row.fullName)) trendingNames.push(row.fullName);
  }

  const trendingItems: GithubStarItem[] = [];
  const names = trendingNames.slice(0, 40);
  for (let i = 0; i < names.length; i += 5) {
    const chunk = names.slice(i, i + 5);
    const got = await Promise.all(chunk.map((fullName) => fetchRepo(fullName)));
    for (const it of got) if (it) trendingItems.push(it);
  }

  const categories: GithubHotCategoryBucket[] = [];
  for (const cat of GITHUB_CATEGORY_ORDER) {
    const spec = CAT_QUERIES[cat];
    const topRows = mergeStars(
      expandQueries(spec.top, created30, created7)
        .flatMap((q) => searchRepos(q, 40))
        .map(fromSearch)
        .filter((x): x is GithubStarItem => Boolean(x)),
    );
    const riseRows = mergeStars(
      expandQueries(spec.rising, created30, created7)
        .flatMap((q) => searchRepos(q, 40))
        .map(fromSearch)
        .filter((x): x is GithubStarItem => Boolean(x)),
    );
    const trendingForCat = trendingItems.filter((it) => it.category === cat || (cat === "other" && it.category === "other"));
    const top = rankList(topRows, "top", deltaMap, cat);
    const rising = rankList([...trendingForCat, ...riseRows], "rising", deltaMap, cat);
    categories.push({ id: cat, top, rising });
    console.log(`[github:hot] ${cat} top=${top.length} rising=${rising.length}`);
  }

  const snap: GithubHotSnapshot = {
    schemaVersion: 2,
    fetchedAt: new Date().toISOString(),
    categories,
  };
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(snap, null, 2), "utf8");
  const nTop = categories.reduce((s, b) => s + b.top.length, 0);
  const nRise = categories.reduce((s, b) => s + b.rising.length, 0);
  console.log(`[github:hot] categories=${categories.length} top=${nTop} rising=${nRise} → data/github-hot.json`);
  return snap;
}

async function main() {
  await syncGithubHot();
}

main().catch((err) => {
  console.error("[github:hot]", err instanceof Error ? err.message : err);
  process.exit(1);
});
