import { NextResponse } from "next/server";
import { getLatestBrief } from "@/lib/intel/briefs-data";
import { queryDailyBundle } from "@/lib/intel/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const { aihot } = queryDailyBundle();
  if (aihot) {
    return NextResponse.json({ schemaVersion: 1, report: aihot });
  }
  const brief = getLatestBrief();
  if (!brief) {
    return NextResponse.json({ schemaVersion: 1, error: "no_daily" }, { status: 404 });
  }
  return NextResponse.json({
    schemaVersion: 1,
    report: {
      date: brief.reportDate,
      generatedAt: brief.generatedAt,
      links: { aihot: `${origin}/briefs` },
      lead: brief.headline,
      sections: [
        {
          label: "TOP 热点",
          items: brief.top.map((e) => ({
            title: e.title,
            summary: e.one_liner,
            source: { name: e.platforms[0] || "radar" },
            links: {
              aihot: `${origin}/events/${e.id}`,
              original: e.sources[0]?.url || `${origin}/events/${e.id}`,
            },
          })),
        },
      ],
      flashes: brief.rising.map((e) => ({
        title: e.title,
        summary: e.one_liner,
        source: { name: e.platforms[0] || "radar" },
        links: {
          aihot: `${origin}/events/${e.id}`,
          original: e.sources[0]?.url || null,
        },
      })),
    },
  });
}
