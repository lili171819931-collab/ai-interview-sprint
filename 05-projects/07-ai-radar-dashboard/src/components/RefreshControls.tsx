"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { History, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

type Mode = "quick" | "hot" | "full";

export function RefreshControls({
  compact = false,
  defaultMode = "quick",
}: {
  compact?: boolean;
  defaultMode?: Mode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(defaultMode);

  async function runRefresh() {
    setBusy(true);
    setMsg(mode === "full" ? "全量日更进行中（可能需 1–3 分钟）…" : "正在刷新…");
    try {
      const res = await fetch(`/api/refresh?mode=${mode}`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string; logTail?: string };
      if (!res.ok || !data.ok) {
        setMsg(data.error || "刷新失败，请查看终端或改用 npm run daily:refresh");
        return;
      }
      setMsg("已更新为今日数据 · 过往报告已归档");
      router.refresh();
    } catch {
      setMsg("网络或服务异常，请在项目目录运行 npm run daily:refresh");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap items-center gap-2">
        {!compact ? (
          <select
            className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm"
            value={mode}
            disabled={busy}
            onChange={(e) => setMode(e.target.value as Mode)}
            aria-label="刷新模式"
          >
            <option value="quick">快速（雷达+热点）</option>
            <option value="hot">仅热点</option>
            <option value="full">全量日更</option>
          </select>
        ) : null}
        <button
          type="button"
          className="btn btn-primary inline-flex items-center gap-2"
          disabled={busy}
          onClick={runRefresh}
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} aria-hidden />}
          {busy ? "刷新中" : "立即日更"}
        </button>
        <Link href="/history" className="btn btn-ghost inline-flex items-center gap-2">
          <History size={16} aria-hidden />
          历史报告
        </Link>
      </div>
      {msg ? <p className="text-xs text-[var(--muted)] whitespace-pre-wrap">{msg}</p> : null}
    </div>
  );
}
