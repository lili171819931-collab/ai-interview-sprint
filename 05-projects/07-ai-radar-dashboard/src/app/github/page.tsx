import { GithubStarsView } from "@/components/intel/GithubStarsView";
import { GithubSearch } from "@/components/intel/GithubSearch";
import { PageLiveRefresh } from "@/components/PageLiveRefresh";
import { Tx } from "@/components/i18n/Tx";
import { UpdatedAt } from "@/components/i18n/UpdatedAt";
import { getGithubStarsSnapshot, getGithubSearchLibrary } from "@/lib/intel/github-data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GitHub- Lily",
};

export default function GithubProjectsPage() {
  const snap = getGithubStarsSnapshot();
  const login = snap?.login || "lili171819931-collab";

  return (
    <div className="page-main space-y-8">
      <header className="space-y-3">
        <p className="kicker">
          <Tx k="gh.kicker" />
        </p>
        <h1 className="page-title">
          <Tx k="gh.title" />
        </h1>
        <p className="page-sub max-w-2xl">
          <Tx k="gh.sub" />
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <UpdatedAt iso={snap?.fetchedAt} />
          <span>
            <Tx k="gh.count" values={{ n: snap?.count || 0 }} />
          </span>
          <PageLiveRefresh
            intervalMs={60 * 60 * 1000}
            syncMode="github"
            syncEveryCycles={1}
            fetchedAt={snap?.fetchedAt || null}
            labelKey="refresh.github"
          />
          <a
            href={snap?.profileUrl || `https://github.com/${login}?tab=stars`}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--signal)] hover:underline"
          >
            <Tx k="gh.view" />
          </a>
        </div>
      </header>

      <GithubSearch library={getGithubSearchLibrary()} />

      {snap?.items.length ? (
        <GithubStarsView snapshot={snap} />
      ) : (
        <div className="surface p-6 text-sm text-[var(--muted)]">
          <Tx k="gh.empty" />
        </div>
      )}
    </div>
  );
}
