"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FolderGit2, Star } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { tr, useTranslatedTexts } from "@/components/i18n/useTranslatedTexts";
import { formatStarHeat, githubCategoryRank } from "@/lib/intel/github-classify";
import { GITHUB_CATEGORY_ORDER, type GithubCategory, type GithubStarItem, type GithubStarsSnapshot } from "@/lib/intel/github-types";
import type { MessageKey } from "@/lib/i18n/messages";
import { DraggableModal } from "@/components/DraggableModal";

function sceneKey(id: GithubCategory): MessageKey {
  return `gh.scene.${id}` as MessageKey;
}

function StarRows({ items }: { items: GithubStarItem[] }) {
  const { t, locale } = useLocale();
  const txMap = useTranslatedTexts(items.flatMap((it) => [it.description, ...(it.features || [])]));

  if (!items.length) {
    return <p className="ghh-modal-empty">{t("gh.none")}</p>;
  }

  return (
    <ol className="ghh-modal-rows">
      {items.map((it, i) => {
        const desc = tr(txMap, it.description);
        const features = (it.features || []).map((f) => tr(txMap, f));
        return (
          <li key={it.id} className="ghh-row">
            <span className="ghh-rank">{String(i + 1).padStart(2, "0")}</span>
            <div className="gh-row-main">
              <div className="gh-row-topline">
                <a href={it.url} target="_blank" rel="noreferrer" className="zh-title gh-row-name">
                  {it.name}
                </a>
                <a href={it.authorUrl} target="_blank" rel="noreferrer" className="zh-source gh-row-author">
                  @{it.author}
                </a>
                <span className={it.openSource === false ? "gh-license gh-license-closed" : "gh-license"}>
                  {it.openSource === false ? t("gh.closed") : t("gh.open")}
                  {it.license ? ` · ${it.license}` : ""}
                </span>
              </div>
              {desc ? <p className="gh-row-desc">{desc}</p> : null}
              {features.length ? (
                <p className="gh-row-feat">
                  {features.map((f) => (
                    <span key={f} className="gh-feat">
                      {f}
                    </span>
                  ))}
                </p>
              ) : null}
              <div className="ghh-links">
                <a href={it.url} target="_blank" rel="noreferrer" className="gh-home">
                  GitHub <ExternalLink size={11} aria-hidden />
                </a>
                {it.homepage ? (
                  <a href={it.homepage} target="_blank" rel="noreferrer" className="gh-home">
                    {t("gh.product")} <ExternalLink size={11} aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="ghh-heat">
              <span className="gh-heat" title={`${it.stars.toLocaleString()} stars`}>
                <Star size={11} aria-hidden />
                {formatStarHeat(it.stars, locale)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CategoryModal({
  category,
  items,
  onClose,
}: {
  category: GithubCategory;
  items: GithubStarItem[];
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [sort, setSort] = useState<"stars" | "starred">("stars");
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sort === "starred") return Date.parse(b.starredAt) - Date.parse(a.starredAt);
      return b.stars - a.stars || a.fullName.localeCompare(b.fullName);
    });
  }, [items, sort]);

  return (
    <DraggableModal
      open
      onClose={onClose}
      title={t(sceneKey(category))}
      hint={t("gh.modalHint")}
      footer={
        <p className="text-xs text-[var(--muted)]">{t("gh.catCount", { n: items.length })}</p>
      }
    >
      <div className="ghh-modal-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={sort === "stars"}
          className={sort === "stars" ? "ghh-modal-tab ghh-modal-tab-on" : "ghh-modal-tab"}
          onClick={() => setSort("stars")}
        >
          {t("gh.sort.stars")}
          <span>{items.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sort === "starred"}
          className={sort === "starred" ? "ghh-modal-tab ghh-modal-tab-on" : "ghh-modal-tab"}
          onClick={() => setSort("starred")}
        >
          {t("gh.sort.starred")}
          <span>{items.length}</span>
        </button>
      </div>
      <div className="ghh-modal-body">
        <StarRows items={sorted} />
      </div>
    </DraggableModal>
  );
}

export function GithubStarsView({ snapshot }: { snapshot: GithubStarsSnapshot }) {
  const { t } = useLocale();
  const [openId, setOpenId] = useState<GithubCategory | null>(null);

  const groups = useMemo(() => {
    const by = new Map<GithubCategory, GithubStarItem[]>();
    for (const it of snapshot.items) {
      const list = by.get(it.category) || [];
      list.push(it);
      by.set(it.category, list);
    }
    return [...GITHUB_CATEGORY_ORDER]
      .sort((a, b) => githubCategoryRank(a) - githubCategoryRank(b))
      .map((id) => ({
        id,
        items: [...(by.get(id) || [])].sort((a, b) => b.stars - a.stars || a.fullName.localeCompare(b.fullName)),
      }))
      .filter((g) => g.items.length);
  }, [snapshot.items]);

  const open = openId ? groups.find((g) => g.id === openId) || null : null;

  if (!groups.length) {
    return <div className="surface p-6 text-sm text-[var(--muted)]">{t("gh.none")}</div>;
  }

  return (
    <>
      <div className="ghh-cat-grid">
        {groups.map((g) => (
          <button key={g.id} type="button" className="ghh-cat-card" onClick={() => setOpenId(g.id)}>
            <div className="ghh-cat-card-top">
              <FolderGit2 size={16} aria-hidden />
              <span className="display ghh-cat-title">{t(sceneKey(g.id))}</span>
            </div>
            <p className="ghh-cat-meta">
              <span>{t("gh.catCount", { n: g.items.length })}</span>
            </p>
            <span className="ghh-cat-cta">{t("gh.openList")}</span>
          </button>
        ))}
      </div>
      {open ? <CategoryModal category={open.id} items={open.items} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}
