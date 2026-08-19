import { NextResponse } from "next/server";
import { getTwitterLiveSnapshot } from "@/lib/intel/twitter-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = getTwitterLiveSnapshot();
  return NextResponse.json({
    schemaVersion: 1,
    fetchedAt: snap?.fetchedAt || null,
    source: snap?.source || null,
    count: snap?.items.length || 0,
    items: (snap?.items || []).slice(0, 40).map((it) => ({
      id: it.id,
      author: it.author,
      handle: it.handle,
      text: it.text,
      url: it.url,
      publishedAt: it.publishedAt,
      fetchedAt: it.fetchedAt,
      kind: it.kind,
    })),
  });
}
