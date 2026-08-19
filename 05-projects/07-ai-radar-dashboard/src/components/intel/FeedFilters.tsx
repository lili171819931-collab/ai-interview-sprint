"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { buildQueryString, FEED_CATEGORY_CHIPS, type FeedCategory, type FeedWindow } from "@/lib/intel/categories";
import type { MessageKey } from "@/lib/i18n/messages";

export function FeedFilters({
  action,
  window,
  category,
  q,
}: {
  action: string;
  window: FeedWindow;
  category: "" | Exclude<FeedCategory, "general">;
  q: string;
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <form action={action} method="get" className="search-shell p-2">
        <input type="hidden" name="window" value={window} />
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex items-center gap-3 flex-1 px-3 py-2 text-[var(--muted)]">
            <Search size={18} aria-hidden />
            <input
              name="q"
              defaultValue={q}
              placeholder={t("feed.search")}
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
              maxLength={200}
            />
          </label>
          <button type="submit" className="btn btn-primary shrink-0">
            {t("feed.searchBtn")}
          </button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        {(["24h", "7d"] as const).map((w) => (
          <Link
            key={w}
            href={`${action}${buildQueryString({ window: w, category, q })}`}
            className={window === w ? "tag tag-signal" : "tag hover:border-[var(--signal)]"}
          >
            {t(w === "24h" ? "feed.window.24h" : "feed.window.7d")}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {FEED_CATEGORY_CHIPS.map((c) => {
          const key = (c.id ? `feed.cat.${c.id}` : "feed.cat.all") as MessageKey;
          return (
            <Link
              key={c.id || "all"}
              href={`${action}${buildQueryString({ window, category: c.id, q })}`}
              className={category === c.id ? "tag tag-signal" : "tag hover:border-[var(--signal)]"}
            >
              {t(key)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

