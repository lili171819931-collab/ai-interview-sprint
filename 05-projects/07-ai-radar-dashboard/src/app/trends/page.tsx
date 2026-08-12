import Link from "next/link";
import { Activity } from "lucide-react";
import { EventsTopList, TrendStatusTag } from "@/components/intel/EventCard";
import { getEventsByStatus, getEventsView } from "@/lib/intel/events-data";
import type { TrendStatus } from "@/lib/intel/types";

const ORDER: TrendStatus[] = ["emerging", "rising", "hot", "stable", "cooling", "fading"];

export default function TrendsPage() {
  const { snapshot, fromFile } = getEventsView();
  const buckets = getEventsByStatus();

  return (
    <div className="container py-10 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.45)] bg-[var(--ai-accent-dim)] px-3 py-1 text-xs text-[#d7ccff]">
          <Activity size={14} aria-hidden />
          Emerging → Fading
        </div>
        <h1 className="display text-3xl font-semibold">趋势雷达</h1>
        <p className="text-[var(--muted)] max-w-3xl text-sm leading-relaxed">
          基于 TrendScore 的状态分桶。{fromFile ? `快照 ${snapshot.generatedAt}` : "无快照"} · 事件{" "}
          {snapshot.eventCount}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn btn-ghost">
            今日热点
          </Link>
          <Link href="/hot" className="btn btn-ghost">
            原始平台榜
          </Link>
        </div>
      </div>

      {ORDER.map((status) => {
        const list = buckets[status] || [];
        if (!list.length) return null;
        return (
          <section key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendStatusTag status={status} />
              <span className="text-sm text-[var(--muted)]">{list.length} 个事件</span>
            </div>
            <EventsTopList events={list.slice(0, 8)} />
          </section>
        );
      })}
    </div>
  );
}
