import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";
import type { FeedItem } from "@/lib/intel/aihot-types";
import { beijingTime } from "@/lib/intel/categories";

export function FeedItemCard({ item, variant = "story" }: { item: FeedItem; variant?: "story" | "plain" }) {
  const score = item.score != null ? Math.round(item.score) : null;
  const showPick = item.selected || item.origin === "aihot";

  return (
    <article className={variant === "story" ? "story-card" : "feed-card space-y-2"}>
      <div className="story-card-top">
        <div className="story-card-meta">
          <span className="zh-source">{item.sourceName}</span>
          {showPick ? <span className="zh-badge-pick">✨ 精选</span> : null}
        </div>
        <div className="story-card-right">
          {score != null ? (
            <span className="zh-score">
              <span className="zh-score-dot" aria-hidden />
              AI 评分 {score}/100
            </span>
          ) : null}
          <span className="story-card-bookmark" aria-hidden>
            <Bookmark size={16} />
          </span>
        </div>
      </div>

      <h3 className="zh-title">
        <Link href={item.localHref}>{item.title}</Link>
      </h3>

      {item.summary ? <p className="zh-summary">{item.summary}</p> : null}

      {item.recommendReason ? (
        <>
          <hr className="story-card-rule" />
          <p className={showPick ? "zh-reason zh-reason-pick" : "zh-reason"}>
            <span className="zh-reason-label">推荐理由：</span>
            {item.recommendReason}
          </p>
        </>
      ) : null}

      <div className="story-card-foot">
        <span>{beijingTime(item.publishedAt || item.discoveredAt)}</span>
        {item.originalUrl ? (
          <a href={item.originalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
            原文 <ExternalLink size={11} aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function FeedItemList({ items }: { items: FeedItem[] }) {
  if (!items.length) {
    return (
      <div className="surface p-6 text-sm text-[var(--muted)]">
        这个时间窗里没有精选。试试「最近 7 天」，或等待下一轮整点更新。
      </div>
    );
  }
  return (
    <div className="story-list">
      {items.map((it) => (
        <FeedItemCard key={`${it.origin}-${it.id}`} item={it} />
      ))}
    </div>
  );
}
