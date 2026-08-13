import { aihotHotToRank, aihotItemToFeed, getAihotDailySnapshot, getAihotHotSnapshot, getAihotItemsSnapshot } from "@/lib/intel/aihot-data";
import { enrichHotRank } from "@/lib/intel/hot-rank";
import type { FeedItem, HotRankItem } from "@/lib/intel/aihot-types";
import {
  isAiSelectedBlob,
  isFeedCategory,
  mapToFeedCategory,
  timelineMs,
  toIsoOr,
  windowStartMs,
  type FeedCategory,
  type FeedMode,
  type FeedWindow,
} from "@/lib/intel/categories";
import { getEventsView, getTopEvents } from "@/lib/intel/events-data";
import { getItemsSnapshot } from "@/lib/intel/items-data";
import { buildRecommendReason, normalizeScore } from "@/lib/intel/recommend";
import type { IntelEvent, IntelItem } from "@/lib/intel/types";

export type FeedQuery = {
  mode: FeedMode;
  window: FeedWindow;
  category: "" | Exclude<FeedCategory, "general">;
  q: string;
  limit?: number;
};

export type FeedResult = {
  query: FeedQuery;
  items: FeedItem[];
  count: number;
  generatedAt: string;
  sources: { aihot: boolean; intel: boolean; events: boolean };
};

function eventToFeed(e: IntelEvent, generatedAt: string): FeedItem {
  const sample = e.sample_items.find((s) => s.url) || e.analysis?.sources?.find((s) => s.url);
  const summary = e.analysis?.one_liner || "";
  const category = mapToFeedCategory(e.categories[0], e.representative_title, summary);
  const score = normalizeScore(e.heat_score);
  const selected = isAiSelectedBlob(e.representative_title, e.categories.join(" "), summary);
  const publishedAt = toIsoOr(e.last_seen, generatedAt);
  const discoveredAt = toIsoOr(e.last_seen || e.first_seen, generatedAt);
  return {
    id: e.id,
    title: e.representative_title,
    summary,
    sourceName: e.platforms[0] || "radar",
    originalUrl: sample?.url || "",
    localHref: `/events/${e.id}`,
    publishedAt,
    discoveredAt,
    category,
    selected,
    origin: "event",
    eventId: e.id,
    score,
    recommendReason:
      (e.analysis?.why || "").trim() ||
      buildRecommendReason({
        title: e.representative_title,
        summary,
        category,
        score,
        selected,
      }),
  };
}

function intelToFeed(it: IntelItem, generatedAt: string): FeedItem {
  const summary = (it.summary || "").trim();
  const category = mapToFeedCategory(it.category, it.title, summary);
  const selected = isAiSelectedBlob(it.title, it.category, summary);
  const hotRaw = it.engagement?.hot;
  const hotNum =
    typeof hotRaw === "number"
      ? hotRaw
      : Number(String(hotRaw ?? "").replace(/[^\d.]/g, ""));
  const score = normalizeScore(
    Number.isFinite(hotNum) && hotNum > 0
      ? Math.min(100, Math.round(Math.log10(Math.max(10, hotNum)) * 25))
      : null,
  );
  const publishedAt = toIsoOr(it.published_at, generatedAt);
  const discoveredAt = toIsoOr(it.fetched_at || it.published_at, generatedAt);
  return {
    id: it.id,
    title: it.title,
    summary,
    sourceName: it.platform,
    originalUrl: it.url,
    localHref: it.url || `/`,
    publishedAt,
    discoveredAt,
    category,
    selected,
    origin: "intel",
    score,
    recommendReason: buildRecommendReason({
      title: it.title,
      summary,
      category,
      score,
      selected,
    }),
  };
}

