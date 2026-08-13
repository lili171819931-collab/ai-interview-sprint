import { DailyDigestView, type DailyPeriod } from "@/components/intel/DailyDigestView";
import { getAihotDailyIndex, getAihotDailyReport } from "@/lib/intel/aihot-data";
import { getLatestBrief } from "@/lib/intel/briefs-data";
import type { AihotDailyReport } from "@/lib/intel/aihot-types";

export const dynamic = "force-dynamic";

function briefAsReport(): AihotDailyReport | null {
  const brief = getLatestBrief();
  if (!brief) return null;
  return {
    date: brief.reportDate,
    generatedAt: brief.generatedAt,
    links: { aihot: "/briefs" },
    lead: brief.headline,
    sections: [
      {
        label: "TOP 热点",
        items: brief.top.map((e) => ({
          title: e.title,
          summary: e.one_liner,
          source: { name: e.platforms[0] || "radar" },
          links: { aihot: `/events/${e.id}`, original: e.sources[0]?.url || null },
        })),
      },
    ],
  };
}

export default async function BriefsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; period?: string }>;
}) {
  const sp = await searchParams;
  const period: DailyPeriod = sp.period === "weekly" || sp.period === "monthly" ? sp.period : "daily";
  const index = getAihotDailyIndex();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : index[0]?.date || null;
  const report = period === "daily" ? (await getAihotDailyReport(date || undefined)) || briefAsReport() : null;

  return <DailyDigestView period={period} date={date} index={index} report={report} />;
}
