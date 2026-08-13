import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { FeedItem } from "@/lib/intel/aihot-types";
import { beijingTime, timelineMs } from "@/lib/intel/categories";
import { formatRelativeZh, shanghaiDay } from "@/lib/intel/time";

function itemAxisIso(item: FeedItem, fallback: string): string {
  const ms = timelineMs(item.publishedAt, item.discoveredAt, fallback);
  return new Date(ms).toISOString();
}

function dayKey(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return shanghaiDay();
  return shanghaiDay(new Date(t).toISOString());
}

function dayHeading(ymd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || "未知日期";
  const [y, m, d] = ymd.split("-");
  let weekday = "";
  try {
    weekday = new Intl.DateTimeFormat("zh-CN", {
      weekday: "short",
      timeZone: "Asia/Shanghai",
    }).format(new Date(`${ymd}T12:00:00+08:00`));
  } catch {
    weekday = "";
  }
  return `${Number(y)}年${Number(m)}月${Number(d)}日${weekday ? ` · ${weekday}` : ""}`;
}

/** 全部动态：按时间线流动展示（日分组 + 纵向时间轴），最新在上 */
export function FeedTimeline({ items }: { items: FeedItem[] }) {
  if (!items.length) {
    return (
      <div className="surface p-6 text-sm text-[var(--muted)]">
        这个时间窗里没有动态。试试「最近 7 天」，或等待下一分钟自动刷新。
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
            <h2 className="tl-day-title">{dayHeading(g.day)}</h2>
            <span className="tl-day-count">{g.items.length} 条</span>
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
                      <time dateTime={when} title={beijingTime(when)}>
                        {formatRelativeZh(when)}
                      </time>
                      <span className="zh-source">{it.sourceName}</span>
                      {showPick ? <span className="zh-badge-pick">✨ 精选</span> : null}
                      {it.score != null ? (
                        <span className="zh-score">
                          <span className="zh-score-dot" aria-hidden />
                          AI 评分 {Math.round(it.score)}/100
                        </span>
                      ) : null}
                    </div>
                    <h3 className="zh-title tl-title-size">
                      <Link href={it.localHref}>{it.title}</Link>
                    </h3>
                    {it.summary ? <p className="zh-summary">{it.summary}</p> : null}
                    {it.recommendReason ? (
                      <p className={showPick ? "zh-reason zh-reason-pick" : "zh-reason"}>
                        <span className="zh-reason-label">推荐理由：</span>
                        {it.recommendReason}
                      </p>
                    ) : null}
                    {it.originalUrl ? (
                      <a
                        href={it.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="tl-ext"
                      >
                        原文 <ExternalLink size={11} aria-hidden />
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
