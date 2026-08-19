import { FeedFilters } from "@/components/intel/FeedFilters";
import { FeedItemList } from "@/components/intel/FeedItemCard";
import { FeaturedDateLine } from "@/components/intel/FeaturedDateLine";
import { FeaturedHotNow } from "@/components/intel/FeaturedHotNow";
import { FeedTimeline } from "@/components/intel/FeedTimeline";
import { PageLiveRefresh } from "@/components/PageLiveRefresh";
import { Tx } from "@/components/i18n/Tx";
import { UpdatedAt } from "@/components/i18n/UpdatedAt";
import type { FeedMode } from "@/lib/intel/categories";
import { parseFeedQuery, queryFeed, queryHotTopics } from "@/lib/intel/feed";
import { getRadarStatus } from "@/lib/intel/status";

export function FeedPageView({
  mode,
  searchParams,
}: {
  mode: FeedMode;
  searchParams: { window?: string; category?: string; q?: string };
}) {
  const query = parseFeedQuery({ ...searchParams, mode });
  const feed = queryFeed(query);
  const hot = queryHotTopics();
  const status = getRadarStatus();
  const action = mode === "all" ? "/all" : "/";

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">
          <Tx k={mode === "selected" ? "feed.kicker.featured" : "feed.kicker.all"} />
        </p>
        <h1 className="page-title">
          <Tx k={mode === "selected" ? "feed.title.featured" : "feed.title.all"} />
        </h1>
        {mode === "selected" ? (
          <p className="page-sub">
            <FeaturedDateLine iso={feed.generatedAt || status.fetchedAt} />
          </p>
        ) : (
          <p className="page-sub">
            <Tx k="feed.sub.all" />
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-xs text-[var(--muted)]">
            <UpdatedAt iso={feed.generatedAt || status.fetchedAt} />
          </p>
          {mode === "all" ? (
            <PageLiveRefresh
              intervalMs={30_000}
              syncMode="hourly"
              syncEveryCycles={2}
              fetchedAt={feed.generatedAt}
              labelKey="refresh.sources"
            />
          ) : null}
        </div>
      </header>

      <FeedFilters action={action} window={query.window} category={query.category} q={query.q} />

      {mode === "selected" ? (
        <div className="space-y-8">
          <FeaturedHotNow items={hot.items} />
          <section className="min-w-0 space-y-3">
            <h2 className="display text-lg font-semibold">
              <Tx k="feed.stories" />
            </h2>
            <FeedItemList items={feed.items} />
          </section>
        </div>
      ) : (
        <FeedTimeline items={feed.items} />
      )}
    </div>
  );
}
