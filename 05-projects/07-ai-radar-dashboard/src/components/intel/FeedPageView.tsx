import { FeedFilters } from "@/components/intel/FeedFilters";
import { FeedItemList } from "@/components/intel/FeedItemCard";
import { FeaturedHotNow } from "@/components/intel/FeaturedHotNow";
import { FeedTimeline } from "@/components/intel/FeedTimeline";
import { PageLiveRefresh } from "@/components/PageLiveRefresh";
import type { FeedMode } from "@/lib/intel/categories";
import { parseFeedQuery, queryFeed, queryHotTopics } from "@/lib/intel/feed";
import { getRadarStatus } from "@/lib/intel/status";
import { formatUpdatedAt, shanghaiDay } from "@/lib/intel/time";

function featuredDateLine(iso: string | null | undefined): string {
  const ymd = shanghaiDay(iso || new Date().toISOString());
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    weekday: "long",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${ymd}T12:00:00+08:00`));
  const [y, m, d] = ymd.split("-");
  return `${y}年${Number(m)}月${Number(d)}日${weekday}`;
}

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
  const stamp = formatUpdatedAt(feed.generatedAt || status.fetchedAt);

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">{mode === "selected" ? "FEATURED" : "ALL UPDATES"}</p>
        <h1 className="page-title">{mode === "selected" ? "精选" : "全部 AI 动态"}</h1>
        {mode === "selected" ? (
          <p className="page-sub">
            {featuredDateLine(feed.generatedAt || status.fetchedAt)} · AI 筛选的今日重点
          </p>
        ) : (
          <p className="page-sub">按发布时间轴流动展示 · 信息源每分钟刷新</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-xs text-[var(--muted)]">更新于 {stamp}</p>
          {mode === "all" ? (
            <PageLiveRefresh
              intervalMs={60_000}
              syncMode="hourly"
              syncEveryCycles={1}
              fetchedAt={feed.generatedAt}
              label="信息源"
            />
          ) : null}
        </div>
      </header>

      <FeedFilters action={action} window={query.window} category={query.category} q={query.q} />

      {mode === "selected" ? (
        <div className="space-y-8">
          <FeaturedHotNow items={hot.items} />
          <section className="min-w-0 space-y-3">
            <h2 className="display text-lg font-semibold">精选报道</h2>
            <FeedItemList items={feed.items} />
          </section>
        </div>
      ) : (
        <FeedTimeline items={feed.items} />
      )}
    </div>
  );
}
