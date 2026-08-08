type FlowTone = "primary" | "warn" | "danger" | "neutral";

type FlowNode = {
  title: string;
  desc?: string;
  tone?: FlowTone;
};

type FlowDiagramProps = {
  nodes: FlowNode[];
  variant?: "dark" | "report";
  title?: string;
};

const toneStroke: Record<FlowTone, string> = {
  primary: "var(--viz-primary)",
  warn: "var(--viz-warn)",
  danger: "var(--viz-danger)",
  neutral: "var(--viz-neutral)",
};

const toneFill: Record<FlowTone, string> = {
  primary: "var(--viz-primary-dim)",
  warn: "var(--viz-warn-dim)",
  danger: "var(--viz-danger-dim)",
  neutral: "transparent",
};

export function FlowDiagram({ nodes, variant = "dark", title }: FlowDiagramProps) {
  const isReport = variant === "report";
  const width = Math.max(900, nodes.length * 130);
  const height = 150;
  const nodeW = 118;
  const gap = (width - nodeW * nodes.length) / (nodes.length + 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[560px] w-full"
        role="img"
        aria-label={title ?? "流程图"}
      >
        {title ? <title>{title}</title> : null}
        {nodes.map((n, i) => {
          const tone = n.tone ?? "primary";
          const x = gap * (i + 1) + nodeW * i;
          const y = 30;
          const stroke = isReport ? "var(--report-line)" : toneStroke[tone];
          const fill = isReport ? "#ffffff" : toneFill[tone];
          const titleFill = isReport ? "var(--report-ink)" : "var(--text)";
          const labelFill = isReport ? "var(--report-muted)" : "var(--muted)";
          return (
            <g key={n.title}>
              <rect
                x={x}
                y={y}
                width={nodeW}
                height={64}
                rx={6}
                fill={fill}
                stroke={stroke}
                strokeWidth="1.5"
              />
              <text
                x={x + nodeW / 2}
                y={y + 28}
                textAnchor="middle"
                fill={titleFill}
                style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)" }}
              >
                {n.title}
              </text>
              {n.desc ? (
                <text
                  x={x + nodeW / 2}
                  y={y + 46}
                  textAnchor="middle"
                  fill={labelFill}
                  style={{ fontSize: 10, fontFamily: "var(--font-body)" }}
                >
                  {n.desc}
                </text>
              ) : null}
              {i < nodes.length - 1 ? (
                <path
                  d={`M ${x + nodeW} ${y + 32} H ${x + nodeW + gap} M ${x + nodeW + gap - 6} ${y + 26} L ${x + nodeW + gap} ${y + 32} L ${x + nodeW + gap - 6} ${y + 38}`}
                  stroke={toneStroke[tone]}
                  strokeWidth="1.5"
                  fill="none"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RefreshPipelineFlow({
  report,
}: {
  report: { offline: boolean; successCount: number; failureCount: number };
}) {
  return (
    <FlowDiagram
      title="日更数据管道"
      nodes={[
        { title: "触发", desc: "手动 / 定时", tone: "neutral" },
        { title: "并行抓取", desc: `${report.successCount} 成功`, tone: "primary" },
        {
          title: "失败跳过",
          desc: `${report.failureCount} 路容错`,
          tone: report.failureCount > 0 ? "warn" : "primary",
        },
        { title: "合并", desc: "seed + changelog", tone: "primary" },
        { title: "校验", desc: "Zod + 极端分", tone: "primary" },
        { title: "原子写入", desc: "bundle", tone: "primary" },
        {
          title: "页面",
          desc: report.offline ? "离线" : "fresh/stale",
          tone: report.offline ? "warn" : "primary",
        },
      ]}
    />
  );
}

export function CompareDecisionFlow() {
  return (
    <FlowDiagram
      title="对比决策流"
      nodes={[
        { title: "选 2–4 款", desc: "同品类优先", tone: "neutral" },
        { title: "维度对照", desc: "七维评分", tone: "primary" },
        { title: "证据核对", desc: "sources", tone: "warn" },
        { title: "场景建议", desc: "个人/工程/企业", tone: "primary" },
      ]}
    />
  );
}
