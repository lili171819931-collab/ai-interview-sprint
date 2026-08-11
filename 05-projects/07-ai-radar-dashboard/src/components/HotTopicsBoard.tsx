"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { GlobalHotPlatformGroup, GlobalHotRegion } from "@/lib/global-hot-types";

const CN_ORDER = [
  "微博热搜",
  "抖音热榜",
  "B站热搜",
  "B站热门视频",
  "知乎热榜",
  "今日头条热榜",
  "小红书探索页",
  "小红书(OpenCLI)",
  "V2EX 热门",
  "雪球热帖",
];

const INTL_ORDER = [
  "Hacker News",
  "TechCrunch Social",
  "Product Hunt",
  "Exa 全球科技热点",
  "Reddit 热门",
  "Twitter/X 趋势",
];

function orderPlatforms(
  platforms: GlobalHotPlatformGroup[],
  region: GlobalHotRegion,
  preferred: string[],
) {
  const inRegion = platforms.filter((p) => p.region === region && p.items.length > 0);
  const map = new Map(inRegion.map((p) => [p.name, p]));
  const ordered: GlobalHotPlatformGroup[] = [];
  for (const name of preferred) {
    const hit = map.get(name);
    if (hit) {
      ordered.push(hit);
      map.delete(name);
    }
  }
  for (const p of inRegion) {
    if (map.has(p.name)) ordered.push(p);
  }
  return ordered;
}

export function HotTopicsBoard({ platforms }: { platforms: GlobalHotPlatformGroup[] }) {
  const [tab, setTab] = useState<GlobalHotRegion>("国内");
  const groups = useMemo(
    () => orderPlatforms(platforms, tab, tab === "国内" ? CN_ORDER : INTL_ORDER),
    [platforms, tab],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["国内", "海外"] as GlobalHotRegion[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setTab(r)}
            className={
              tab === r
                ? "btn btn-primary"
                : "btn btn-ghost"
            }
          >
            {r}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">本区域暂无可用数据源</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <section key={group.name} className="surface p-4 space-y-3">
              <h3 className="display text-base font-semibold border-b border-[var(--line)] pb-2">
                {group.name}
                <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                  {group.items.length}
                </span>
              </h3>
              <ol className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={`${group.name}-${item.rank}-${item.title.slice(0, 24)}`} className="flex gap-2.5">
                    <span className="w-6 shrink-0 text-sm font-semibold text-[var(--signal)] tabular-nums">
                      {item.rank}
                    </span>
                    <div className="min-w-0 space-y-1">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm leading-snug hover:text-[var(--signal)] inline-flex items-start gap-1"
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <ExternalLink size={12} className="mt-0.5 shrink-0 opacity-60" aria-hidden />
                        </a>
                      ) : (
                        <p className="text-sm leading-snug line-clamp-2">{item.title}</p>
                      )}
                      {item.heat != null && item.heat !== "" ? (
                        <p className="text-xs text-[var(--muted)]">热度 {String(item.heat)}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
