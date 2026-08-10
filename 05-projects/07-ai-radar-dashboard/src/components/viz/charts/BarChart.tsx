export type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

type BarChartProps = {
  title: string;
  data: BarDatum[];
  insight?: string;
  unit?: string;
  max?: number;
  height?: number;
};

const DEFAULT_COLORS = [
  "var(--viz-bar-a)",
  "var(--viz-bar-b)",
  "var(--viz-bar-c)",
  "var(--viz-bar-d)",
  "var(--viz-primary)",
];

export function BarChart({
  title,
  data,
  insight,
  unit = "",
  max,
  height = 180,
}: BarChartProps) {
  if (!data.length) {
    return (
      <div className="surface p-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--muted)] mt-2">暂无数据</p>
      </div>
    );
  }

  const peak = max ?? Math.max(...data.map((d) => d.value), 1);
  const width = 520;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const gap = 12;
  const barW = (chartW - gap * (data.length - 1)) / data.length;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <h3 className="display text-base font-semibold">{title}</h3>
        {unit ? <span className="text-xs text-[var(--muted)]">{unit}</span> : null}
      </div>
      <div className="w-full overflow-x-auto surface p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[320px]"
          role="img"
          aria-label={title}
        >
          <title>{title}</title>
          {[0, 0.5, 1].map((t) => {
            const y = padT + chartH * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth="1"
                />
                <text x={padL - 6} y={y + 3} textAnchor="end" className="viz-label">
                  {Math.round(peak * t)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const h = (d.value / peak) * chartH;
            const x = padL + i * (barW + gap);
            const y = padT + chartH - h;
            const color = d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <g key={d.label}>
                <rect x={x} y={y} width={barW} height={Math.max(h, 1)} fill={color} rx="3" />
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="viz-label"
                  style={{ fill: "var(--text)" }}
                >
                  {d.value}
                </text>
                <text
                  x={x + barW / 2}
                  y={height - 12}
                  textAnchor="middle"
                  className="viz-label"
                >
                  {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {insight ? (
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          <span className="text-[var(--signal)]">所以呢 · </span>
          {insight}
        </p>
      ) : null}
    </div>
  );
}

export function GroupedBarChart({
  title,
  categories,
  series,
  insight,
}: {
  title: string;
  categories: string[];
  series: { name: string; color: string; values: number[] }[];
  insight?: string;
}) {
  const peak = Math.max(...series.flatMap((s) => s.values), 1);
  const width = 640;
  const height = 200;
  const padL = 36;
  const padR = 12;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const groupW = chartW / Math.max(categories.length, 1);
  const barW = Math.min(18, (groupW - 16) / Math.max(series.length, 1));

  return (
    <div className="space-y-2">
      <h3 className="display text-base font-semibold">{title}</h3>
      <div className="w-full overflow-x-auto surface p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[420px]" role="img" aria-label={title}>
          <title>{title}</title>
          {categories.map((cat, i) => {
            const gx = padL + i * groupW + 8;
            return (
              <g key={cat}>
                {series.map((s, j) => {
                  const v = s.values[i] ?? 0;
                  const h = (v / peak) * chartH;
                  const x = gx + j * (barW + 3);
                  const y = padT + chartH - h;
                  return (
                    <rect key={s.name} x={x} y={y} width={barW} height={Math.max(h, 1)} fill={s.color} rx="2" />
                  );
                })}
                <text x={gx + (series.length * (barW + 3)) / 2} y={height - 14} textAnchor="middle" className="viz-label">
                  {cat}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-3 px-2 pb-1">
          {series.map((s) => (
            <span key={s.name} className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      {insight ? (
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          <span className="text-[var(--signal)]">所以呢 · </span>
          {insight}
        </p>
      ) : null}
    </div>
  );
}
