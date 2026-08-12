import {
  generate_report,
  get_fastest_rising,
  get_trending_topics,
} from "@/lib/intel/agent-tools";
import { getEventsByStatus, getEventsView } from "@/lib/intel/events-data";
import { dailyBriefSchema } from "@/lib/intel/schema";
import type { DailyBrief, DailyBriefItem, TrendStatus } from "@/lib/intel/types";

function toBriefItem(e: {
  id: string;
  title: string;
  heat_score: number;
  velocity: number;
  trend_status: string;
  platforms: string[];
  one_liner?: string;
  sources?: { title: string; url: string; platform: string }[];
}): DailyBriefItem {
  return {
    id: e.id,
    title: e.title,
    heat_score: e.heat_score,
    velocity: e.velocity,
    trend_status: e.trend_status as TrendStatus,
    platforms: e.platforms,
    one_liner: e.one_liner || e.title,
    sources: (e.sources || []).filter((s) => s.url).slice(0, 3),
  };
}

export function buildDailyBrief(): DailyBrief {
  const { snapshot } = getEventsView();
  const daily = generate_report("daily");
  const ai = get_trending_topics(5, "ai");
  const rising = get_fastest_rising(5, "all");
  const buckets = getEventsByStatus();
  const statusCounts = Object.fromEntries(
    (Object.keys(buckets) as TrendStatus[]).map((k) => [k, buckets[k].length]),
  );

  const topRaw = ((daily.data as { top?: unknown[] }).top ||
    (daily.data as { events?: unknown[] }).events ||
    []) as Parameters<typeof toBriefItem>[0][];
  const risingRaw = ((rising.data as { events?: unknown[] }).events || []) as Parameters<
    typeof toBriefItem
  >[0][];
  const aiRaw = ((ai.data as { events?: unknown[] }).events || []) as Parameters<
    typeof toBriefItem
  >[0][];

  const top = topRaw.map(toBriefItem);
  const headline =
    top[0]?.one_liner || top[0]?.title || `今日热点简报（${snapshot.eventCount} 事件）`;
  const summary = [
    `快照 ${snapshot.generatedAt} · 事件 ${snapshot.eventCount} · Item ${snapshot.itemCount}`,
    `状态：${Object.entries(statusCounts)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k} ${n}`)
      .join(" · ") || "—"}`,
    top.length ? `TOP1：${top[0].title}` : "暂无聚类事件，请先 npm run intel:refresh",
  ].join("\n");

  const brief: DailyBrief = {
    kind: "daily",
    generatedAt: new Date().toISOString(),
    reportDate: snapshot.reportDate,
    timezone: "Asia/Shanghai",
    headline,
    summary,
    statusCounts,
    top: top.slice(0, 10),
    rising: risingRaw.map(toBriefItem).slice(0, 5),
    aiTop: aiRaw.map(toBriefItem).slice(0, 5),
    dashboardPath: "/briefs",
    eventCount: snapshot.eventCount,
    itemCount: snapshot.itemCount,
  };

  return dailyBriefSchema.parse(brief) as DailyBrief;
}
