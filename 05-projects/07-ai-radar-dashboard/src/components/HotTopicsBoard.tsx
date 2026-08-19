"use client";

import { useMemo, useState } from "react";
import type { GlobalHotRegion } from "@/lib/global-hot-types";
import type { MergedHotTopic } from "@/lib/global-hot-merge";
import { HOT_STATUS_LABEL } from "@/lib/intel/hot-rank";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { tr, useTranslatedTexts } from "@/components/i18n/useTranslatedTexts";
import { formatRelativeZh, formatUpdatedAt } from "@/lib/intel/time";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function sparkPoints(id: string, rising: boolean, heat: number): string {
  const n = 16;
  const amp = Math.min(10, 4 + heat / 18);
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wave = Math.sin(i * 0.9 + (hash % 13)) * (amp * 0.28);
    const trend = rising ? 20 - t * 12 : 8 + t * 9;
    const y = Math.max(2, Math.min(26, trend + wave));
    pts.push(`${(t * 80).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function Sparkline({ id, rising, heat }: { id: string; rising: boolean; heat: number }) {
  const points = sparkPoints(id, rising, heat);
  return (
    <svg className="hot-spark" viewBox="0 0 80 28" width="80" height="28" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function MergedList({ items, region }: { items: MergedHotTopic[]; region: GlobalHotRegion }) {
  const { locale } = useLocale();
  const txMap = useTranslatedTexts(items.map((it) => it.title));
  if (!items.length) {
    return <p className="text-sm text-[var(--muted)]">{region}版暂无可用条目。可运行 npm run hot:sync。</p>;
  }

  return (
    <section className="hot-card">
      <div className="hot-card-head">
        <h2 className="display text-lg font-semibold">NOW {region}合并热点</h2>
        <p className="text-xs text-[var(--muted)]">按热度 · {items.length} 个话题</p>
      </div>
      <ol>
        {items.map((it) => {
          const rising = it.status === "fermenting" || it.status === "new" || it.status === "hot";
          const when = it.latestAt ? formatRelativeZh(it.latestAt, Date.now(), locale) : null;
          const stamp = it.latestAt ? formatUpdatedAt(it.latestAt, locale) : null;
          return (
            <li key={it.id} className="hot-row">
              <span className="hot-rank">{pad(it.rank)}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <a href={it.href} target="_blank" rel="noreferrer" className="zh-title" style={{ fontSize: "0.98rem" }}>
                    {tr(txMap, it.title)}
                  </a>
                  {it.status ? (
                    <span className={`hot-badge hot-badge-${it.status}`}>{HOT_STATUS_LABEL[it.status]}</span>
                  ) : null}
                </div>
                <p className="zh-source hot-meta" title={it.platforms.join(" · ")}>
                  {it.sourceLabel}
                  {when ? (
                    <>
                      {" · "}
                      <time dateTime={it.latestAt} title={stamp || undefined}>
                        {when}
                      </time>
                    </>
                  ) : null}
                  {it.itemCount > 1 ? ` · 合并 ${it.itemCount} 条` : null}
                </p>
              </div>
              <Sparkline id={it.id} rising={rising} heat={it.heat} />
              <div className="hot-heat">
                <div className="hot-heat-n">{it.heat}</div>
                <div className="hot-heat-label">热度值</div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function HotTopicsBoard({
  byRegion,
}: {
  byRegion: Record<GlobalHotRegion, MergedHotTopic[]>;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<GlobalHotRegion>("国内");
  const items = useMemo(() => byRegion[tab] || [], [byRegion, tab]);

  return (
    <div className="space-y-5">
      <div className="hot-region-tabs">
        {(["国内", "海外"] as GlobalHotRegion[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setTab(r)}
            className={tab === r ? "hot-region-tab hot-region-tab-on" : "hot-region-tab"}
          >
            {r === "国内" ? t("hot.cn") : t("hot.global")}
            <span className="ml-1.5 text-[11px] opacity-70">{byRegion[r]?.length || 0}</span>
          </button>
        ))}
      </div>
      <MergedList items={items} region={tab} />
    </div>
  );
}
