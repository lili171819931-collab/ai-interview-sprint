import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type {
  AihotDailyIndexItem,
  AihotDailyIndexSnapshot,
  AihotDailyReport,
  AihotDailySnapshot,
  AihotHotSnapshot,
  AihotItem,
  AihotItemsSnapshot,
  FeedItem,
  HotRankItem,
} from "./aihot-types";
import { mapToFeedCategory, toIsoOr } from "./categories";
import { enrichHotRank } from "./hot-rank";
import { buildRecommendReason, normalizeScore } from "./recommend";

const DIR = path.join(process.cwd(), "data", "aihot");

function readJson<T>(file: string): T | null {
  const p = path.join(DIR, file);
  try {
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch (err) {
    console.warn(`[aihot-data] failed to parse ${file}`, err);
    return null;
  }
}

export function getAihotItemsSnapshot(): AihotItemsSnapshot | null {
  return readJson<AihotItemsSnapshot>("items.json");
}

export function getAihotHotSnapshot(): AihotHotSnapshot | null {
  return readJson<AihotHotSnapshot>("hot-topics.json");
}

export function getAihotDailySnapshot(): AihotDailySnapshot | null {
  return readJson<AihotDailySnapshot>("daily.json");
}

export function getAihotDailyIndex(): AihotDailyIndexItem[] {
  const snap = readJson<AihotDailyIndexSnapshot>("dailies-index.json");
  if (snap?.items?.length) return snap.items;
  const latest = getAihotDailySnapshot()?.report;
  if (!latest) return [];
  return [
    {
      date: latest.date,
      generatedAt: latest.generatedAt,
      leadTitle: latest.sections[0]?.items[0]?.title || null,
      leadParagraph: latest.lead || null,
      links: latest.links,
    },
  ];
}

const AIHOT_UA =
  "ai-radar-dashboard/0.2 (+https://github.com/lili171819931-collab/ai-interview-sprint; personal-noncommercial)";

function cacheDailyReport(date: string, report: AihotDailyReport) {
  try {
    const dir = path.join(DIR, "dailies");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, `${date}.json`),
      JSON.stringify({ schemaVersion: 1, fetchedAt: new Date().toISOString(), report }, null, 2),
      "utf8",
    );
  } catch (err) {
    console.warn("[aihot-data] cache daily failed", err);
  }
}

export async function getAihotDailyReport(date?: string): Promise<AihotDailyReport | null> {
  const latestSnap = getAihotDailySnapshot();
  const latest = latestSnap?.report || null;
  const target = date || latest?.date;
  if (!target) return latest;
  if (latest?.date === target) return latest;

  const cached = readJson<AihotDailySnapshot>(`dailies/${target}.json`);
  if (cached?.report) return cached.report;

  try {
    const res = await fetch(`https://aihot.virxact.com/api/v1/dailies/${target}`, {
      headers: { Accept: "application/json", "User-Agent": AIHOT_UA },
      cache: "no-store",
    });
    if (!res.ok) return date ? null : latest;
    const json = (await res.json()) as { report?: AihotDailyReport };
    if (!json.report) return date ? null : latest;
    cacheDailyReport(target, json.report);
    return json.report;
  } catch (err) {
    console.warn("[aihot-data] fetch daily failed", err);
    return date ? null : latest;
  }
}

export function getAihotItemById(id: string): AihotItem | null {
  const snap = getAihotItemsSnapshot();
  return snap?.items.find((it) => it.id === id) || null;
}

export function aihotItemToFeed(it: AihotItem): FeedItem {
  const original = it.links.original || it.links.aihot || "";
  const summary = (it.summary || "").trim();
  const category = mapToFeedCategory(it.category, it.title, summary);
  const score = normalizeScore(it.score);
  const fallback = it.discoveredAt || new Date().toISOString();
  const recommendReason =
    (it.recommendReason || "").trim() ||
    buildRecommendReason({
      title: it.title,
      summary,
      category,
      score,
      selected: it.selected !== false,
    });
  return {
    id: it.id,
    title: it.title,
    summary,
    sourceName: it.source?.name || "AIHOT",
    originalUrl: original,
    localHref: `/items/${it.id}`,
    publishedAt: toIsoOr(it.publishedAt, fallback),
    discoveredAt: toIsoOr(it.discoveredAt, fallback),
    category,
    selected: it.selected !== false,
    origin: "aihot",
    score,
    recommendReason,
    attribution: it.attribution || { name: "AIHOT", url: it.links.aihot || "https://aihot.virxact.com" },
  };
}

function storyPublicIdOf(it: AihotHotSnapshot["items"][number]): string | null {
  const m = (it.links.story || "").match(
    /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/,
  );
  return m ? m[1].toLowerCase() : null;
}

export function aihotHotToRank(items: AihotHotSnapshot["items"]): HotRankItem[] {
  return [...items]
    .sort((a, b) => a.rank - b.rank)
    .map((it) => {
      const storyId = storyPublicIdOf(it);
      return enrichHotRank({
        rank: it.rank,
        id: it.id,
        title: it.title,
        sourceName: it.source?.name || "AIHOT",
        sourceCount: it.sourceCount,
        signalCount: it.signalCount || 0,
        sourceNames: it.sourceNames || [],
        latestAt: it.latestAt,
        // 点击进入本站故事线页（图 2 模式：搜索逻辑 + 故事线 + 推荐理由），不再跳外部 AIHOT 链接
        href: storyId ? `/story/${storyId}` : `/items/${it.id}`,
        storyHref: storyId ? `/story/${storyId}` : null,
        originalUrl: it.links.original || it.links.aihot,
        externalUrl: it.links.story || it.links.aihot,
        origin: "aihot",
        attribution: { name: "AIHOT", url: it.links.aihot || "https://aihot.virxact.com" },
      });
    });
}
