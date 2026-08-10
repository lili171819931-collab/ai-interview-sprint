import Link from "next/link";
import type { Category, ToolRecord } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

const CAT_COLOR: Record<Category, string> = {
  assistant: "var(--viz-cat-assistant)",
  platform: "var(--viz-cat-platform)",
  agent: "var(--viz-cat-agent)",
  vertical: "var(--viz-cat-vertical)",
};

type CapabilityMindmapProps = {
  tools: ToolRecord[];
};

export function CapabilityMindmap({ tools }: CapabilityMindmapProps) {
  const byCat = tools.reduce(
    (acc, t) => {
      (acc[t.category] = acc[t.category] ?? []).push(t);
      return acc;
    },
    {} as Record<string, ToolRecord[]>,
  );

  const width = 920;
  const height = 440;
  const cx = width / 2;
  const cy = height / 2;
  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full" role="img" aria-label="AI 工具能力地图">
        <title>AI 工具能力地图</title>
        {categories.map((cat, i) => {
          const angle = (i / categories.length) * Math.PI * 2 - Math.PI / 2;
          const bx = cx + Math.cos(angle) * 220;
          const by = cy + Math.sin(angle) * 140;
          const list = byCat[cat] ?? [];
          const color = CAT_COLOR[cat];
          return (
            <g key={cat}>
              <line x1={cx} y1={cy} x2={bx} y2={by} stroke={color} strokeWidth="1.5" opacity="0.7" />
              <rect
                x={bx - 70}
                y={by - 24}
                width="140"
                height="48"
                rx="8"
                fill="var(--panel)"
                stroke={color}
                strokeWidth="1.5"
              />
              <text x={bx} y={by + 2} textAnchor="middle" fill="var(--text)" style={{ fontSize: 12, fontWeight: 600 }}>
                {CATEGORY_LABELS[cat]}
              </text>
              <text x={bx} y={by + 18} textAnchor="middle" fill={color} style={{ fontSize: 10 }}>
                {list.length} 款
              </text>
              {list.slice(0, 5).map((t, j) => {
                const tx = bx + (j % 2 === 0 ? -1 : 1) * 150;
                const ty = by - 60 + j * 28;
                return (
                  <Link key={t.id} href={`/tools/${t.id}`}>
                    <g className="cursor-pointer">
                      <line
                        x1={bx + (j % 2 === 0 ? -70 : 70)}
                        y1={by}
                        x2={tx}
                        y2={ty}
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.45"
                      />
                      <rect
                        x={tx - 68}
                        y={ty - 13}
                        width="136"
                        height="26"
                        rx="6"
                        fill="var(--ink-2)"
                        stroke={color}
                        strokeWidth="1"
                      />
                      <text x={tx} y={ty + 4} textAnchor="middle" fill="var(--muted)" style={{ fontSize: 10 }}>
                        {t.name.length > 12 ? t.name.slice(0, 11) + "…" : t.name}
                      </text>
                    </g>
                  </Link>
                );
              })}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="54" fill="var(--viz-primary-dim)" stroke="var(--viz-primary)" strokeWidth="2" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text)" style={{ fontSize: 16, fontWeight: 700 }}>
          AI 工具
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--viz-primary)" style={{ fontSize: 16, fontWeight: 700 }}>
          格局
        </text>
      </svg>
      <div className="flex flex-wrap gap-3 px-2 pb-2 mt-2">
        {categories.map((c) => (
          <span key={c} className="text-xs text-[var(--muted)] inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CAT_COLOR[c] }} />
            {CATEGORY_LABELS[c]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DecisionTree({ selectedCount }: { selectedCount: number }) {
  const width = 920;
  const height = 300;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full" role="img" aria-label="选型决策树">
        <title>选型决策树</title>
        <rect x={360} y={20} width="200" height="48" rx="8" fill="#fff" stroke="var(--viz-primary)" strokeWidth="1.5" />
        <text x={460} y={49} textAnchor="middle" fill="var(--report-ink)" style={{ fontSize: 13, fontWeight: 600 }}>
          当前已选 {selectedCount} 款
        </text>

        <line x1={460} y1={68} x2={230} y2={120} stroke="var(--viz-cat-assistant)" strokeWidth="1.5" />
        <line x1={460} y1={68} x2={460} y2={120} stroke="var(--viz-cat-platform)" strokeWidth="1.5" />
        <line x1={460} y1={68} x2={690} y2={120} stroke="var(--viz-cat-agent)" strokeWidth="1.5" />

        {[
          { x: 160, title: "个人创作", desc: "ease ×2 + quality", color: "var(--viz-cat-assistant)" },
          { x: 390, title: "工程师", desc: "ecosystem ×2 + quality", color: "var(--viz-cat-platform)" },
          { x: 620, title: "企业采购", desc: "compliance ×2 + ecosystem", color: "var(--viz-cat-agent)" },
        ].map((n) => (
          <g key={n.title}>
            <rect x={n.x} y={120} width="140" height="56" rx="8" fill="#fff" stroke={n.color} strokeWidth="1.5" />
            <text x={n.x + 70} y={145} textAnchor="middle" fill="var(--report-ink)" style={{ fontSize: 12, fontWeight: 600 }}>
              {n.title}
            </text>
            <text x={n.x + 70} y={162} textAnchor="middle" fill="var(--report-muted)" style={{ fontSize: 10 }}>
              {n.desc}
            </text>
          </g>
        ))}

        <line x1={230} y1={176} x2={230} y2={230} stroke="var(--viz-neutral)" strokeWidth="1.5" />
        <line x1={460} y1={176} x2={460} y2={230} stroke="var(--viz-neutral)" strokeWidth="1.5" />
        <line x1={690} y1={176} x2={690} y2={230} stroke="var(--viz-neutral)" strokeWidth="1.5" />

        <rect x={90} y={230} width="740" height="44" rx="8" fill="var(--viz-primary-dim)" stroke="var(--viz-primary)" strokeWidth="1.5" />
        <text x={460} y={257} textAnchor="middle" fill="var(--report-ink)" style={{ fontSize: 12, fontWeight: 600 }}>
          输出：相对建议 + 证据引用（不输出绝对第一）
        </text>
      </svg>
    </div>
  );
}

export { CAT_COLOR };
