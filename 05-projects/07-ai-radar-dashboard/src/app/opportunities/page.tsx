import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  History,
  Lightbulb,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  getOpportunityReportByDate,
  getLatestOpportunityReport,
  listOpportunityArchives,
} from "@/lib/intel/opportunity-report";
import { formatUpdatedAt, shanghaiDay } from "@/lib/intel/time";
import { PageLiveRefresh } from "@/components/PageLiveRefresh";
import type { PulseOpportunityCategory } from "@/lib/pulse-types";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<PulseOpportunityCategory, string> = {
  launches: "产品发布",
  search_trends: "搜索暴涨",
  oss_gap: "开源缺口",
  complaints: "开发者抱怨",
  tech_choice: "技术选型",
  competition: "竞争情报",
  trends: "趋势判断",
  action: "行动触发",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const index = listOpportunityArchives(14);
  const date =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : index[0]?.date || null;
  const today = shanghaiDay();
  const report =
    date && date !== today
      ? getOpportunityReportByDate(date) || getLatestOpportunityReport()
      : getLatestOpportunityReport();

  if (!report) {
    return (
      <div className="page-main space-y-4">
        <h1 className="page-title">AI机会报告</h1>
        <p className="text-sm text-[var(--muted)]">暂无 AI 机会报告。请运行 npm run opp:sync。</p>
      </div>
    );
  }

  const activeDate = report.reportDate;

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">OPPORTUNITY · AI 机会日报</p>
        <h1 className="page-title">AI机会报告</h1>
        <p className="page-sub max-w-2xl">
          每日一条高置信构建方向（Why now + 信号／白话／判断／反方）。BuilderPulse 上游发布当日日报时对齐其方法；
          未发布时由智衡全平台实时数据（AI 热点榜 / GitHub 热点 / Product Hunt / 全域热点）联动生成。
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <span className="tag tag-signal">{report.reportDate}</span>
          <span className="tag">{report.stats.opportunities} 个机会</span>
          <span className="tag">{report.method === "live" ? "实时生成" : "BuilderPulse 方法"}</span>
          {report.method === "live" ? <span className="tag">全平台实时联动</span> : null}
          <span>更新于 {formatUpdatedAt(report.generatedAt)}</span>
          <PageLiveRefresh
            intervalMs={60 * 60 * 1000}
            syncMode="opp"
            syncEveryCycles={1}
            fetchedAt={report.generatedAt}
            labelKey="refresh.opportunity"
          />
          <Link href="/pulse" className="inline-flex items-center gap-1 text-[var(--signal)] hover:underline">
            原简报 <ArrowRight size={12} aria-hidden />
          </Link>
        </div>

        <div className="surface rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)] pr-1">
              <History size={13} aria-hidden /> 历史档：
            </span>
            {index.map((it) => {
              const on = it.date === activeDate;
              return (
                <Link
                  key={it.date}
                  href={`/opportunities?date=${it.date}`}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    on
                      ? "bg-[var(--signal)] text-[var(--panel)] font-semibold"
                      : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--signal)]"
                  }`}
                  title={it.headline || "AI机会报告"}
                >
                  {it.date}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="hero-panel px-5 py-7 sm:px-8 space-y-4">
        <div className="flex items-center gap-2 text-[var(--signal)]">
          <Target size={18} aria-hidden />
          <h2 className="display text-xl font-semibold">今日建议</h2>
          <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            VOL. {report.reportDate.replace(/-/g, ".")}
          </span>
        </div>
        <p className="display text-2xl sm:text-3xl font-semibold leading-snug">{report.buildIdea.title}</p>
        <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
          <span className="text-[var(--amber)] font-medium">为什么是现在：</span>
          {report.buildIdea.whyNow}
        </p>
        <div className="insight-card p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb size={16} className="text-[var(--signal)]" aria-hidden />
            {report.buildIdea.timeboxTitle}
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{report.buildIdea.timeboxDetail}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface rounded-xl p-5 space-y-3">
          <h2 className="display text-lg font-semibold">编辑视角</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{report.editorNote}</p>
        </div>
        <div className="insight-card rounded-xl p-5 space-y-3">
          <h2 className="display text-lg font-semibold">白话简报</h2>
          <p className="text-sm leading-relaxed">{report.plainBrief}</p>
        </div>
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Radar size={18} className="text-[var(--signal)]" aria-hidden />
          <h2 className="display text-lg font-semibold">今日 Top 信号</h2>
        </div>
        <ol className="space-y-2 list-decimal pl-5 text-sm text-[var(--muted)] leading-relaxed">
          {report.topSignals.map((s) => (
            <li key={s.slice(0, 40)}>{s}</li>
          ))}
        </ol>
        {report.evidence.length ? (
          <div className="table-scroll mt-2">
            <table className="lb-table text-sm">
              <thead>
                <tr>
                  <th>证据</th>
                  <th>讨论量</th>
                  <th>白话含义</th>
                </tr>
              </thead>
              <tbody>
                {report.evidence.map((e) => (
                  <tr key={e.label}>
                    <td>{e.label}</td>
                    <td className="text-[var(--muted)]">{e.discussion}</td>
                    <td className="text-[var(--muted)]">{e.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[var(--signal)]" aria-hidden />
          <h2 className="display text-lg font-semibold">三棱镜信号</h2>
        </div>
        <div className="grid gap-4">
          {report.lenses.map((lens) => (
            <article key={lens.id} className="surface rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="display text-base font-semibold">{lens.title}</h3>
                <p className="text-xs text-[var(--muted)]">{lens.blurb}</p>
              </div>
              <ol className="space-y-3">
                {lens.items.map((it, i) => (
                  <li key={`${lens.id}-${i}`} className="flex gap-3">
                    <span className="hot-topic-rank">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 space-y-1">
                      {it.href ? (
                        <a href={it.href} target="_blank" rel="noreferrer" className="hot-topic-title">
                          <span>{it.title}</span>
                          <ExternalLink size={12} className="shrink-0 opacity-55 mt-1" aria-hidden />
                        </a>
                      ) : (
                        <p className="text-sm font-medium">{it.title}</p>
                      )}
                      <p className="hot-topic-meta">
                        {it.meta}
                        {it.note ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="text-[var(--amber)]">{it.note}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--ai-accent)]" aria-hidden />
          <h2 className="display text-lg font-semibold">发现机会</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {report.opportunities.map((op) => (
            <article key={op.id} className="surface rounded-xl px-5 py-4 space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="tag tag-signal">{CATEGORY_LABEL[op.category]}</span>
                <h3 className="font-semibold text-sm">{op.title}</h3>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                <span className="text-[var(--signal)]">信号：</span>
                {op.signal}
              </p>
              <p className="text-sm leading-relaxed">
                <span className="text-[var(--amber)]">白话：</span>
                {op.plainSpeak}
              </p>
              {op.judgment ? (
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  <span className="text-[var(--signal)]">关键判断：</span>
                  {op.judgment}
                </p>
              ) : null}
              {op.counterpoint ? (
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  <span className="text-[var(--amber)]">反向视角：</span>
                  {op.counterpoint}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {report.trackRecord.length ? (
        <section className="surface rounded-xl p-5 space-y-3">
          <h2 className="display text-lg font-semibold">7 天命中记录</h2>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {report.trackRecord.map((t) => (
              <li key={t.date}>
                <span className="text-[var(--text)] font-medium">{t.date}</span>
                {" · "}
                {t.reportPath ? (
                  <a href={t.reportPath} target="_blank" rel="noreferrer" className="hover:text-[var(--signal)]">
                    {t.summary}
                  </a>
                ) : (
                  t.summary
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="space-y-2">
        <p className="text-[11px] text-[var(--muted)] leading-relaxed">{report.methodNote}</p>
        <p className="text-[11px] text-[var(--muted)]">{report.attribution}</p>
        <div className="flex flex-wrap gap-2 text-sm pt-1">
          <Link href="/ranking" className="tag hover:border-[var(--signal)]">
            AI热点榜
          </Link>
          <Link href="/hot" className="tag hover:border-[var(--signal)]">
            国内外全域热点
          </Link>
          <Link href="/pulse" className="tag hover:border-[var(--signal)]">
            原简报
          </Link>
          {report.sourceUrl ? (
            <a
              href={report.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="tag hover:border-[var(--signal)]"
            >
              BuilderPulse 原文
            </a>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
