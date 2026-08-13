"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { buildGoalBrief } from "@/lib/intel/goal-brief";
import type { HotRankItem } from "@/lib/intel/aihot-types";

export function GoalBriefForm({ hot }: { hot: HotRankItem[] }) {
  const [idea, setIdea] = useState("");
  const [copied, setCopied] = useState(false);
  const brief = useMemo(() => buildGoalBrief({ idea, hot }), [idea, hot]);

  async function copy() {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm text-[var(--muted)]">你的想法（可空，默认用今日最热信号）</span>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          placeholder="例如：围绕 Grok 4.6 做一页「该不该换模型」的对比卡"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-3 text-sm outline-none focus:border-[var(--signal)]"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={copy}>
          {copied ? "已复制" : "复制任务书"}
        </button>
        <Link href="/ranking" className="btn btn-ghost">
          看AI热点榜
        </Link>
        <Link href="/ask" className="btn btn-ghost">
          问问 Agent
        </Link>
      </div>
      <pre className="surface p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">{brief}</pre>
    </div>
  );
}

export function GoalHero() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,182,115,0.45)] bg-[var(--signal-dim)] px-3 py-1 text-xs text-[#b7f0d2]">
      <Compass size={14} aria-hidden />
      leader 七问 · 目标任务书
    </div>
  );
}
