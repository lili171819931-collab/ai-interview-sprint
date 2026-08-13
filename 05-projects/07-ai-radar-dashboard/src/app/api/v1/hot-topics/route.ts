import { NextResponse } from "next/server";
import { queryHotTopics } from "@/lib/intel/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const hot = queryHotTopics();
  return NextResponse.json({
    schemaVersion: 1,
    count: hot.items.length,
    items: hot.items.map((it) => ({
      rank: it.rank,
      id: it.id,
      title: it.title,
      source: { name: it.sourceName },
      links: {
        aihot: it.href.startsWith("http") ? it.href : `${origin}${it.href}`,
        original: it.href.startsWith("http") ? it.href : `${origin}${it.href}`,
        story: it.href.startsWith("http") ? it.href : `${origin}${it.href}`,
      },
      sourceCount: it.sourceCount,
      sourceNames: it.sourceNames,
      latestAt: it.latestAt,
    })),
  });
}
