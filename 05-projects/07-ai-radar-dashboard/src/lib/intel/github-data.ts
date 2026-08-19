import { existsSync, readFileSync } from "fs";
import path from "path";
import { enrichGithubStarItem } from "./github-enrich";
import { GITHUB_CATEGORY_ORDER, type GithubHotCategoryBucket, type GithubHotItem, type GithubHotSnapshot, type GithubStarItem, type GithubStarsSnapshot } from "./github-types";

const STARS_FILE = path.join(process.cwd(), "data", "github-stars.json");
const HOT_FILE = path.join(process.cwd(), "data", "github-hot.json");

function enrichHot(it: GithubHotItem, list: "rising" | "top"): GithubHotItem {
  return {
    ...enrichGithubStarItem(it),
    rank: it.rank,
    list: it.list || list,
    starsDelta: it.starsDelta ?? null,
  };
}

function bucketsFromLegacy(snap: GithubHotSnapshot): GithubHotCategoryBucket[] {
  const topBy = new Map<string, GithubHotItem[]>();
  const riseBy = new Map<string, GithubHotItem[]>();
  for (const it of snap.top || []) {
    const k = it.category || "other";
    topBy.set(k, [...(topBy.get(k) || []), enrichHot(it, "top")]);
  }
  for (const it of snap.rising || []) {
    const k = it.category || "other";
    riseBy.set(k, [...(riseBy.get(k) || []), enrichHot(it, "rising")]);
  }
  return GITHUB_CATEGORY_ORDER.map((id) => ({
    id,
    top: (topBy.get(id) || []).map((it, i) => ({ ...it, rank: i + 1 })),
    rising: (riseBy.get(id) || []).map((it, i) => ({ ...it, rank: i + 1 })),
  }));
}

export function getGithubStarsSnapshot(): GithubStarsSnapshot | null {
  try {
    if (!existsSync(STARS_FILE)) return null;
    const snap = JSON.parse(readFileSync(STARS_FILE, "utf8")) as GithubStarsSnapshot;
    if (!Array.isArray(snap.items)) return null;
    return {
      ...snap,
      items: snap.items.map(enrichGithubStarItem),
    };
  } catch (err) {
    console.warn("[github-data] parse failed", err);
    return null;
  }
}

export function getGithubHotSnapshot(): GithubHotSnapshot | null {
  try {
    if (!existsSync(HOT_FILE)) return null;
    const snap = JSON.parse(readFileSync(HOT_FILE, "utf8")) as GithubHotSnapshot;
    const categories = Array.isArray(snap.categories) && snap.categories.length
      ? snap.categories.map((b) => ({
          id: b.id,
          top: (b.top || []).map((it) => enrichHot(it, "top")),
          rising: (b.rising || []).map((it) => enrichHot(it, "rising")),
        }))
      : bucketsFromLegacy(snap);
    if (!categories.some((b) => b.top.length || b.rising.length)) return null;
    return {
      schemaVersion: 2,
      fetchedAt: snap.fetchedAt,
      categories,
    };
  } catch (err) {
    console.warn("[github-hot-data] parse failed", err);
    return null;
  }
}

export type GithubSearchEntry = {
  id: string;
  name: string;
  fullName: string;
  url: string;
  author: string;
  authorUrl: string;
  description: string;
  stars: number;
  starsDelta: number | null;
  language: string | null;
  topics: string[];
  features: string[];
  homepage: string | null;
  license: string | null;
  openSource: boolean;
  category: string;
};

function toSearchEntry(
  it: GithubStarItem & { starsDelta?: number | null },
): GithubSearchEntry {
  return {
    id: it.id,
    name: it.name,
    fullName: it.fullName,
    url: it.url,
    author: it.author,
    authorUrl: it.authorUrl,
    description: it.description || "",
    stars: it.stars,
    starsDelta: it.starsDelta ?? null,
    language: it.language,
    topics: it.topics || [],
    features: it.features || [],
    homepage: it.homepage,
    license: it.license,
    openSource: it.openSource !== false,
    category: it.category || "other",
  };
}

/** 合并爬取库（收藏 + 热点）为可搜索的去重条目集，供关键字搜索推荐使用 */
export function getGithubSearchLibrary(): GithubSearchEntry[] {
  const byName = new Map<string, GithubSearchEntry>();
  const hot = getGithubHotSnapshot();
  for (const b of hot?.categories || []) {
    for (const it of [...(b.top || []), ...(b.rising || [])]) {
      if (!byName.has(it.fullName)) byName.set(it.fullName, toSearchEntry(it));
    }
  }
  const stars = getGithubStarsSnapshot();
  for (const it of stars?.items || []) {
    if (!byName.has(it.fullName)) byName.set(it.fullName, toSearchEntry(it));
  }
  return [...byName.values()].sort((a, b) => b.stars - a.stars);
}
