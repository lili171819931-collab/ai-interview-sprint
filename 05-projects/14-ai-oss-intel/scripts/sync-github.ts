/**
 * GitHub Data Collector
 * --------------------
 * Fetches trending AI repositories from the GitHub Search API and merges the
 * results into data/github-snapshot.json. The snapshot can be loaded by the
 * platform (see src/lib/store.ts) to refresh star counts.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx npm run github:sync
 *   npm run github:sync          # unauthenticated (rate-limited to 10/min)
 *
 * Data flow: Scheduler → Collector → Cache (data/cache) → Snapshot JSON → Analytics
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECTS } from "../src/data/projects";

const SNAPSHOT = join(process.cwd(), "data", "github-snapshot.json");
const CACHE_DIR = join(process.cwd(), "data", "cache");

const QUERIES = [
  "topic:ai stars:>5000",
  "topic:llm stars:>5000",
  "topic:agent stars:>3000",
  "topic:mcp stars:>500",
  "topic:rag stars:>1000",
  "topic:ai-agents stars:>1000",
  "topic:generative-ai stars:>3000",
];

interface RawRepo {
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  description: string | null;
  html_url: string;
  homepage: string | null;
  license: { spdx_id: string } | null;
  created_at: string;
  updated_at: string;
  topics: string[];
}

async function ghFetch(query: string, token?: string): Promise<RawRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-oss-intel-sync",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { items: RawRepo[] };
  return data.items ?? [];
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  mkdirSync(CACHE_DIR, { recursive: true });

  const seen = new Map<string, RawRepo>();
  for (const q of QUERIES) {
    try {
      const items = await ghFetch(q, token);
      for (const it of items) if (!seen.has(it.full_name)) seen.set(it.full_name, it);
      console.log(`✓ ${q} → ${items.length} repos (total ${seen.size})`);
      await new Promise((r) => setTimeout(r, token ? 800 : 3000)); // polite pacing
    } catch (e) {
      console.warn(`✗ ${q} → ${(e as Error).message}`);
    }
  }

  // Merge with seed: update matching seeds, append unknown repos.
  const merged: Record<string, unknown>[] = [];
  for (const p of PROJECTS) {
    const live = seen.get(p.fullName);
    if (live) {
      merged.push({
        slug: p.slug,
        fullName: p.fullName,
        name: live.full_name.split("/")[1],
        owner: live.full_name.split("/")[0],
        stars: live.stargazers_count,
        forks: live.forks_count,
        contributors: p.contributors,
        openIssues: live.open_issues_count,
        language: live.language ?? p.language,
        description: live.description ?? p.tagline,
        topics: live.topics?.slice(0, 8) ?? p.topics,
        updatedAt: live.updated_at?.slice(0, 10),
        homepage: live.homepage ?? p.homepage,
        license: live.license?.spdx_id ?? p.license,
      });
      seen.delete(p.fullName);
    } else {
      merged.push({ slug: p.slug, fullName: p.fullName, stars: p.stars, note: "seed" });
    }
  }
  for (const [fullName, live] of seen) {
    merged.push({
      slug: fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      fullName,
      name: fullName.split("/")[1],
      owner: fullName.split("/")[0],
      stars: live.stargazers_count,
      forks: live.forks_count,
      openIssues: live.open_issues_count,
      language: live.language,
      description: live.description,
      topics: live.topics?.slice(0, 8) ?? [],
      updatedAt: live.updated_at?.slice(0, 10),
      homepage: live.homepage,
      license: live.license?.spdx_id,
    });
  }

  writeFileSync(SNAPSHOT, JSON.stringify({ generatedAt: new Date().toISOString(), repos: merged }, null, 2));
  console.log(`\nSnapshot written → ${SNAPSHOT} (${merged.length} repos)`);
  console.log("Load it into the platform by moving it to src/data/github-snapshot.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
