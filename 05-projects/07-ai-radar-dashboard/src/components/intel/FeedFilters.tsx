import Link from "next/link";
import { Search } from "lucide-react";
import { buildQueryString, FEED_CATEGORY_CHIPS, type FeedCategory, type FeedWindow } from "@/lib/intel/categories";

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
              placeholder="搜 OpenAI、Sora、RAG、论文…"
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
              maxLength={200}
            />
          </label>
          <button type="submit" className="btn btn-primary shrink-0">
            搜索
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
            {w === "24h" ? "过去 24 小时" : "最近 7 天"}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {FEED_CATEGORY_CHIPS.map((c) => (
          <Link
            key={c.id || "all"}
            href={`${action}${buildQueryString({ window, category: c.id, q })}`}
            className={category === c.id ? "tag tag-signal" : "tag hover:border-[var(--signal)]"}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
