/**
 * Pull the user's public GitHub stars into data/github-stars.json
 * Default login: lili171819931-collab (override with GITHUB_STARS_USER)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { classifyGithubStar } from "../src/lib/intel/github-classify";
import { enrichGithubStarItem } from "../src/lib/intel/github-enrich";
import type { GithubStarItem, GithubStarsSnapshot } from "../src/lib/intel/github-types";

const root = path.join(__dirname, "..");
const outFile = path.join(root, "data", "github-stars.json");
const LOGIN = (process.env.GITHUB_STARS_USER || "lili171819931-collab").replace(/^@/, "");

type GhStarRow = {
  starred_at?: string;
  repo?: GhRepo;
} & Partial<GhRepo>;

type GhRepo = {
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
  private?: boolean;
  license?: { spdx_id?: string | null; name?: string | null } | null;
  owner?: { login?: string; html_url?: string };
};

function parseGhJson(stdout: string): GhStarRow[] {
  const text = stdout.trim();
  if (!text) return [];
  try {
    const once = JSON.parse(text) as unknown;
    if (Array.isArray(once)) return once as GhStarRow[];
  } catch {
    // gh --paginate may emit concatenated arrays
  }
  const rows: GhStarRow[] = [];
  const dec = { parse: JSON.parse };
  let rest = text;
  while (rest.trim()) {
    const start = rest.search(/\[/);
    if (start < 0) break;
    try {
      const chunk = JSON.parse(rest.slice(start)) as unknown;
      if (Array.isArray(chunk)) {
        rows.push(...(chunk as GhStarRow[]));
        break;
      }
    } catch {
      const m = rest.slice(start).match(/^\[[\s\S]*?\](?=\s*\[|$)/);
      if (!m) break;
      const chunk = dec.parse(m[0]) as GhStarRow[];
      if (Array.isArray(chunk)) rows.push(...chunk);
      rest = rest.slice(start + m[0].length);
      continue;
    }
    break;
  }
  return rows;
}

function fetchViaGh(): GhStarRow[] {
  const result = spawnSync(
    "gh",
    ["api", "--paginate", `/users/${LOGIN}/starred?per_page=100`, "-H", "Accept: application/vnd.github.star+json"],
    { encoding: "utf8", timeout: 60_000, maxBuffer: 16 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    console.warn("[github:sync] gh api failed", (result.stderr || result.error?.message || "").slice(0, 240));
    return [];
  }
  return parseGhJson(result.stdout || "");
}

async function fetchViaHttp(): Promise<GhStarRow[]> {
  const rows: GhStarRow[] = [];
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.star+json",
    "User-Agent": "ai-radar-dashboard",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/users/${LOGIN}/starred?per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`[github:sync] HTTP ${res.status} page ${page}`);
      break;
    }
    const chunk = (await res.json()) as GhStarRow[];
    if (!Array.isArray(chunk) || !chunk.length) break;
    rows.push(...chunk);
    if (chunk.length < 100) break;
  }
  return rows;
}

function toItem(row: GhStarRow): GithubStarItem | null {
  const repo = (row.repo || row) as GhRepo;
  const fullName = (repo.full_name || "").trim();
  if (!fullName) return null;
  const author = repo.owner?.login || fullName.split("/")[0] || "";
  const description = (repo.description || "").trim();
  const topics = Array.isArray(repo.topics) ? repo.topics.filter(Boolean) : [];
  const language = repo.language || null;
  const spdx = (repo.license?.spdx_id || "").trim();
  const licenseName = (repo.license?.name || "").trim();
  const license =
    spdx && spdx !== "NOASSERTION" ? spdx : licenseName && licenseName !== "Other" ? licenseName : null;
  const homepage = (repo.homepage || "").trim();
  return enrichGithubStarItem({
    id: fullName,
    name: repo.name || fullName.split("/")[1] || fullName,
    fullName,
    url: repo.html_url || `https://github.com/${fullName}`,
    description,
    author,
    authorUrl: repo.owner?.html_url || `https://github.com/${author}`,
    stars: Number(repo.stargazers_count) || 0,
    forks: Number(repo.forks_count) || 0,
    language,
    topics,
    category: classifyGithubStar({ fullName, description, language, topics }),
    starredAt: row.starred_at || new Date().toISOString(),
    pushedAt: repo.pushed_at || null,
    homepage: /^https?:\/\//i.test(homepage) ? homepage : null,
    license,
    openSource: repo.private ? false : true,
    features: [],
  });
}

function enrichExistingFile(): boolean {
  if (!existsSync(outFile)) return false;
  try {
    const snap = JSON.parse(readFileSync(outFile, "utf8")) as GithubStarsSnapshot;
    if (!Array.isArray(snap.items) || !snap.items.length) return false;
    snap.items = snap.items.map(enrichGithubStarItem);
    writeFileSync(outFile, JSON.stringify(snap, null, 2), "utf8");
    console.log(`[github:sync] enriched existing snapshot count=${snap.items.length}`);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (process.env.INTEL_OFFLINE === "1" || process.env.RADAR_OFFLINE === "1") {
    enrichExistingFile();
    console.log("[github:sync] skipped network (offline)");
    return;
  }
  let rows = fetchViaGh();
  if (!rows.length) rows = await fetchViaHttp();
  const seen = new Set<string>();
  const items: GithubStarItem[] = [];
  for (const row of rows) {
    const it = toItem(row);
    if (!it || seen.has(it.id)) continue;
    seen.add(it.id);
    items.push(it);
  }
  if (!items.length) {
    if (enrichExistingFile()) return;
    console.warn("[github:sync] no starred repos fetched");
    return;
  }
  items.sort((a, b) => b.stars - a.stars || a.fullName.localeCompare(b.fullName));
  const snap: GithubStarsSnapshot = {
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    login: LOGIN,
    profileUrl: `https://github.com/${LOGIN}?tab=stars`,
    count: items.length,
    items,
  };
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(snap, null, 2), "utf8");
  console.log(`[github:sync] login=${LOGIN} count=${items.length} → data/github-stars.json`);
}

main().catch((err) => {
  console.error("[github:sync]", err instanceof Error ? err.message : err);
  process.exit(1);
});
