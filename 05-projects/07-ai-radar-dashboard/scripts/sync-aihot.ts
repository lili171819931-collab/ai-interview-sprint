/**
 * Pull AIHOT public v1 (anonymous, no API key) into data/aihot/*.json
 *
 * Personal / interview / internal use only. Do not proxy, white-label, or
 * redistribute AIHOT data as a commercial product. See
 * https://aihot.virxact.com/terms
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { cacheStory, storiesDir } from "../src/lib/intel/story-data";
import path from "path";
import { buildRecommendReason } from "../src/lib/intel/recommend";

const root = path.join(__dirname, "..");
const outDir = path.join(root, "data", "aihot");
const BASE = "https://aihot.virxact.com";
const UA = "ai-radar-dashboard/0.2 (+https://github.com/lili171819931-collab/ai-interview-sprint; personal-noncommercial)";

type Json = Record<string, unknown>;
type ReasonItem = {
  id?: string;
  title?: string;
  summary?: string | null;
  category?: string | null;
  score?: number | null;
  selected?: boolean;
  recommendReason?: string | null;
};

function readPrevReasons(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const p = path.join(outDir, "items.json");
    if (!existsSync(p)) return map;
    const snap = JSON.parse(readFileSync(p, "utf8")) as { items?: ReasonItem[] };
    for (const it of snap.items || []) {
      if (!it?.id || looksLikeBadReason(it.recommendReason)) continue;
      map.set(it.id, String(it.recommendReason).trim());
    }
  } catch {
    // ignore
  }
  return map;
}

async function getJson(pathname: string): Promise<Json> {
  const url = `${BASE}${pathname}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${pathname} HTTP ${res.status} ${body.slice(0, 180)}`);
  }
  return (await res.json()) as Json;
}

function write(name: string, payload: unknown) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, name), JSON.stringify(payload, null, 2), "utf8");
}

async function fetchRecommendReason(itemId: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/items/${itemId}`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Bot challenge pages are tiny and contain no article markup.
    if (html.length < 4000 || /EO_Bot_Ssid|cf-challenge|Just a moment/i.test(html)) return null;
    const m =
      html.match(/class=["']m-detail-reason-text["'][^>]*>([^<]{8,500})</) ||
      html.match(/推荐理由<\/span>\s*<p[^>]*>([^<]{8,500})</) ||
      html.match(/"m-detail-reason-text","children":"([^"\\]{8,500})"/);
    const text = (m?.[1] || "")
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\"/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 8 || text.includes("{") || text.includes("margin:") || text.startsWith(":")) return null;
    return text;
  } catch {
    return null;
  }
}

function looksLikeBadReason(text: string | null | undefined): boolean {
  const t = (text || "").trim();
  if (t.length < 8) return true;
  if (t.includes("{") || t.includes("margin:") || t.startsWith(":")) return true;
  if (/first-child|last-child|m-detail-html/.test(t)) return true;
  return false;
}

async function enrichRecommendReasons(items: ReasonItem[]) {
  const prev = readPrevReasons();
  for (const it of items) {
    if (!it?.id) continue;
    if (!looksLikeBadReason(it.recommendReason)) continue;
    const cached = prev.get(it.id);
    if (cached) it.recommendReason = cached;
  }

  const targets = items.filter((it) => it?.id && looksLikeBadReason(it.recommendReason));
  const concurrency = 3;
  for (let i = 0; i < targets.length; i += concurrency) {
    const chunk = targets.slice(i, i + concurrency);
    const reasons = await Promise.all(chunk.map((it) => fetchRecommendReason(String(it.id))));
    chunk.forEach((it, idx) => {
      if (reasons[idx]) it.recommendReason = reasons[idx];
      else if (looksLikeBadReason(it.recommendReason)) {
        const cached = it.id ? prev.get(it.id) : null;
        it.recommendReason =
          cached ||
          buildRecommendReason({
            title: it.title || "",
            summary: it.summary,
            category: it.category,
            score: it.score,
            selected: it.selected !== false,
          });
      }
    });
    if (i + concurrency < targets.length) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}

type HotItem = { id?: string; links?: { story?: string | null } };

function storyPublicIds(items: HotItem[]): string[] {
  const ids: string[] = [];
  for (const it of items) {
    const m = (it.links?.story || "").match(
      /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/,
    );
    if (m) ids.push(m[1].toLowerCase());
  }
  return [...new Set(ids)];
}

async function syncStories(publicIds: string[], errors: string[]): Promise<number> {
  const todo = publicIds.filter((id) => !existsSync(`${storiesDir()}/${id}.json`));
  let ok = 0;
  const concurrency = 3;
  for (let i = 0; i < todo.length; i += concurrency) {
    const chunk = todo.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async (id) => {
        try {
          const res = await fetch(`${BASE}/api/v1/stories/${id}`, {
            headers: { Accept: "application/json", "User-Agent": UA },
          });
          if (!res.ok) return { id, ok: false as const, msg: `HTTP ${res.status}` };
          const json = (await res.json()) as { story?: { publicId?: string } };
          if (!json.story || !json.story.publicId) return { id, ok: false as const, msg: "empty story" };
          cacheStory(json.story as unknown as import("../src/lib/intel/story-types").AihotStory);
          return { id, ok: true as const };
        } catch (err) {
          return { id, ok: false as const, msg: err instanceof Error ? err.message : String(err) };
        }
      }),
    );
    for (const r of results) {
      if (r.ok) ok += 1;
      else errors.push(`story ${r.id}: ${r.msg}`);
    }
    if (i + concurrency < todo.length) await new Promise((r) => setTimeout(r, 200));
  }
  return ok;
}

async function main() {
  if (process.env.INTEL_OFFLINE === "1" || process.env.RADAR_OFFLINE === "1" || process.env.AIHOT_SKIP === "1") {
    console.log("[aihot:sync] skipped (offline / AIHOT_SKIP=1)");
    return;
  }

  const fetchedAt = new Date().toISOString();
  const errors: string[] = [];

  try {
    const hot = await getJson("/api/v1/hot-topics");
    write("hot-topics.json", {
      schemaVersion: 1,
      fetchedAt,
      count: Array.isArray(hot.items) ? hot.items.length : 0,
      items: hot.items || [],
    });
    console.log(`[aihot:sync] hot-topics ${(hot.items as unknown[] | undefined)?.length ?? 0}`);
    const storyIds = storyPublicIds((hot.items as HotItem[]) || []);
    if (storyIds.length) {
      const synced = await syncStories(storyIds, errors);
      console.log(`[aihot:sync] stories ${synced}/${storyIds.length}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`hot-topics: ${msg}`);
    console.warn("[aihot:sync] hot-topics failed", msg);
  }

  const merged: unknown[] = [];
  const seen = new Set<string>();
  for (const window of ["24h", "7d"] as const) {
    try {
      const data = await getJson(`/api/v1/items?mode=selected&window=${window}&limit=30`);
      for (const it of (data.items as { id?: string }[]) || []) {
        if (!it?.id || seen.has(it.id)) continue;
        seen.add(it.id);
        merged.push(it);
      }
      console.log(`[aihot:sync] items ${window} ${(data.items as unknown[] | undefined)?.length ?? 0}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`items ${window}: ${msg}`);
      console.warn(`[aihot:sync] items ${window} failed`, msg);
    }
  }
  if (merged.length) {
    await enrichRecommendReasons(merged as { id?: string; recommendReason?: string | null }[]);
    const withReason = (merged as { recommendReason?: string | null }[]).filter((it) => it.recommendReason).length;
    write("items.json", {
      schemaVersion: 1,
      fetchedAt,
      query: { mode: "selected", window: "7d", category: null, q: null },
      items: merged,
    });
    console.log(`[aihot:sync] recommendReason enriched ${withReason}/${merged.length}`);
  }

  try {
    const daily = await getJson("/api/v1/dailies/latest");
    write("daily.json", {
      schemaVersion: 1,
      fetchedAt,
      report: daily.report || null,
    });
    const date = (daily.report as { date?: string } | undefined)?.date;
    console.log(`[aihot:sync] daily ${date || "ok"}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`daily: ${msg}`);
    console.warn("[aihot:sync] daily failed", msg);
  }

  try {
    const index = await getJson("/api/v1/dailies?limit=14");
    write("dailies-index.json", {
      schemaVersion: 1,
      fetchedAt,
      count: index.count || (Array.isArray(index.items) ? index.items.length : 0),
      items: index.items || [],
    });
    console.log(`[aihot:sync] dailies-index ${(index.items as unknown[] | undefined)?.length ?? 0}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`dailies-index: ${msg}`);
    console.warn("[aihot:sync] dailies-index failed", msg);
  }

  write("meta.json", {
    fetchedAt,
    source: BASE,
    terms: "https://aihot.virxact.com/terms",
    licenseNote:
      "AIHOT 数据仅用于个人非商业 / 面试演示；不得公开镜像、转售或作为对外商业产品。Skill MIT 不覆盖数据。",
    errors,
  });

  if (!merged.length && errors.length) {
    console.error("[aihot:sync] no usable payload");
    process.exit(1);
  }
  console.log(`[aihot:sync] wrote data/aihot · items=${merged.length} errors=${errors.length}`);
}

main().catch((err) => {
  console.error("[aihot:sync] fatal", err);
  process.exit(1);
});
