import Link from "next/link";
import type { HotRankItem } from "@/lib/intel/aihot-types";

function trendOf(it: HotRankItem): "up" | "flat" | "down" {
  if (it.status === "hot" || it.status === "fermenting" || it.status === "new") return "up";
  if (it.rank <= 3) return "flat";
  return "down";
}

function TrendIcon({ trend }: { trend: "up" | "flat" | "down" }) {
  if (trend === "flat") {
    return (
      <svg className="now-hot-trend now-hot-trend-flat" viewBox="0 0 16 12" width="16" height="12" aria-hidden>
        <path d="M1 6h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (trend === "down") {
    return (
      <svg className="now-hot-trend now-hot-trend-down" viewBox="0 0 16 12" width="16" height="12" aria-hidden>
        <path
          d="M1 2.5 L4.5 6 L8 3.5 L11.5 8 L15 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className="now-hot-trend now-hot-trend-up" viewBox="0 0 16 12" width="16" height="12" aria-hidden>
      <path
        d="M1 9.5 L4.5 6 L8 8.5 L11.5 3 L15 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 精选页「当前热点」：对齐 AIHOT 排行 + 热度 + 趋势箭头 */
export function FeaturedHotNow({ items }: { items: HotRankItem[] }) {
  const top = items.slice(0, 5);
  if (!top.length) {
    return (
      <section className="now-hot-card">
        <div className="now-hot-head">
          <h2>当前热点</h2>
          <Link href="/ranking">完整榜单 →</Link>
        </div>
        <p className="text-sm text-[var(--muted)] px-4 pb-4">暂无热点。请运行 npm run aihot:sync。</p>
      </section>
    );
  }

  return (
    <section className="now-hot-card">
      <div className="now-hot-head">
        <h2>当前热点</h2>
        <Link href="/ranking">完整榜单 →</Link>
      </div>
      <ol className="now-hot-list">
        {top.map((it) => {
          const trend = trendOf(it);
          const rankClass =
            it.rank === 1 ? "now-hot-rank-1" : it.rank <= 3 ? "now-hot-rank-23" : "now-hot-rank-rest";
          const href = it.href.startsWith("http") ? it.href : it.href;
          const external = it.href.startsWith("http");
          return (
            <li key={`${it.origin}-${it.id}`} className="now-hot-row">
              <span className={`now-hot-rank ${rankClass}`}>{it.rank}</span>
              {external ? (
                <a href={href} target="_blank" rel="noreferrer" className="zh-title now-hot-title">
                  {it.title}
                </a>
              ) : (
                <Link href={href} className="zh-title now-hot-title">
                  {it.title}
                </Link>
              )}
              <div className="now-hot-metrics">
                <span className="now-hot-heat">{it.heat} 热度</span>
                <TrendIcon trend={trend} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
