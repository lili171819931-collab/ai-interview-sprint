import { NextResponse } from "next/server";
import { parseFeedQuery, queryFeed } from "@/lib/intel/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = parseFeedQuery({
    mode: url.searchParams.get("mode") || undefined,
    window: url.searchParams.get("window") || undefined,
    category: url.searchParams.get("category") || undefined,
    q: url.searchParams.get("q") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });
  let feed = queryFeed({ ...query, limit: query.limit ?? 50 });
  let note: string | undefined;
  if (query.mode === "selected" && query.q && feed.items.length === 0) {
    feed = queryFeed({ ...query, mode: "all", limit: query.limit ?? 50 });
    if (feed.items.length) note = "selected_empty_fell_back_to_all";
  }
  const origin = url.origin;
  return NextResponse.json({
    schemaVersion: 1,
    query: {
      mode: query.mode,
      category: query.category || null,
      q: query.q || null,
      window: query.window,
      by: "timeline",
      ordering: "timelineDesc",
    },
    items: feed.items.map((it) => ({
      id: it.id,
      title: it.title,
      originalTitle: null,
      summary: it.summary || null,
      source: { name: it.sourceName },
      links: {
        aihot: it.origin === "aihot" ? `${origin}${it.localHref}` : it.localHref.startsWith("http") ? it.localHref : `${origin}${it.localHref}`,
        original: it.originalUrl || null,
      },
      publishedAt: it.publishedAt,
      discoveredAt: it.discoveredAt,
      category: it.category === "general" ? null : it.category,
      score: it.score,
      selected: it.selected,
      recommendReason: it.recommendReason || null,
    })),
    page: { count: feed.items.length, hasMore: false, nextCursor: null },
    ...(note ? { note } : {}),
  });
}
