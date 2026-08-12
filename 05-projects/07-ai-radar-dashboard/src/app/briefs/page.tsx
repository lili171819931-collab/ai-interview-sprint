import Link from "next/link";
import { Newspaper } from "lucide-react";
import { TrendStatusTag } from "@/components/intel/EventCard";
import { getLatestBrief } from "@/lib/intel/briefs-data";

export default function BriefsPage() {
  const brief = getLatestBrief();

  return (
    <div className="container py-10 space-y-8 max-w-3xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.45)] bg-[var(--ai-accent-dim)] px-3 py-1 text-xs text-[#d7ccff]">
          <Newspaper size={14} aria-hidden />
          Daily Brief
        </div>
        <h1 className="display text-3xl font-semibold">每日简报</h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          由事件聚类自动生成。推送：配置{" "}
          <code className="text-[var(--text)]">INTEL_FEISHU_WEBHOOK</code> 或{" "}
          <code className="text-[var(--text)]">INTEL_PUSH_WEBHOOK</code> 后于{" "}
          <code className="text-[var(--text)]">intel:refresh</code> 触发。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn btn-ghost">
            今日热点
          </Link>
          <Link href="/ask" className="btn btn-ghost">
            问问 Agent
          </Link>
        </div>
      </div>

      {!brief ? (
        <p className="text-sm text-[var(--muted)]">
          尚无简报。请运行 <code>npm run intel:briefs</code> 或{" "}
          <code>npm run intel:refresh</code>。
        </p>
      ) : (
        <>
          <section className="space-y-2 border-b border-[var(--line)] pb-6">
            <p className="text-xs text-[var(--muted)]">
              {brief.reportDate} · 生成于 {brief.generatedAt} · 事件 {brief.eventCount}
            </p>
            <h2 className="display text-xl font-semibold leading-snug">{brief.headline}</h2>
            <pre className="text-sm text-[var(--muted)] whitespace-pre-wrap font-sans leading-relaxed">
              {brief.summary}
            </pre>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--text)]">TOP 热点</h3>
            <ol className="space-y-3">
              {brief.top.map((e, i) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="text-[var(--muted)] w-5 shrink-0">{i + 1}.</span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <TrendStatusTag status={e.trend_status} />
                      <span className="text-[var(--muted)]">{e.heat_score}</span>
                    </div>
                    <Link href={`/events/${e.id}`} className="text-[var(--text)] hover:underline">
                      {e.title}
                    </Link>
                    <p className="text-[var(--muted)] text-xs">{e.one_liner}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {brief.aiTop.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text)]">AI / 科技</h3>
              <ul className="space-y-2 text-sm">
                {brief.aiTop.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.id}`} className="hover:underline">
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {brief.rising.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text)]">上升近似</h3>
              <ul className="space-y-2 text-sm">
                {brief.rising.map((e) => (
                  <li key={e.id} className="text-[var(--muted)]">
                    <Link href={`/events/${e.id}`} className="text-[var(--text)] hover:underline">
                      {e.title}
                    </Link>
                    <span className="ml-2 text-xs">v={e.velocity}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
