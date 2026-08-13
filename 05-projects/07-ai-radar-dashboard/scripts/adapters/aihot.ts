import { existsSync, readFileSync } from "fs";
import path from "path";
import { canonicalizeUrl, guessCountry, guessLanguage, makeItemId } from "../../src/lib/intel/id";
import { intelItemSchema } from "../../src/lib/intel/schema";
import type { IntelItem } from "../../src/lib/intel/types";
import type { SourceAdapter } from "./types";

type AihotRow = {
  id?: string;
  title: string;
  summary?: string | null;
  source?: { name?: string };
  links?: { original?: string | null; aihot?: string | null };
  publishedAt?: string | null;
  discoveredAt?: string;
  category?: string | null;
};

function readLocal(root: string): AihotRow[] {
  const p = path.join(root, "data", "aihot", "items.json");
  if (!existsSync(p)) return [];
  const snap = JSON.parse(readFileSync(p, "utf8")) as { items?: AihotRow[] };
  return snap.items || [];
}

export const aihotAdapter: SourceAdapter = {
  meta: {
    id: "aihot",
    platform: "aihot",
    country: "UN",
    reliability: 0.88,
    kind: "api",
    description: "AIHOT 公开 v1 精选（个人非商业 / 面试演示，需归属）",
  },

  getMetadata() {
    return this.meta;
  },

  async fetch(ctx) {
    const items = readLocal(ctx.root);
    if (!items.length) {
      throw new Error("missing data/aihot/items.json — run npm run aihot:sync first");
    }
    return { items };
  },

  async normalize(raw, ctx) {
    const payload = raw as { items: AihotRow[] };
    const fetchedAt = ctx.now.toISOString();
    return payload.items.map((row): IntelItem => {
      const url = canonicalizeUrl(row.links?.original || row.links?.aihot || "");
      const title = (row.title || "").trim() || "untitled";
      return {
        id: makeItemId("aihot", url || row.id || title, title),
        source: "aihot:selected",
        platform: row.source?.name || "aihot",
        title,
        url,
        author: row.source?.name || "",
        published_at: row.publishedAt || row.discoveredAt || fetchedAt,
        fetched_at: row.discoveredAt || fetchedAt,
        category: row.category || "ai",
        keywords: ["AIHOT", "AI"],
        summary: (row.summary || "").trim(),
        raw_content: "",
        engagement: { rank: null, hot: null },
        rank: null,
        source_reliability: this.meta.reliability,
        language: guessLanguage(title),
        country: guessCountry(row.source?.name || "aihot"),
        entities: [],
        embedding: null,
      };
    });
  },

  validate(items) {
    return items.filter((it) => intelItemSchema.safeParse(it).success);
  },
};
