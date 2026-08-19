"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { FeedItem } from "@/lib/intel/aihot-types";
import { beijingTime, timelineMs } from "@/lib/intel/categories";
import { shanghaiDay } from "@/lib/intel/time";
import { RelativeTime } from "@/components/i18n/RelativeTime";
import { Tx } from "@/components/i18n/Tx";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { tr, useTranslatedTexts } from "@/components/i18n/useTranslatedTexts";
import type { MessageKey } from "@/lib/i18n/messages";

function itemAxisIso(item: FeedItem, fallback: string): string {
  const ms = timelineMs(item.publishedAt, item.discoveredAt, fallback);
  return new Date(ms).toISOString();
}

function dayKey(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return shanghaiDay();
  return shanghaiDay(new Date(t).toISOString());
}

function dayHeading(ymd: string, locale: "zh" | "en"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || (locale === "en" ? "Unknown date" : "未知日期");
  const date = new Date(`${ymd}T12:00:00+08:00`);
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Shanghai",
    }).format(date);
  }
  const [y, m, d] = ymd.split("-");
  let weekday = "";
  try {
    weekday = new Intl.DateTimeFormat("zh-CN", {
      weekday: "short",
      timeZone: "Asia/Shanghai",
    }).format(date);
  } catch {
    weekday = "";
  }
  return `${Number(y)}年${Number(m)}月${Number(d)}日${weekday ? ` · ${weekday}` : ""}`;
}

function originKey(origin: FeedItem["origin"]): MessageKey {
  if (origin === "twitter") return "feed.origin.twitter";
  if (origin === "hot") return "feed.origin.hot";
  if (origin === "intel") return "feed.origin.intel";
  if (origin === "event") return "feed.origin.event";
  return "feed.origin.aihot";
}

/** AI动态：按时间线流动展示（日分组 + 纵向时间轴），最新在上 */
export function FeedTimeline({ items }: { items: FeedItem[] }) {
  const { locale } = useLocale();
  const txMap = useTranslatedTexts(items.flatMap((it) => [it.title, it.summary, it.recommendReason]));

  if (!items.length) {
    return (
      <div className="surface p-6 text-sm text-[var(--muted)]">
        <Tx k="feed.empty.all" />
      </div>
    );
  }

  const fallback = new Date().toISOString();
  const sorted = [...items].sort(
    (a, b) => timelineMs(b.publishedAt, b.discoveredAt, fallback) - timelineMs(a.publishedAt, a.discoveredAt, fallback),
  );

  const groups: { day: string; items: FeedItem[] }[] = [];
  for (const it of sorted) {
    const day = dayKey(itemAxisIso(it, fallback));
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(it);
    else groups.push({ day, items: [it] });
  }

  return (
    <div className="tl-flow">
      {groups.map((g) => (
        <section key={g.day} className="tl-day">
          <header className="tl-day-head">
            <span className="tl-day-dot" aria-hidden />
            <h2 className="tl-day-title">{dayHeading(g.day, locale)}</h2>
            <span className="tl-day-count">
              <Tx k="feed.items" values={{ n: g.items.length }} />
            </span>
          </header>
          <ol className="tl-rail">
            {g.items.map((it) => {
              const when = itemAxisIso(it, fallback);
              const showPick = it.selected || it.origin === "aihot";
              return (
                <li key={`${it.origin}-${it.id}`} className="tl-item">
                  <div className="tl-spine" aria-hidden>
                    <span className="tl-node" />
                  </div>
                  <article className="tl-card">
                    <div className="tl-meta">
                      <span title={beijingTime(when)}>
                        <RelativeTime iso={when} />
                      </span>
                      <span className="zh-source">{it.sourceName}</span>
                      <span className={it.origin === "twitter" ? "tw-badge" : "tl-origin"}>
                        <Tx k={originKey(it.origin)} />
                      </span>
                      {showPick ? (
                        <span className="zh-badge-pick">
                          <Tx k="feed.pick" />
                        </span>
                      ) : null}
                      {it.score != null ? (
                        <span className="zh-score">
                          <span className="zh-score-dot" aria-hidden />
                          <Tx k="feed.score" values={{ n: Math.round(it.score) }} />
                        </span>
                      ) : null}
                    </div>
                    <h3 className="zh-title tl-title-size">
                      {it.localHref.startsWith("http") ? (
                        <a href={it.localHref} target="_blank" rel="noreferrer">
                          {tr(txMap, it.title)}
                        </a>
                      ) : (
                        <Link href={it.localHref}>{tr(txMap, it.title)}</Link>
                      )}
                    </h3>
                    {it.summary ? <p className="zh-summary">{tr(txMap, it.summary)}</p> : null}
                    {it.recommendReason ? (
                      <p className={showPick ? "zh-reason zh-reason-pick" : "zh-reason"}>
                        <span className="zh-reason-label">
                          <Tx k="feed.reason" />
                        </span>
                        {tr(txMap, it.recommendReason)}
                      </p>
                    ) : null}
                    {it.originalUrl ? (
                      <a href={it.originalUrl} target="_blank" rel="noreferrer" className="tl-ext">
                        <Tx k="feed.source" /> <ExternalLink size={11} aria-hidden />
                      </a>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
