import type { StoryHeatPoint } from "@/lib/intel/story-types";

function fmtHour(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:00`;
}

/** 24h 热度曲线（纯 SVG，服务端渲染） */
export function StoryHeatChart({ points, peakAt }: { points: StoryHeatPoint[]; peakAt: string }) {
  if (!points.length) {
    return <p className="text-xs text-[var(--muted)]">暂无热度曲线数据。</p>;
  }
  const W = 760;
  const H = 180;
  const PAD = { top: 18, right: 16, bottom: 26, left: 40 };
  const xs = points.map((p) => Date.parse(p.at));
  const ys = points.map((p) => p.heat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys, 1);
  const spanX = Math.max(1, maxX - minX);
  const px = (x: number) => PAD.left + ((x - minX) / spanX) * (W - PAD.left - PAD.right);
  const py = (y: number) => H - PAD.bottom - (y / maxY) * (H - PAD.top - PAD.bottom);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(Date.parse(p.at)).toFixed(1)},${py(p.heat).toFixed(1)}`).join(" ");
  const area = `${line} L${px(maxX).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${px(minX).toFixed(1)},${(H - PAD.bottom).toFixed(1)} Z`;

  // x 轴刻度：取首/中/尾 3-4 个点
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i,
  );
  const peakIdx = points.findIndex((p) => p.at === peakAt);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="story-heat-svg" role="img" aria-label="24 小时热度曲线">
      <defs>
        <linearGradient id="storyHeatFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((r) => (
        <line
          key={r}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + (H - PAD.top - PAD.bottom) * r}
          y2={PAD.top + (H - PAD.top - PAD.bottom) * r}
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      ))}
      <path d={area} fill="url(#storyHeatFill)" />
      <path d={line} fill="none" stroke="var(--signal)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {peakIdx >= 0 ? (
        <g>
          <circle cx={px(xs[peakIdx])} cy={py(ys[peakIdx])} r="4" fill="var(--amber)" />
          <text x={px(xs[peakIdx])} y={py(ys[peakIdx]) - 9} textAnchor="middle" className="story-heat-peak-label">
            峰值
          </text>
        </g>
      ) : null}
      <circle cx={px(xs[xs.length - 1])} cy={py(ys[ys.length - 1])} r="3.4" fill="var(--signal)" />
      <text x={px(xs[xs.length - 1])} y={py(ys[ys.length - 1]) - 9} textAnchor="middle" className="story-heat-now-label">
        现在
      </text>
      {ticks.map((i) => (
        <text key={i} x={px(xs[i])} y={H - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="story-heat-axis">
          {fmtHour(points[i].at)}
        </text>
      ))}
    </svg>
  );
}
