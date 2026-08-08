import type { ToolRecord } from "@/lib/types";
import { COMPARE_KEYS } from "@/lib/compare";
import { SCORE_LABELS } from "@/lib/types";

const COLORS = [
  "var(--viz-bar-a)",
  "var(--viz-bar-b)",
  "var(--viz-bar-c)",
  "var(--viz-bar-d)",
];

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export function RadarChart({ tools }: { tools: ToolRecord[] }) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 120;
  const n = COMPARE_KEYS.length;

  const rings = [1, 2, 3, 4, 5];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[420px] mx-auto" role="img" aria-label="七维雷达对比">
        <title>七维雷达对比</title>
        {rings.map((level) => {
          const pts = COMPARE_KEYS.map((_, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            return polar(cx, cy, (level / 5) * maxR, a);
          });
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
          return (
            <path
              key={level}
              d={d}
              fill="none"
              stroke="var(--line)"
              strokeWidth="1"
            />
          );
        })}
        {COMPARE_KEYS.map((key, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const tip = polar(cx, cy, maxR, a);
          const label = polar(cx, cy, maxR + 22, a);
          return (
            <g key={key}>
              <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="var(--line)" strokeWidth="1" />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--muted)"
                style={{ fontSize: 10 }}
              >
                {SCORE_LABELS[key].slice(0, 2)}
              </text>
            </g>
          );
        })}
        {tools.map((tool, ti) => {
          const pts = COMPARE_KEYS.map((key, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            return polar(cx, cy, (tool.scores[key] / 5) * maxR, a);
          });
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
          const color = COLORS[ti % COLORS.length];
          return (
            <g key={tool.id}>
              <path d={d} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {tools.map((t, i) => (
          <span key={t.id} className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function dimensionWinners(tools: ToolRecord[]) {
  return COMPARE_KEYS.map((key) => {
    const ranked = [...tools].sort((a, b) => b.scores[key] - a.scores[key]);
    const top = ranked[0];
    const tied = ranked.filter((t) => t.scores[key] === top.scores[key]);
    return {
      key,
      label: SCORE_LABELS[key],
      winners: tied.map((t) => t.name),
      score: top.scores[key],
    };
  });
}
