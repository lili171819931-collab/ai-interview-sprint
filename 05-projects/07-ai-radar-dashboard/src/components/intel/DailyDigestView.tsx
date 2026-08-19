"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Newspaper } from "lucide-react";
import type { AihotDailyIndexItem, AihotDailyReport } from "@/lib/intel/aihot-types";
import { formatLiteraryDateZh } from "@/lib/intel/time";
import { tr, useTranslatedTexts } from "@/components/i18n/useTranslatedTexts";

const SECTION_EN: Record<string, string> = {
  "模型发布/更新": "MODEL RELEASES",
  "产品发布/更新": "PRODUCT UPDATES",
  "行业动态": "INDUSTRY",
  "论文研究": "RESEARCH",
  "技巧与观点": "INSIGHTS",
  "TOP 热点": "TOP STORIES",
};

export type DailyPeriod = "daily" | "weekly" | "monthly";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function storyCount(report: AihotDailyReport) {
  const n = report.sections.reduce((sum, s) => sum + s.items.length, 0);
  return n + (report.flashes?.length || 0);
}

function readMinutes(count: number) {
  return Math.max(1, Math.round(count * 0.45));
}

function groupByMonth(items: AihotDailyIndexItem[]) {
  const groups: { key: string; label: string; items: AihotDailyIndexItem[] }[] = [];
  for (const it of items) {
    const key = it.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.items.push(it);
    } else {
      const [y, m] = key.split("-");
      groups.push({ key, label: `${y} 年 ${Number(m)} 月`, items: [it] });
    }
  }
  return groups;
}

function dayLabel(ymd: string) {
  return `${Number(ymd.slice(8))}日`;
}

function EntryLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function DailyDigestView({
  period,
  date,
  index,
  report,
}: {
  period: DailyPeriod;
  date: string | null;
  index: AihotDailyIndexItem[];
  report: AihotDailyReport | null;
}) {
  const groups = groupByMonth(index);
  const count = report ? storyCount(report) : 0;
  const when = report ? formatLiteraryDateZh(report.date) : null;
  const txMap = useTranslatedTexts([
    report?.lead || "",
    ...(report?.sections.flatMap((sec) => [sec.label, ...sec.items.flatMap((it) => [it.title, it.summary || ""])]) || []),
    ...index.map((it) => it.leadTitle || ""),
  ]);

  return (
    <div className="daily-shell">
      <aside className="daily-rail">
        <div className="daily-tabs">
          {(
            [
              ["daily", "日报"],
              ["weekly", "周报"],
              ["monthly", "月报"],
            ] as const
          ).map(([id, label]) => (
            <Link
              key={id}
              href={id === "daily" ? "/briefs" : `/briefs?period=${id}`}
              className={period === id ? "daily-tab daily-tab-on" : "daily-tab"}
            >
              {label}
            </Link>
          ))}
        </div>

        {period === "daily" ? (
          groups.map((g) => (
            <div key={g.key} className="daily-month">
              <div className="daily-month-head">
                <span>{g.label}</span>
                <span>{g.items.length} 期</span>
              </div>
              <ul>
                {g.items.map((it) => {
                  const on = it.date === date;
                  return (
                    <li key={it.date}>
                      <Link href={`/briefs?date=${it.date}`} className={on ? "daily-date daily-date-on" : "daily-date"}>
                        <span className="daily-date-num">{dayLabel(it.date)}</span>
                        <span className="daily-date-lead">{tr(txMap, it.leadTitle || "日报")}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        ) : (
          <p className="daily-rail-note">周报与月报目前仅在 AIHOT 网页发布，本地只保留日切成品。</p>
        )}
      </aside>

      <article className="daily-paper">
        {period !== "daily" ? (
          <div className="daily-empty">
            <p className="kicker">{period === "weekly" ? "WEEKLY" : "MONTHLY"}</p>
            <h1 className="page-title">{period === "weekly" ? "周报" : "月报"}</h1>
            <p className="page-sub leading-relaxed">
              正式周报 / 月报尚无公开 API。可到{" "}
              <a
                href={period === "weekly" ? "https://aihot.virxact.com/weekly" : "https://aihot.virxact.com/monthly"}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--signal)] hover:underline"
              >
                AIHOT {period === "weekly" ? "周报" : "月报"}
              </a>{" "}
              阅读原站版本。
            </p>
          </div>
        ) : report && when ? (
          <>
            <header className="daily-masthead">
              <p className="daily-vol">
                VOL. {when.vol} · {count} STORIES · 智衡 DAILY
              </p>
              <h1 className="daily-brand">智衡日报</h1>
              <p className="daily-when">
                {when.literary} {when.weekday} · DAILY · 每早八时
              </p>
              <hr className="daily-rule" />
            </header>

            <section className="daily-highlights">
              <div className="daily-highlights-head">
                <h2>今日看点</h2>
                <p>
                  {count} 篇报道 · 约 {readMinutes(count)} 分钟
                </p>
              </div>
              <ol>
                {report.sections.map((sec, i) => (
                  <li key={sec.label} className="daily-hl">
                    <span className="daily-hl-n">{pad(i + 1)}</span>
                    <div className="min-w-0">
                      <div className="daily-hl-top">
                        <span className="daily-hl-cat">{tr(txMap, sec.label)}</span>
                        <span className="daily-hl-count">{sec.items.length} 篇</span>
                      </div>
                      <p className="daily-hl-lead">{tr(txMap, sec.items[0]?.title || "")}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {report.lead ? <p className="daily-lead">{tr(txMap, report.lead)}</p> : null}

            {report.sections.map((sec, i) => (
              <details key={sec.label} className="daily-sec" open>
                <summary className="daily-sec-head">
                  <div>
                    <p className="daily-sec-title">
                      <span className="daily-sec-n">{pad(i + 1)}</span>
                      {tr(txMap, sec.label)}
                    </p>
                    <p className="daily-sec-en">{SECTION_EN[sec.label] || "SECTION"}</p>
                  </div>
                  <p className="daily-sec-count">
                    {sec.items.length} 篇
                    <span className="daily-sec-caret" aria-hidden />
                  </p>
                </summary>
                <ol className="daily-entries">
                  {sec.items.map((it) => {
                    const href = it.links.aihot || it.links.original || "#";
                    return (
                      <li key={`${sec.label}-${it.title}`} className="daily-entry">
                        <EntryLink href={href} className="zh-title daily-entry-title">
                          <Newspaper size={15} className="daily-entry-icon" aria-hidden />
                          <span>{tr(txMap, it.title)}</span>
                        </EntryLink>
                        {it.summary ? <p className="zh-summary daily-entry-sum">{tr(txMap, it.summary)}</p> : null}
                        <p className="zh-source daily-entry-src">{it.source.name}</p>
                      </li>
                    );
                  })}
                </ol>
              </details>
            ))}
          </>
        ) : (
          <p className="text-sm text-[var(--muted)]">暂无日报。等待下一轮整点自动更新。</p>
        )}
      </article>
    </div>
  );
}
