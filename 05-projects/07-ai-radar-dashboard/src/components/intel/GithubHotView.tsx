"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Star, TrendingUp } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { tr, useTranslatedTexts } from "@/components/i18n/useTranslatedTexts";
import { formatStarHeat, githubCategoryRank } from "@/lib/intel/github-classify";
import { GITHUB_CATEGORY_ORDER, type GithubCategory, type GithubHotCategoryBucket, type GithubHotItem, type GithubHotSnapshot } from "@/lib/intel/github-types";
import type { MessageKey } from "@/lib/i18n/messages";
import { DraggableModal } from "@/components/DraggableModal";

function sceneKey(id: string): MessageKey {
  return `gh.scene.${id}` as MessageKey;
}

function HotRows({ items }: { items: GithubHotItem[] }) {
  const { t, locale } = useLocale();
  const txMap = useTranslatedTexts(items.flatMap((it) => [it.description, ...(it.features || [])]));

  if (!items.length) {
    return <p className="ghh-modal-empty">{t("ghh.none")}</p>;
  }

  return (
    <ol className="ghh-modal-rows">
      {items.map((it) => {
        const desc = tr(txMap, it.description);
        const features = (it.features || []).map((f) => tr(txMap, f));
        return (
          <li key={`${it.list}-${it.id}`} className="ghh-row">
            <span className="ghh-rank">{String(it.rank).padStart(2, "0")}</span>
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
              {it.starsDelta && it.starsDelta > 0 ? (
                <span className="ghh-delta">{t("ghh.delta", { n: formatStarHeat(it.starsDelta, locale) })}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CategoryModal({
  bucket,
  onClose,
}: {
  bucket: GithubHotCategoryBucket;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<"top" | "rising">("top");
  const items = tab === "top" ? bucket.top : bucket.rising;

  return (
    <DraggableModal
      open
      onClose={onClose}
      title={t(sceneKey(bucket.id))}
      hint={t("ghh.modalHint")}
      footer={
        <p className="text-xs text-[var(--muted)]">
          {t("ghh.top")} {bucket.top.length} · {t("ghh.rising")} {bucket.rising.length}
        </p>
      }
    >
      <div className="ghh-modal-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "top"}
          className={tab === "top" ? "ghh-modal-tab ghh-modal-tab-on" : "ghh-modal-tab"}
          onClick={() => setTab("top")}
        >
          {t("ghh.top")}
          <span>{bucket.top.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "rising"}
          className={tab === "rising" ? "ghh-modal-tab ghh-modal-tab-on" : "ghh-modal-tab"}
          onClick={() => setTab("rising")}
        >
          {t("ghh.rising")}
          <span>{bucket.rising.length}</span>
        </button>
      </div>
      <div className="ghh-modal-body">
        <HotRows items={items} />
      </div>
    </DraggableModal>
  );
}

export function GithubHotView({ snapshot }: { snapshot: GithubHotSnapshot }) {
  const { t } = useLocale();
  const [openId, setOpenId] = useState<GithubCategory | null>(null);

  const buckets = useMemo(() => {
    const by = new Map((snapshot.categories || []).map((b) => [b.id, b]));
    return [...GITHUB_CATEGORY_ORDER]
      .sort((a, b) => githubCategoryRank(a) - githubCategoryRank(b))
      .map((id) => by.get(id) || { id, top: [], rising: [] })
      .filter((b) => b.top.length || b.rising.length);
  }, [snapshot.categories]);

  const open = openId ? buckets.find((b) => b.id === openId) || null : null;

  if (!buckets.length) {
    return <div className="surface p-6 text-sm text-[var(--muted)]">{t("ghh.empty")}</div>;
  }

  return (
    <>
      <div className="ghh-cat-grid">
        {buckets.map((b) => (
          <button key={b.id} type="button" className="ghh-cat-card" onClick={() => setOpenId(b.id)}>
            <div className="ghh-cat-card-top">
              <TrendingUp size={16} aria-hidden />
              <span className="display ghh-cat-title">{t(sceneKey(b.id))}</span>
            </div>
            <p className="ghh-cat-meta">
              <span>{t("ghh.topCount", { n: b.top.length })}</span>
              <span aria-hidden>·</span>
              <span>{t("ghh.riseCount", { n: b.rising.length })}</span>
            </p>
            <span className="ghh-cat-cta">{t("ghh.open")}</span>
          </button>
        ))}
      </div>
      {open ? <CategoryModal bucket={open} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}
