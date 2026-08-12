import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { TrendStatusTag } from "@/components/intel/EventCard";
import type { IntelEvent } from "@/lib/intel/types";

export function EventDetail({ event }: { event: IntelEvent }) {
  const a = event.analysis;
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <TrendStatusTag status={event.trend_status} />
          <span className="tag">热度 {event.heat_score}</span>
          <span className="tag">velocity {event.velocity}</span>
          <span className="tag">
            {event.platform_count} 平台 · {event.source_count} 来源
          </span>
          {a ? (
            <span className="tag">
              置信 {a.confidence} · {a.analysisMode}
            </span>
          ) : null}
        </div>
        <h1 className="display text-2xl sm:text-3xl font-semibold leading-snug">
          {event.representative_title}
        </h1>
        {a ? <p className="text-[var(--muted)] text-base leading-relaxed">{a.one_liner}</p> : null}
      </header>

      {a ? (
        <section className="grid md:grid-cols-2 gap-4">
          {[
            ["What", a.what],
            ["Why", a.why],
            ["Impact", a.impact],
            ["Trend", a.trend],
          ].map(([k, v]) => (
            <div key={k} className="surface p-4 space-y-2">
              <h2 className="text-sm font-semibold text-[var(--signal)]">{k}</h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-wrap">{v}</p>
            </div>
          ))}
          <div className="surface p-4 space-y-2 md:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--signal)]">Who</h2>
            <div className="flex flex-wrap gap-2">
              {a.who.length ? (
                a.who.map((w) => (
                  <span key={w} className="tag">
                    {w}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[var(--muted)]">未识别到明确主体</span>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">Score breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {Object.entries(event.score_breakdown).map(([k, v]) => (
            <div key={k} className="surface px-3 py-2 flex justify-between gap-2">
              <span className="text-[var(--muted)]">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">Sources</h2>
        <p className="text-xs text-[var(--muted)]">仅展示抓取得到的真实链接，系统不会编造来源。</p>
        <ul className="space-y-2">
          {(a?.sources?.length ? a.sources : event.sample_items.filter((s) => s.url)).map((s) => (
            <li key={`${s.platform}-${s.url}-${s.title}`} className="surface p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tag">{s.platform}</span>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--signal)] hover:underline inline-flex items-center gap-1"
                  >
                    {s.title} <ExternalLink size={13} aria-hidden />
                  </a>
                ) : (
                  <span>{s.title}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/trends" className="btn btn-ghost">
          趋势雷达
        </Link>
        <Link href="/" className="btn btn-primary">
          返回今日热点
        </Link>
      </div>
    </div>
  );
}
