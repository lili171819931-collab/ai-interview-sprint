"use client";

import { useRef, useState } from "react";
import { ExternalLink, Languages, Loader2, Search, Star, TrendingUp } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { formatStarHeat } from "@/lib/intel/github-classify";
import type { GithubSearchEntry } from "@/lib/intel/github-data";
import { DraggableModal } from "@/components/DraggableModal";
import type { MessageKey } from "@/lib/i18n/messages";

const EXAMPLES = ["语音", "RAG", "Agent", "coding", "爬虫", "视频"];

function hasCJK(s: string): boolean {
  return /[\u3400-\u4dbf\u4e00-\u9fff]/.test(s);
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,，。.、;；:：!！?？()[\]{}]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 中英文双语匹配：关键词同时来自中文与英文，命中任一语言即可 */
function matchScore(item: GithubSearchEntry, zhPhrase: string, enPhrase: string): number {
  const blob = [
    item.name,
    item.fullName,
    item.author,
    item.description,
    item.language,
    item.category,
    ...item.topics,
    ...item.features,
  ]
    .join(" ")
    .toLowerCase();
  const zh = zhPhrase.trim().toLowerCase();
  const en = enPhrase.trim().toLowerCase();
  const zhTokens = tokenize(zh);
  const enTokens = tokenize(en);
  let hits = 0;
  if (zh && blob.includes(zh)) hits += 2;
  if (en && blob.includes(en)) hits += 2;
  for (const tok of [...new Set([...zhTokens, ...enTokens])]) {
    if (!tok) continue;
    if (blob.includes(tok)) hits += 1;
  }
  return hits;
}

function sceneKey(id: string): MessageKey {
  return `gh.scene.${id}` as MessageKey;
}

