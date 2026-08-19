import { existsSync, readFileSync } from "fs";
import path from "path";
import { githubCategoryRank } from "./github-classify";
import { GITHUB_CATEGORY_ORDER, type GithubCategory } from "./github-types";
import type { ProductHuntItem, ProductHuntSnapshot } from "./producthunt-types";

const FILE = path.join(process.cwd(), "data", "producthunt-hot.json");

export function getProductHuntSnapshot(): ProductHuntSnapshot | null {
  try {
    if (!existsSync(FILE)) return null;
    const snap = JSON.parse(readFileSync(FILE, "utf8")) as ProductHuntSnapshot;
    if (!Array.isArray(snap.items)) return null;
    return snap;
  } catch (err) {
    console.warn("[producthunt-data] parse failed", err);
    return null;
  }
}

export type ProductHuntBucket = {
  id: GithubCategory;
  items: ProductHuntItem[];
};

export function getProductHuntBuckets(snap: ProductHuntSnapshot): ProductHuntBucket[] {
  const by = new Map<GithubCategory, ProductHuntItem[]>();
  for (const it of snap.items || []) {
    const list = by.get(it.category) || [];
    list.push(it);
    by.set(it.category, list);
  }
  return GITHUB_CATEGORY_ORDER.map((id) => ({
    id,
    items: (by.get(id) || []).sort((a, b) => b.votes - a.votes || a.rank - b.rank),
  })).filter((b) => b.items.length);
}

export { GITHUB_CATEGORY_ORDER, githubCategoryRank };
