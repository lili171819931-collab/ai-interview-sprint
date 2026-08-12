import { createHash } from "crypto";
import type { IntelEvent, IntelItem } from "./types";
import { canonicalizeUrl } from "./id";

const STOP_ZH = new Set(
  "的了是在有和与及对为被从到等也都很就还吗呢吧啊啊啊这那哪什么一个一些今天今日最新消息报道".split(""),
);

/** Normalize title for similarity: lower, strip punct, collapse spaces, light zh stop char drop. */
export function normalizeTitle(title: string): string {
  let s = title.toLowerCase();
  s = s.replace(/https?:\/\/\S+/g, " ");
  s = s.replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  // drop single common zh function chars when surrounded
  s = [...s].filter((ch) => !STOP_ZH.has(ch) || /[a-z0-9]/i.test(ch)).join("");
  return s.replace(/\s+/g, "");
}

/** Character bigram Jaccard (works for CJK + Latin). */
export function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // containment boost for short/long pairs
  if (na.length >= 4 && nb.length >= 4) {
    if (na.includes(nb) || nb.includes(na)) return 0.92;
  }
  const grams = (s: string): Set<string> => {
    const g = new Set<string>();
    if (s.length < 2) {
      g.add(s);
      return g;
    }
    for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2));
    return g;
  };
  const A = grams(na);
  const B = grams(nb);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

type ClusterSeed = {
  items: IntelItem[];
  urls: Set<string>;
  titles: string[];
};

/**
 * Greedy clustering:
 * 1) same canonical URL → same cluster
 * 2) title similarity ≥ threshold → merge
 */
export function clusterItems(
  items: IntelItem[],
  opts?: { titleSimilarity?: number },
): IntelItem[][] {
  const threshold = opts?.titleSimilarity ?? 0.72;
  const clusters: ClusterSeed[] = [];

  for (const item of items) {
    const url = canonicalizeUrl(item.url);
    let matched: ClusterSeed | null = null;

    if (url) {
      matched = clusters.find((c) => c.urls.has(url)) || null;
    }

    if (!matched) {
      for (const c of clusters) {
        // compare against representative (first) + up to 2 more titles
        const refs = c.titles.slice(0, 3);
        const sim = Math.max(...refs.map((t) => titleSimilarity(item.title, t)));
        if (sim >= threshold) {
          matched = c;
          break;
        }
      }
    }

    if (matched) {
      matched.items.push(item);
      if (url) matched.urls.add(url);
      matched.titles.push(item.title);
    } else {
      clusters.push({
        items: [item],
        urls: new Set(url ? [url] : []),
        titles: [item.title],
      });
    }
  }

  return clusters.map((c) => c.items);
}

export function pickRepresentativeTitle(items: IntelItem[]): string {
  // prefer shortest non-trivial title among top-ranked
  const sorted = [...items].sort((a, b) => {
    const ra = a.rank ?? 999;
    const rb = b.rank ?? 999;
    if (ra !== rb) return ra - rb;
    return a.title.length - b.title.length;
  });
  return sorted[0]?.title || "Untitled";
}

export function makeEventId(titles: string[], itemIds: string[]): string {
  const key = [...itemIds].sort().join("|") || titles.join("|");
  return createHash("sha1").update(key).digest("hex").slice(0, 16);
}

export function buildEventShell(items: IntelItem[]): Omit<
  IntelEvent,
  "heat_score" | "velocity" | "trend_status" | "score_breakdown" | "user_relevance"
> {
  const platforms = [...new Set(items.map((i) => i.platform))].sort();
  const countries = [...new Set(items.map((i) => i.country))].sort();
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  const times = items.map((i) => i.fetched_at || i.published_at).filter(Boolean).sort();
  const first = times[0] || "";
  const last = times[times.length - 1] || first;
  const title = pickRepresentativeTitle(items);
  const related = items.map((i) => i.id);
  return {
    id: makeEventId([title], related),
    representative_title: title,
    related_items: related,
    platforms,
    countries,
    categories,
    first_seen: first,
    last_seen: last,
    source_count: items.length,
    platform_count: platforms.length,
    sample_items: items.slice(0, 5).map((i) => ({
      id: i.id,
      title: i.title,
      url: i.url,
      platform: i.platform,
      country: i.country,
    })),
  };
}
