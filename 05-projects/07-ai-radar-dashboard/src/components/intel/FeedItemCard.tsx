"use client";

import { Tx } from "@/components/i18n/Tx";
import { tr, useTranslatedTexts } from "@/components/i18n/useTranslatedTexts";
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
          {showPick ? (
            <span className="zh-badge-pick">
              <Tx k="feed.pick" />
            </span>
          ) : null}
        </div>
        <div className="story-card-right">
          {score != null ? (
            <span className="zh-score">
              <span className="zh-score-dot" aria-hidden />
              <Tx k="feed.score" values={{ n: score }} />
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
            <span className="zh-reason-label">
              <Tx k="feed.reason" />
            </span>
            {item.recommendReason}
          </p>
        </>
      ) : null}

      <div className="story-card-foot">
        <span>{beijingTime(item.publishedAt || item.discoveredAt)}</span>
        {item.originalUrl ? (
          <a href={item.originalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
            <Tx k="feed.source" /> <ExternalLink size={11} aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function FeedItemList({ items }: { items: FeedItem[] }) {
  const txMap = useTranslatedTexts(items.flatMap((it) => [it.title, it.summary, it.recommendReason]));
  if (!items.length) {
    return (
      <div className="surface p-6 text-sm text-[var(--muted)]">
        <Tx k="feed.empty.featured" />
      </div>
    );
  }
  return (
    <div className="story-list">
      {items.map((it) => (
        <FeedItemCard
          key={`${it.origin}-${it.id}`}
          item={{
            ...it,
            title: tr(txMap, it.title),
            summary: tr(txMap, it.summary),
            recommendReason: tr(txMap, it.recommendReason),
          }}
        />
      ))}
    </div>
  );
}
