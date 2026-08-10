import Link from "next/link";
import type { DailyBundle, SourceRef } from "@/lib/types";
import { IconChip } from "@/components/IconChip";
import { SOURCE_LEVEL_ICONS } from "@/components/icons";

const LEVEL_LABEL: Record<SourceRef["level"], string> = {
  official: "官方",
  first_hand: "一手",
  secondary: "二手",
  inferred: "推断",
};

type NodeTone = "primary" | "warn" | "danger" | "neutral";

const toneStyles: Record<NodeTone, { border: string; bg: string; accent: string }> = {
  primary: {
    border: "border-[var(--viz-primary)]",
    bg: "bg-[var(--viz-primary-dim)]",
    accent: "text-[var(--viz-primary)]",
  },
  warn: {
    border: "border-[var(--viz-warn)]",
    bg: "bg-[var(--viz-warn-dim)]",
    accent: "text-[var(--viz-warn)]",
  },
  danger: {
    border: "border-[var(--viz-danger)]",
    bg: "bg-[var(--viz-danger-dim)]",
    accent: "text-[var(--viz-danger)]",
  },
  neutral: {
    border: "border-[var(--line)]",
    bg: "bg-transparent",
    accent: "text-[var(--muted)]",
  },
};

const levelDot: Record<SourceRef["level"], string> = {
  official: "bg-[var(--viz-primary)]",
  first_hand: "bg-[var(--viz-bar-a)]",
  secondary: "bg-[var(--viz-warn)]",
  inferred: "bg-[var(--viz-danger)]",
};

export function GlobalDataChain({ bundle }: { bundle: DailyBundle }) {
  const live = bundle.liveFetch;
  const ok = live?.successCount ?? 0;
  const fail = live?.failureCount ?? 0;
  const fetched = live?.fetchedAt
    ? new Date(live.fetchedAt).toLocaleString("zh-CN", { hour12: false })
    : "—";
  const generated = new Date(bundle.generatedAt).toLocaleString("zh-CN", { hour12: false });

  const nodes: { title: string; desc: string; meta: string; tone: NodeTone }[] = [
    {
      title: "公开源",
      desc: "RSS / Atom / Changelog",
      meta: `${ok} 路成功${fail ? ` · ${fail} 失败` : ""}`,
      tone: fail > 0 ? "warn" : ok > 0 ? "primary" : "neutral",
    },
    {
      title: "抓取",
      desc: "并行请求 · 超时降级",
      meta: live?.offline ? "离线模式" : fetched,
      tone: live?.offline ? "warn" : "primary",
    },
    {
      title: "校验合并",
      desc: "Zod 契约 + seed 底座",
      meta: `${bundle.tools.length} 款工具`,
      tone: "primary",
    },
    {
      title: "原子写入",
      desc: "daily-bundle.json",
      meta: generated,
      tone: "primary",
    },
    {
      title: "页面呈现",
      desc: "fresh / stale / missing",
      meta: "可降级快照",
      tone: "neutral",
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-stretch gap-2 min-w-max">
        {nodes.map((n, i) => {
          const t = toneStyles[n.tone];
          return (
            <div key={n.title} className="flex items-center gap-2">
              <Link
                href="/sources"
                className={`surface px-3 py-3 w-44 shrink-0 border ${t.border} ${t.bg} hover:opacity-95 transition-opacity`}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{n.desc}</p>
                <p className={`text-[11px] mt-2 font-mono truncate ${t.accent}`}>{n.meta}</p>
              </Link>
              {i < nodes.length - 1 ? (
                <svg width="26" height="20" viewBox="0 0 26 20" className="shrink-0" aria-hidden="true">
                  <path
                    d="M0 10 H18"
                    stroke={n.tone === "warn" ? "var(--viz-warn)" : "var(--viz-primary)"}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M18 5 L25 10 L18 15"
                    stroke={n.tone === "warn" ? "var(--viz-warn)" : "var(--viz-primary)"}
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ToolSourceChain({ sources }: { sources: SourceRef[] }) {
  const ordered = [...sources].sort((a, b) => {
    const rank = { official: 0, first_hand: 1, secondary: 2, inferred: 3 };
    return rank[a.level] - rank[b.level];
  });

  return (
    <div className="space-y-2">
      {ordered.map((s, i) => (
        <div key={`${s.title}-${i}`} className="flex items-start gap-2">
          <div className="flex flex-col items-center shrink-0 pt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${levelDot[s.level]}`} />
            {i < ordered.length - 1 ? (
              <span className="w-px h-6 bg-[var(--viz-neutral)] my-1 opacity-50" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <IconChip
                icon={SOURCE_LEVEL_ICONS[s.level]}
                label={LEVEL_LABEL[s.level]}
                tone={s.level === "official" ? "signal" : s.level === "inferred" ? "amber" : "neutral"}
              />
              <span className="text-xs text-[var(--muted)]">{s.accessedAt}</span>
            </div>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-[var(--signal)] underline mt-1 break-all"
              >
                {s.title}
              </a>
            ) : (
              <p className="text-sm mt-1 text-[var(--text)]/90">{s.title}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
