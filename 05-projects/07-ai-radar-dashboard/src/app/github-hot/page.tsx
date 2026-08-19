import { GithubHotView } from "@/components/intel/GithubHotView";
import { ProductHuntView } from "@/components/intel/ProductHuntView";
import { GithubSearch } from "@/components/intel/GithubSearch";
import { PageLiveRefresh } from "@/components/PageLiveRefresh";
import { Tx } from "@/components/i18n/Tx";
import { UpdatedAt } from "@/components/i18n/UpdatedAt";
import { getGithubHotSnapshot, getGithubSearchLibrary } from "@/lib/intel/github-data";
import { getProductHuntBuckets, getProductHuntSnapshot } from "@/lib/intel/producthunt-data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GitHub热点",
};

export default function GithubHotPage() {
  const snap = getGithubHotSnapshot();
  const hasData = Boolean(snap?.categories?.some((b) => b.top.length || b.rising.length));
  const phSnap = getProductHuntSnapshot();
  const phBuckets = phSnap ? getProductHuntBuckets(phSnap) : [];

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">
          <Tx k="ghh.kicker" />
        </p>
        <h1 className="page-title">
          <Tx k="ghh.title" />
        </h1>
        <p className="page-sub max-w-2xl">
          <Tx k="ghh.sub" />
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <UpdatedAt iso={snap?.fetchedAt} />
          <PageLiveRefresh
            intervalMs={60 * 60 * 1000}
            syncMode="github-hot"
            syncEveryCycles={1}
            fetchedAt={snap?.fetchedAt || null}
            labelKey="refresh.githubHot"
          />
        </div>
      </header>

      <GithubSearch library={getGithubSearchLibrary()} />

      {hasData && snap ? (
        <GithubHotView snapshot={snap} />
      ) : (
        <div className="surface p-6 text-sm text-[var(--muted)]">
          <Tx k="ghh.empty" />
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="kicker">
              <Tx k="ph.kicker" />
            </p>
            <h2 className="page-title" style={{ fontSize: "1.5rem" }}>
              <Tx k="ph.title" />
            </h2>
            <p className="page-sub max-w-2xl">
              <Tx k="ph.sub" />
            </p>
          </div>
        </div>
        {phBuckets.length ? (
          <ProductHuntView buckets={phBuckets} />
        ) : (
          <div className="surface p-6 text-sm text-[var(--muted)]">
            <Tx k="ph.empty" />
          </div>
        )}
      </section>
    </div>
  );
}
