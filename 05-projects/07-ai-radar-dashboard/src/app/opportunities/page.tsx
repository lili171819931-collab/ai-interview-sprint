import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  getOpportunityReportByDate,
  getLatestOpportunityReport,
  listOpportunityArchives,
} from "@/lib/intel/opportunity-report";
import { formatUpdatedAt, shanghaiDay } from "@/lib/intel/time";
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

function dayLabel(ymd: string) {
  return `${Number(ymd.slice(8))}日`;
}

function groupByMonth(items: { date: string; headline?: string }[]) {
  const groups: { key: string; label: string; items: typeof items }[] = [];
  for (const it of items) {
    const key = it.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(it);
    else {
      const [y, m] = key.split("-");
      groups.push({ key, label: `${y} 年 ${Number(m)} 月`, items: [it] });
    }
  }
  return groups;
}

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
      <div className="page-main">
        <p className="text-sm text-[var(--muted)]">暂无 AI 机会报告。请运行 npm run opp:sync。</p>
      </div>
    );
  }

  const groups = groupByMonth(index);
  const activeDate = report.reportDate;

  return (
    <div className="daily-shell">
      <aside className="daily-rail">
        <div className="daily-tabs">
          <span className="daily-tab daily-tab-on">AI机会日报</span>
          <Link href="/pulse" className="daily-tab">
            原简报
          </Link>
          <Link href="/history" className="daily-tab">
            总档
          </Link>
        </div>
        {groups.map((g) => (
          <div key={g.key} className="daily-month">
            <div className="daily-month-head">
              <span>{g.label}</span>
              <span>{g.items.length} 期</span>
            </div>
            <ul>
              {g.items.map((it) => {
                const on = it.date === activeDate;
                return (
                  <li key={it.date}>
                    <Link
                      href={`/opportunities?date=${it.date}`}
                      className={on ? "daily-date daily-date-on" : "daily-date"}
                    >
                      <span className="daily-date-num">{dayLabel(it.date)}</span>
                      <span className="daily-date-lead">{it.headline || "AI机会报告"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="daily-rail-note">
          方法对齐 BuilderPulse：一条建议 + Why now + 信号／白话／判断／反方。日更写入
          data/opportunities/。
        </p>
      </aside>

      <article className="daily-paper space-y-8">
        <header className="daily-masthead">
          <p className="daily-vol">
            VOL. {report.reportDate.replace(/-/g, ".")} · {report.stats.opportunities} OPPORTUNITIES · 智衡
          </p>
          <h1 className="daily-brand">AI机会报告</h1>
          <p className="daily-when">
            {report.reportDate} · BuilderPulse 方法 · 更新于 {formatUpdatedAt(report.generatedAt)}
          </p>
          <hr className="daily-rule" />
        </header>

        <section className="opp-hero space-y-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--signal)]">今日建议</p>
          <h2 className="display text-2xl sm:text-3xl font-semibold leading-snug">{report.buildIdea.title}</h2>
          <p className="text-sm leading-relaxed">
            <span className="text-[var(--amber)] font-medium">为什么是现在：</span>
            {report.buildIdea.whyNow}
          </p>
          <div className="opp-callout space-y-2">
            <p className="text-sm font-semibold">{report.buildIdea.timeboxTitle}</p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{report.buildIdea.timeboxDetail}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="display text-xl font-semibold">编辑视角</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{report.editorNote}</p>
          <blockquote className="opp-quote">{report.plainBrief}</blockquote>
        </section>

        <section className="space-y-3">
          <h2 className="display text-xl font-semibold">今日 Top 信号</h2>
          <ol className="space-y-2 list-decimal pl-5 text-sm text-[var(--muted)] leading-relaxed">
            {report.topSignals.map((s) => (
              <li key={s.slice(0, 40)}>{s}</li>
            ))}
          </ol>
          {report.evidence.length ? (
            <div className="table-scroll mt-4">
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

        <section className="space-y-6">
          <h2 className="display text-xl font-semibold">三棱镜信号</h2>
          {report.lenses.map((lens) => (
            <article key={lens.id} className="opp-lens">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h3 className="display text-lg font-semibold">{lens.title}</h3>
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
        </section>

        <section className="space-y-4">
          <h2 className="display text-xl font-semibold">发现机会</h2>
          <div className="grid gap-4">
            {report.opportunities.map((op) => (
              <article key={op.id} className="opp-card space-y-2">
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
          <section className="space-y-3">
            <h2 className="display text-xl font-semibold">7 天命中记录</h2>
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

        <p className="text-[11px] text-[var(--muted)] leading-relaxed">{report.methodNote}</p>
        <p className="text-[11px] text-[var(--muted)]">{report.attribution}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/ranking" className="tag hover:border-[var(--signal)]">
            AI热点榜
          </Link>
          <Link href="/hot" className="tag hover:border-[var(--signal)]">
            热点分析
          </Link>
          <a
            href={report.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="tag hover:border-[var(--signal)]"
          >
            BuilderPulse 原文
          </a>
        </div>
      </article>
    </div>
  );
}