function SearchRows({
  items,
  showDelta,
}: {
  items: GithubSearchEntry[];
  showDelta: boolean;
}) {
  const { t, locale } = useLocale();
  if (!items.length) {
    return <p className="ghh-modal-empty">{t("ghs.none")}</p>;
  }
  return (
    <ol className="ghh-modal-rows">
      {items.map((it, i) => (
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
              <span className="gh-feat">{t(sceneKey(it.category))}</span>
              <span className={it.openSource === false ? "gh-license gh-license-closed" : "gh-license"}>
                {it.openSource === false ? t("gh.closed") : t("gh.open")}
                {it.license ? ` · ${it.license}` : ""}
              </span>
            </div>
            {it.description ? <p className="gh-row-desc">{it.description}</p> : null}
            {it.features.length ? (
              <p className="gh-row-feat">
                {it.features.slice(0, 3).map((f) => (
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
            {showDelta && it.starsDelta && it.starsDelta > 0 ? (
              <span className="ghh-delta">{t("ghh.delta", { n: formatStarHeat(it.starsDelta, locale) })}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function GithubSearch({ library }: { library: GithubSearchEntry[] }) {
  const { t } = useLocale();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"top" | "rising">("top");
  const [zhPhrase, setZhPhrase] = useState("");
  const [enPhrase, setEnPhrase] = useState("");
  const [results, setResults] = useState<GithubSearchEntry[]>([]);
  const [translated, setTranslated] = useState<{ from: string; to: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runSearch(raw: string) {
    const query = raw.trim();
    if (!query) return;
    setBusy(true);
    setQ(query);
    const isCjk = hasCJK(query);
    let zh = isCjk ? query : query;
    let en = isCjk ? query : query;
    let note: { from: string; to: string } | null = null;
    // 无论中文/英文输入，都自动翻译成另一语言，保证中英文同时检索
    try {
      const target = isCjk ? "en" : "zh";
      const res = await fetch("/api/v1/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [query], target }),
      });
      const json = (await res.json()) as { items?: { src: string; dst: string }[] };
      const dst = json.items?.[0]?.dst?.trim();
      if (dst && dst !== query) {
        if (isCjk) {
          en = dst;
          note = { from: query, to: dst };
        } else {
          zh = dst;
          note = { from: query, to: dst };
        }
      }
    } catch {
      // 离线时退化为原语言检索
    }
    setZhPhrase(zh);
    setEnPhrase(en);
    setTranslated(note);

    const scored = library
      .map((it) => ({ it, score: matchScore(it, zh, en) }))
      .filter((r) => r.score > 0)
      .map((r) => r.it);
    setResults(scored);
    setTab("top");
    setOpen(true);
    setBusy(false);
  }

  const top = [...results].sort(
    (a, b) => b.stars - a.stars || a.fullName.localeCompare(b.fullName),
  );
  const rising = [...results].sort(
    (a, b) => (b.starsDelta ?? -1) - (a.starsDelta ?? -1) || b.stars - a.stars,
  );

  if (!library.length) {
    return (
      <section className="surface rounded-xl border border-[var(--line)] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-[var(--signal)]" aria-hidden />
          <h2 className="display text-base font-semibold">{t("ghs.title")}</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {t("gh.empty")}（<code className="font-mono">npm run github:sync && npm run github:hot</code>）
        </p>
      </section>
    );
  }

  return (
    <section className="surface rounded-xl border border-[var(--line)] p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-[var(--signal)]" aria-hidden />
          <h2 className="display text-base font-semibold">{t("ghs.title")}</h2>
          <span className="text-xs text-[var(--muted)]">{t("ghs.scope", { n: library.length })}</span>
        </div>
        <p className="text-xs text-[var(--muted)]">{t("ghs.hint")}</p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(inputRef.current?.value || "");
        }}
      >
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="search"
            defaultValue=""
            placeholder={t("ghs.placeholder")}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3.5 py-2 pr-9 text-sm outline-none focus:border-[var(--signal)]"
            aria-label={t("ghs.placeholder")}
          />
          <Languages size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
        </div>
        <button type="submit" className="btn btn-primary inline-flex items-center gap-1.5" disabled={busy}>
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Search size={14} aria-hidden />}
          {busy ? t("ghs.searching") : t("ghs.button")}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[var(--muted)]">{t("ghs.example")}</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = ex;
              void runSearch(ex);
            }}
            className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[var(--muted)] hover:border-[var(--signal)] hover:text-[var(--text)] transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {translated ? (
        <p className="flex items-start gap-1.5 text-xs text-[var(--signal)] leading-relaxed">
          <Languages size={13} className="shrink-0 mt-0.5" aria-hidden />
          {hasCJK(q)
            ? t("ghs.translated", { zh: translated.from, en: translated.to })
            : t("ghs.translatedEn", { en: translated.from, zh: translated.to })}
        </p>
      ) : null}

      <DraggableModal
        open={open}
        onClose={() => setOpen(false)}
        title={`${t("ghs.title")} · ${q}`}
        hint={`${t("ghs.found", { n: results.length })}${
          translated ? ` · ${
            hasCJK(q)
              ? t("ghs.translated", { zh: translated.from, en: translated.to })
              : t("ghs.translatedEn", { en: translated.from, zh: translated.to })
          }` : ""
        }`}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--muted)]">
              {t("ghs.bilingual")} · {t("ghs.top")} {top.length} / {t("ghs.rising")} {rising.length}
            </p>
            <a
              href={`https://github.com/search?q=${encodeURIComponent(enPhrase || zhPhrase || q)}&type=repositories`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--signal)] hover:underline"
            >
              GitHub 全库搜索 <ExternalLink size={11} aria-hidden />
            </a>
          </div>
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
            {t("ghs.top")}
            <span>{top.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "rising"}
            className={tab === "rising" ? "ghh-modal-tab ghh-modal-tab-on" : "ghh-modal-tab"}
            onClick={() => setTab("rising")}
          >
            <TrendingUp size={13} aria-hidden />
            {t("ghs.rising")}
            <span>{rising.length}</span>
          </button>
        </div>
        <SearchRows items={tab === "top" ? top : rising} showDelta={tab === "rising"} />
      </DraggableModal>
    </section>
  );
}
