import Link from "next/link";
import type { IntelEvent, TrendStatus } from "@/lib/intel/types";

const STATUS_LABEL: Record<TrendStatus, string> = {
  emerging: "潜力",
  rising: "上升",
  hot: "爆热",
  stable: "平稳",
  cooling: "回落",
  fading: "消退",
};

export function TrendStatusTag({ status }: { status: TrendStatus }) {
  return <span className="tag tag-signal">{STATUS_LABEL[status] || status}</span>;
}

export function EventCard({ event, rank }: { event: IntelEvent; rank?: number }) {
  const a = event.analysis;
  return (
    <article className="surface p-4 sm:p-5 space-y-3 hover:border-[rgba(43,182,115,0.35)] transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            {rank != null ? <span className="tag">#{rank}</span> : null}
            <TrendStatusTag status={event.trend_status} />
            <span className="tag">热度 {event.heat_score}</span>
            <span className="tag">
              {event.platform_count} 平台 · {event.source_count} 条
            </span>
            {event.user_relevance >= 0.55 ? <span className="tag">相关</span> : null}
          </div>
          <h3 className="text-base sm:text-lg font-medium leading-snug">
            <Link href={`/events/${event.id}`} className="hover:text-[var(--signal)]">
              {event.representative_title}
            </Link>
          </h3>
        </div>
      </div>
      {a ? (
        <p className="text-sm text-[var(--muted)] leading-relaxed">{a.one_liner}</p>
      ) : null}
      <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--muted)]">
        {event.platforms.slice(0, 6).map((p) => (
          <span key={p} className="tag">
            {p}
          </span>
        ))}
        {event.countries.map((c) => (
          <span key={c} className="tag">
            {c}
          </span>
        ))}
      </div>
      <Link href={`/events/${event.id}`} className="text-sm text-[var(--signal)] hover:underline">
        查看 What / Why / Sources →
      </Link>
    </article>
  );
}

export function EventsTopList({ events }: { events: IntelEvent[] }) {
  if (!events.length) {
    return (
      <div className="surface p-6 text-sm text-[var(--muted)]">
        暂无事件数据。请运行 <code className="text-[var(--text)]">npm run intel:refresh</code>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {events.map((e, i) => (
        <EventCard key={e.id} event={e} rank={i + 1} />
      ))}
    </div>
  );
}
