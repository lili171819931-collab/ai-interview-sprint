import { canonicalizeUrl, guessCountry, guessLanguage, makeItemId } from "../../src/lib/intel/id";
import { intelItemSchema } from "../../src/lib/intel/schema";
import type { IntelItem } from "../../src/lib/intel/types";
import { fetchFeed } from "../lib/feeds";
import type { SourceAdapter } from "./types";

export type RssHubRoute = {
  /** path after base, e.g. /zhihu/hotlist */
  path: string;
  platform: string;
  country: string;
  category?: string;
  reliability?: number;
};

const DEFAULT_ROUTES: RssHubRoute[] = [
  { path: "/zhihu/hotlist", platform: "zhihu", country: "CN", category: "general" },
  { path: "/bilibili/ranking/0/3/1", platform: "bilibili", country: "CN", category: "entertainment" },
  { path: "/hackernews/best", platform: "hackernews", country: "US", category: "tech" },
  { path: "/github/trending/daily/any", platform: "github", country: "US", category: "tech" },
];

function baseUrl(): string {
  return (process.env.RSSHUB_BASE || "http://127.0.0.1:1200").replace(/\/$/, "");
}

function routes(): RssHubRoute[] {
  const raw = process.env.RSSHUB_ROUTES?.trim();
  if (!raw) return DEFAULT_ROUTES;
  try {
    return JSON.parse(raw) as RssHubRoute[];
  } catch {
    return DEFAULT_ROUTES;
  }
}

export const rsshubAdapter: SourceAdapter = {
  meta: {
    id: "rsshub",
    platform: "rsshub",
    country: "UN",
    reliability: 0.65,
    kind: "rss",
    description: "本机/远程 RSSHub 公开路由（默认 http://127.0.0.1:1200）",
  },

  getMetadata() {
    return this.meta;
  },

  async fetch(ctx) {
    if (ctx.offline) {
      return { mode: "offline", results: [] as { route: RssHubRoute; ok: boolean; items: unknown[]; error?: string }[] };
    }
    const base = baseUrl();
    const list = routes();
    const results: { route: RssHubRoute; ok: boolean; items: { title: string; url?: string; publishedAt?: string; summary?: string }[]; error?: string }[] = [];
    for (const route of list) {
      const url = `${base}${route.path.startsWith("/") ? route.path : `/${route.path}`}`;
      const res = await fetchFeed(url, "rss");
      if (res.ok) {
        results.push({ route, ok: true, items: res.items });
      } else {
        results.push({ route, ok: false, items: [], error: res.error });
      }
    }
    return { mode: "live", base, results };
  },

  async normalize(raw, ctx) {
    const payload = raw as {
      results: {
        route: RssHubRoute;
        ok: boolean;
        items: { title: string; url?: string; publishedAt?: string; summary?: string }[];
      }[];
    };
    const fetchedAt = ctx.now.toISOString();
    const out: IntelItem[] = [];
    for (const block of payload.results || []) {
      if (!block.ok) continue;
      const { route } = block;
      for (const row of block.items) {
        if (!row.title?.trim()) continue;
        const url = canonicalizeUrl(row.url || "");
        out.push({
          id: makeItemId(route.platform, url, row.title),
          source: `rsshub:${route.path}`,
          platform: route.platform,
          title: row.title.trim(),
          url,
          author: "",
          published_at: row.publishedAt || fetchedAt,
          fetched_at: fetchedAt,
          category: route.category || "general",
          keywords: [],
          summary: (row.summary || "").slice(0, 240),
          raw_content: "",
          engagement: { rank: null, hot: null },
          rank: null,
          source_reliability: route.reliability ?? this.meta.reliability,
          language: guessLanguage(row.title),
          country: route.country || guessCountry(route.platform),
          entities: [],
          embedding: null,
        });
      }
    }
    return out;
  },

  validate(items) {
    return items.filter((it) => intelItemSchema.safeParse(it).success);
  },
};
