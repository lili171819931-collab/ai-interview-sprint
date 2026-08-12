import Link from "next/link";
import { Archive, ArrowRight, CalendarDays } from "lucide-react";
import { RefreshControls } from "@/components/RefreshControls";
import { getHistoryIndex } from "@/lib/history-data";

export default function HistoryPage() {
  const index = getHistoryIndex();

  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,182,115,0.35)] bg-[var(--signal-dim)] px-3 py-1 text-xs text-[#b7f0d1]">
          <Archive size={14} aria-hidden />
          日更归档 · 过往报告可回看
        </div>
        <h1 className="display text-3xl sm:text-4xl font-semibold">历史报告</h1>
        <p className="text-[var(--muted)] max-w-3xl leading-relaxed">
          每次日更前会把当前快照按报告日期归档到 <code className="text-[var(--text)]">data/archive/YYYY-MM-DD/</code>。
          今日看板继续读最新 JSON；这里保留过往，避免「一刷新就丢昨天」。
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag tag-signal">{index.timezone}</span>
          <span className="tag">归档日 {index.days.length}</span>
          <span className="tag">索引更新 {index.updatedAt || "—"}</span>
        </div>
        <RefreshControls defaultMode="quick" />
      </div>

      {index.days.length === 0 ? (
        <section className="surface p-6 space-y-3">
          <p className="text-sm text-[var(--muted)]">
            还没有归档。点击「立即日更」或运行 <code className="text-[var(--text)]">npm run daily:refresh</code>，
            会先归档现有（含昨天）快照，再生成今日数据。
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {index.days.map((day) => (
            <Link
              key={day.date}
              href={`/history/${day.date}`}
              className="surface p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:border-[var(--signal)] transition-colors"
            >
              <div className="flex items-center gap-2 shrink-0">
                <CalendarDays size={18} className="text-[var(--signal)]" aria-hidden />
                <span className="display text-xl font-semibold">{day.date}</span>
              </div>
              <div className="flex-1 text-sm text-[var(--muted)] space-y-1">
                <p>
                  文件 {day.files.length} · 归档于 {day.archivedAt}
                </p>
                <p className="flex flex-wrap gap-2">
                  {day.summary.radarSignals != null ? (
                    <span className="tag">雷达信号 {day.summary.radarSignals}</span>
                  ) : null}
                  {day.summary.sourcesOk != null ? (
                    <span className="tag">
                      热点源 {day.summary.sourcesOk}/{day.summary.sourcesTotal ?? "?"}
                    </span>
                  ) : null}
                  {day.summary.pulseReportDate ? (
                    <span className="tag">Pulse {day.summary.pulseReportDate}</span>
                  ) : null}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm text-[var(--signal)]">
                查看 <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
