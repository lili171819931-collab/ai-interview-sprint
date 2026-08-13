import Link from "next/link";
import type { HotRankItem } from "@/lib/intel/aihot-types";
import { HOT_STATUS_LABEL } from "@/lib/intel/hot-rank";
import { formatRelativeZh } from "@/lib/intel/time";

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
      <polyline fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}

function TitleLink({ item }: { item: HotRankItem }) {
  const external = item.href.startsWith("http");
  const className = "zh-title";
  const style = { fontSize: "0.98rem" } as const;
  if (external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className} style={style}>
        {item.title}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} style={style}>
      {item.title}
    </Link>
  );
}

export function HotRankList({ items, compact = false }: { items: HotRankItem[]; compact?: boolean }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--muted)]">暂无 AI热点榜。请运行 npm run aihot:sync 或 npm run intel:refresh。</p>;
  }

  if (compact) {
    return (
      <ol className="space-y-3">
        {items.map((it) => (
          <li key={`${it.origin}-${it.id}`} className="flex gap-3">
            <span className="rank-index hot-rank-compact">{pad(it.rank)}</span>
            <div className="min-w-0 space-y-1">
              <TitleLink item={it} />
              <p className="zh-source">
                {it.sourceName}
                {it.sourceCount > 1 ? ` · ${it.sourceCount} 源` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section className="hot-card">
      <div className="hot-card-head">
        <h2 className="display text-lg font-semibold">NOW 当前热点</h2>
        <p className="text-xs text-[var(--muted)]">{items.length} 个事件</p>
      </div>
      <ol>
        {items.map((it) => {
          const rising = it.status === "fermenting" || it.status === "new" || it.status === "hot";
          return (
            <li key={`${it.origin}-${it.id}`} className="hot-row">
              <span className="hot-rank">{pad(it.rank)}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <TitleLink item={it} />
                  {it.status ? <span className={`hot-badge hot-badge-${it.status}`}>{HOT_STATUS_LABEL[it.status]}</span> : null}
                </div>
                <p className="zh-source hot-meta">
                  {it.sourceName} · {formatRelativeZh(it.latestAt)}
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