function applyFilters(items: FeedItem[], query: FeedQuery, generatedAt: string): FeedItem[] {
  const start = windowStartMs(query.window);
  const q = query.q.trim().toLowerCase();
  return items.filter((it) => {
    const axis = timelineMs(it.publishedAt, it.discoveredAt, generatedAt);
    if (axis < start) return false;
    if (query.category && it.category !== query.category) return false;
    if (q) {
      const blob = `${it.title} ${it.summary} ${it.sourceName}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

function dedupeFeed(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  const out: FeedItem[] = [];
  for (const it of items) {
    const key = (it.originalUrl || it.title).trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export function parseFeedQuery(sp: {
  window?: string;
  category?: string;
  q?: string;
  mode?: string;
  limit?: string;
}): FeedQuery {
  const window: FeedWindow = sp.window === "7d" ? "7d" : "24h";
  const category = sp.category && isFeedCategory(sp.category) ? sp.category : "";
  const mode: FeedMode = sp.mode === "all" ? "all" : "selected";
  const limitRaw = Number(sp.limit);
  return {
    mode,
    window,
    category,
    q: (sp.q || "").trim().slice(0, 200),
    limit: Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : undefined,
  };
}

export function queryFeed(query: FeedQuery): FeedResult {
  const aihotSnap = getAihotItemsSnapshot();
  const intelSnap = getItemsSnapshot();
  const eventsView = getEventsView();
  const generatedAt =
    aihotSnap?.fetchedAt || intelSnap?.generatedAt || eventsView.snapshot.generatedAt || new Date().toISOString();

  const aihotItems = (aihotSnap?.items || []).map(aihotItemToFeed);
  const eventItems = eventsView.snapshot.events.map((e) => eventToFeed(e, generatedAt));
  const intelItems = (intelSnap?.items || []).map((it) => intelToFeed(it, generatedAt));

  let pool: FeedItem[];
  if (query.mode === "selected") {
    const curated = aihotItems.filter((it) => it.selected && it.summary.length >= 12);
    const fallbackEvents = eventItems.filter((it) => it.selected && it.summary.length >= 8);
    pool = curated.length ? curated : fallbackEvents;
  } else {
    pool = [...aihotItems, ...eventItems, ...intelItems];
  }

  const filtered = applyFilters(dedupeFeed(pool), query, generatedAt).sort(
    (a, b) => timelineMs(b.publishedAt, b.discoveredAt, generatedAt) - timelineMs(a.publishedAt, a.discoveredAt, generatedAt),
  );
  const limit = query.limit ?? (query.mode === "selected" ? 40 : 60);
  const items = filtered.slice(0, limit);

  return {
    query,
    items,
    count: items.length,
    generatedAt,
    sources: {
      aihot: Boolean(aihotSnap?.items.length),
      intel: Boolean(intelSnap?.items.length),
      events: eventsView.fromFile,
    },
  };
}

export function queryHotTopics(): { items: HotRankItem[]; generatedAt: string; source: "aihot" | "events" } {
  const aihot = getAihotHotSnapshot();
  if (aihot?.items.length) {
    return { items: aihotHotToRank(aihot.items).slice(0, 10), generatedAt: aihot.fetchedAt, source: "aihot" };
  }
  const top = getTopEvents(10);
  const generatedAt = getEventsView().snapshot.generatedAt;
  const items: HotRankItem[] = top.map((e, i) =>
    enrichHotRank({
      rank: i + 1,
      id: e.id,
      title: e.representative_title,
      sourceName: e.platforms[0] || "radar",
      sourceCount: e.source_count,
      signalCount: e.source_count,
      sourceNames: e.platforms,
      latestAt: e.last_seen,
      href: `/events/${e.id}`,
      origin: "event",
    }),
  );
  return { items, generatedAt, source: "events" };
}

export function queryDailyBundle() {
  const aihot = getAihotDailySnapshot();
  return {
    aihot: aihot?.report || null,
    aihotFetchedAt: aihot?.fetchedAt || null,
  };
}

export function getFeedItemById(id: string): FeedItem | null {
  const aihot = getAihotItemsSnapshot()?.items.find((it) => it.id === id);
  if (aihot) return aihotItemToFeed(aihot);
  const events = getEventsView().snapshot.events.find((e) => e.id === id);
  if (events) return eventToFeed(events, getEventsView().snapshot.generatedAt);
  return null;
}
