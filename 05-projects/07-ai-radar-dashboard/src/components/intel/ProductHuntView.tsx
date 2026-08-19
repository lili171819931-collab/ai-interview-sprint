"use client";

import { useState } from "react";
import { ExternalLink, Rocket, Star, TrendingUp } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { formatStarHeat } from "@/lib/intel/github-classify";
import type { GithubCategory } from "@/lib/intel/github-types";
import type { ProductHuntBucket } from "@/lib/intel/producthunt-data";
import type { ProductHuntItem } from "@/lib/intel/producthunt-types";
import { DraggableModal } from "@/components/DraggableModal";
import type { MessageKey } from "@/lib/i18n/messages";

function sceneKey(id: GithubCategory): MessageKey {
  return `gh.scene.${id}` as MessageKey;
}

function sortTop(items: ProductHuntItem[]): ProductHuntItem[] {
  return [...items].sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title));
}

function sortRising(items: ProductHuntItem[]): ProductHuntItem[] {
  return [...items].sort(
    (a, b) => (b.delta || 0) - (a.delta || 0) || b.votes - a.votes || a.title.localeCompare(b.title),
  );
}

function AppRows({ items, showDelta }: { items: ProductHuntItem[]; showDelta: boolean }) {
  const { t, locale } = useLocale();
  if (!items.length) return <p className="ghh-modal-empty">{t("ph.none")}</p>;
  return (
    <ol className="ghh-modal-rows">
      {items.map((it, i) => (
        <li key={it.slug || it.url} className="ghh-row">
          <span className="ghh-rank">{String(i + 1).padStart(2, "0")}</span>
          <div className="gh-row-main">
            <div className="gh-row-topline">
              <a href={it.url} target="_blank" rel="noreferrer" className="zh-title gh-row-name">
                {it.title}
              </a>
              <span className="gh-feat">{t(sceneKey(it.category))}</span>
              {it.github ? <span className="gh-feat gh-feat-gh">{t("ph.matched")}</span> : null}
            </div>
            {it.tagline ? <p className="gh-row-desc">{it.tagline}</p> : null}
            <div className="ghh-links">
              <a href={it.url} target="_blank" rel="noreferrer" className="gh-home">
                {t("ph.download")} <ExternalLink size={11} aria-hidden />
              </a>
              <a
                href={it.github?.url || it.githubSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="gh-home"
              >
                {it.github ? t("ph.source") : t("ph.search")} <ExternalLink size={11} aria-hidden />
              </a>
              {it.github?.homepage ? (
                <a href={it.github.homepage} target="_blank" rel="noreferrer" className="gh-home">
                  {t("ph.site")} <ExternalLink size={11} aria-hidden />
                </a>
              ) : null}
            </div>
          </div>
          <div className="ghh-heat">
            <span className="gh-heat" title={`${it.votes} votes`}>
              <Star size={11} aria-hidden />
              {t("ph.votes", { n: formatStarHeat(it.votes, locale) })}
            </span>
            {showDelta && it.delta && it.delta > 0 ? (
              <span className="ghh-delta">{t("ghh.delta", { n: it.delta })}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ProductHuntView({ buckets }: { buckets: ProductHuntBucket[] }) {
  const { t } = useLocale();
  const [openId, setOpenId] = useState<GithubCategory | null>(null);
  const [tab, setTab] = useState<"top" | "rising">("top");
  const open = buckets.find((b) => b.id === openId) || null;

  if (!buckets.length) {
    return <div className="surface p-6 text-sm text-[var(--muted)]">{t("ph.empty")}</div>;
  }

  return (
    <>
      <div className="ghh-cat-grid">
        {buckets.map((b) => {
          const risingCount = b.items.filter((it) => (it.delta || 0) > 0).length;
          return (
            <button
              key={b.id}
              type="button"
              className="ghh-cat-card"
              onClick={() => {
                setOpenId(b.id);
                setTab("top");
              }}
            >
              <div className="ghh-cat-card-top">
                <Rocket size={16} aria-hidden />
                <span className="display ghh-cat-title">{t(sceneKey(b.id))}</span>
              </div>
              <p className="ghh-cat-meta">
                <span>{t("ghh.topCount", { n: b.items.length })}</span>
                <span aria-hidden>·</span>
                <span>{t("ghh.riseCount", { n: risingCount })}</span>
              </p>
              <span className="ghh-cat-cta">{t("ghh.open")}</span>
            </button>
          );
        })}
      </div>
      {open ? (
        <DraggableModal
          open
          onClose={() => setOpenId(null)}
          title={t(sceneKey(open.id))}
          hint={t("ph.modalHint")}
          footer={
            <p className="text-xs text-[var(--muted)]">
              {t("ph.catCount", { n: open.items.length })} · {t("ph.sourceNote")}
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
              <Star size={13} aria-hidden />
              {t("ghh.top")}
              <span>{open.items.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "rising"}
              className={tab === "rising" ? "ghh-modal-tab ghh-modal-tab-on" : "ghh-modal-tab"}
              onClick={() => setTab("rising")}
            >
              <TrendingUp size={13} aria-hidden />
              {t("ghh.rising")}
              <span>{open.items.filter((it) => (it.delta || 0) > 0).length}</span>
            </button>
          </div>
          <div className="ghh-modal-body">
            <AppRows items={tab === "top" ? sortTop(open.items) : sortRising(open.items)} showDelta={tab === "rising"} />
          </div>
        </DraggableModal>
      ) : null}
    </>
  );
}
