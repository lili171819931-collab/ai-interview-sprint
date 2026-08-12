import { existsSync, readFileSync } from "fs";
import path from "path";
import { canonicalizeUrl, guessCountry, guessLanguage, makeItemId } from "../../src/lib/intel/id";
import { intelItemSchema } from "../../src/lib/intel/schema";
import type { IntelItem } from "../../src/lib/intel/types";
import type { GlobalHotTopicsSnapshot } from "../../src/lib/global-hot-types";
import type { SourceAdapter } from "./types";

function readSnapshot(root: string): GlobalHotTopicsSnapshot | null {
  const p = path.join(root, "data", "global-hot-topics.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as GlobalHotTopicsSnapshot;
}

function parseHot(heat: string | number | null | undefined): number | string | null {
  if (heat == null) return null;
  if (typeof heat === "number") return heat;
  const n = Number(String(heat).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : heat;
}

export const globalHotAdapter: SourceAdapter = {
  meta: {
    id: "global-hot",
    platform: "multi",
    country: "UN",
    reliability: 0.7,
    kind: "file",
    description: "Agent Reach / Scrapling 国内外热点 data/global-hot-topics.json",
  },

  getMetadata() {
    return this.meta;
  },

  async fetch(ctx) {
    const snap = readSnapshot(ctx.root);
    if (!snap) throw new Error("missing data/global-hot-topics.json — run npm run hot:sync first");
    return snap;
  },

  async normalize(raw) {
    const snap = raw as GlobalHotTopicsSnapshot;
    const fetchedAt = snap.generatedAt || new Date().toISOString();
    const items: IntelItem[] = [];
    for (const group of snap.platforms || []) {
      for (const row of group.items || []) {
        const platform = row.platform || group.name || "unknown";
        const url = canonicalizeUrl(row.url || "");
        items.push({
          id: makeItemId(platform, url, row.title),
          source: `global-hot:${snap.source}`,
          platform,
          title: (row.title || "").trim(),
          url,
          author: "",
          published_at: row.fetched_at || fetchedAt,
          fetched_at: row.fetched_at || fetchedAt,
          category: "general",
          keywords: [],
          summary: "",
          raw_content: "",
          engagement: { rank: row.rank, hot: parseHot(row.heat) },
          rank: row.rank ?? null,
          source_reliability: this.meta.reliability,
          language: guessLanguage(row.title || ""),
          country: guessCountry(platform, row.region || group.region),
          entities: [],
          embedding: null,
        });
      }
    }
    return items.filter((it) => it.title);
  },

  validate(items) {
    return items.filter((it) => intelItemSchema.safeParse(it).success);
  },
};
