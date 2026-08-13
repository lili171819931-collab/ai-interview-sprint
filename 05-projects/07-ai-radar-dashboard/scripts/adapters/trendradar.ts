import { readFileSync, existsSync } from "fs";
import path from "path";
import { canonicalizeUrl, guessCountry, guessLanguage, makeItemId } from "../../src/lib/intel/id";
import { intelItemSchema } from "../../src/lib/intel/schema";
import type { IntelItem } from "../../src/lib/intel/types";
import type { TrendRadarSnapshot } from "../../src/lib/trendradar-types";
import type { SourceAdapter } from "./types";

function readSnapshot(root: string): TrendRadarSnapshot | null {
  const p = path.join(root, "data", "trendradar-hot.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as TrendRadarSnapshot;
}

function asIsoClock(raw: string | null | undefined, fallback: string): string {
  const s = (raw || "").trim();
  if (!s || /^\d{1,2}-\d{2}$/.test(s) || /^\d{1,2}:\d{2}$/.test(s)) return fallback;
  const t = Date.parse(s);
  return Number.isNaN(t) ? fallback : new Date(t).toISOString();
}

export const trendradarAdapter: SourceAdapter = {
  meta: {
    id: "trendradar",
    platform: "trendradar",
    country: "CN",
    reliability: 0.75,
    kind: "file",
    description: "本地 TrendRadar SQLite 同步产物 data/trendradar-hot.json",
  },

  getMetadata() {
    return this.meta;
  },

  async fetch(ctx) {
    const snap = readSnapshot(ctx.root);
    if (!snap) throw new Error("missing data/trendradar-hot.json — run npm run trendradar:sync first");
    return snap;
  },

  async normalize(raw) {
    const snap = raw as TrendRadarSnapshot;
    const fetchedAt = snap.generatedAt || new Date().toISOString();
    return snap.items.map((row): IntelItem => {
      const url = canonicalizeUrl(row.url || "");
      return {
        id: makeItemId(row.platformId || row.platformName, url, row.title),
        source: `trendradar:${snap.source}`,
        platform: row.platformId || row.platformName || "unknown",
        title: row.title.trim(),
        url,
        author: "",
        published_at: asIsoClock(row.firstSeen, fetchedAt),
        fetched_at: asIsoClock(row.lastSeen, fetchedAt),
        category: row.aiRelated ? "ai" : "general",
        keywords: row.aiRelated ? ["AI"] : [],
        summary: "",
        raw_content: "",
        engagement: { rank: row.rank, hot: null },
        rank: row.rank ?? null,
        source_reliability: this.meta.reliability,
        language: guessLanguage(row.title),
        country: guessCountry(row.platformId || row.platformName, "国内"),
        entities: [],
        embedding: null,
      };
    });
  },

  validate(items) {
    return items.filter((it) => intelItemSchema.safeParse(it).success);
  },
};
