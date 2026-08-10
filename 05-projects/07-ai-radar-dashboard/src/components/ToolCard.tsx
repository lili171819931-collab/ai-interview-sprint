import Link from "next/link";
import type { ToolRecord } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { averageScore } from "@/lib/compare";

export function ToolCard({ tool, index = 0 }: { tool: ToolRecord; index?: number }) {
  const avg = averageScore(tool).toFixed(1);
  return (
    <Link
      href={`/tools/${tool.id}`}
      className={`block border-b border-[var(--line)] py-4 hover:bg-[rgba(43,182,115,0.04)] transition-colors rise rise-delay-${Math.min(index, 4)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="display text-lg font-semibold">{tool.name}</h3>
            <span className="tag">{CATEGORY_LABELS[tool.category]}</span>
            {tool.status === "stale" ? <span className="tag tag-amber">stale</span> : null}
          </div>
          <p className="text-[var(--muted)] text-sm leading-relaxed">{tool.oneLiner}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="display text-xl text-[var(--signal)]">{avg}</div>
          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">avg</div>
        </div>
      </div>
    </Link>
  );
}
