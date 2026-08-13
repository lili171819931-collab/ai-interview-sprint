"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type SyncMode = "hourly" | "hot" | null;

/**
 * 页面级实时刷新：
 * - intervalMs：router.refresh 周期
 * - syncMode：到达周期且数据偏旧时触发 /api/refresh
 */
export function PageLiveRefresh({
  intervalMs,
  syncMode = null,
  syncEveryCycles = 1,
  fetchedAt = null,
  label,
}: {
  intervalMs: number;
  syncMode?: SyncMode;
  /** 每 N 个 refresh 周期才跑一次同步（避免每分钟重抓海外全量） */
  syncEveryCycles?: number;
  fetchedAt?: string | null;
  label: string;
}) {
  const router = useRouter();
  const busy = useRef(false);
  const cycles = useRef(0);

  useEffect(() => {
    async function tick() {
      if (busy.current) return;
      busy.current = true;
      cycles.current += 1;
      try {
        const shouldSync =
          Boolean(syncMode) &&
          cycles.current % Math.max(1, syncEveryCycles) === 0;
        if (shouldSync && syncMode) {
          await fetch(`/api/refresh?mode=${syncMode}`, { method: "POST" }).catch(() => null);
        }
        router.refresh();
      } finally {
        busy.current = false;
      }
    }

    const first = window.setTimeout(tick, Math.min(12_000, Math.max(4_000, intervalMs / 4)));
    const id = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [intervalMs, syncMode, syncEveryCycles, router]);

  const cadence =
    intervalMs < 90_000 ? "每分钟自动更新" : intervalMs < 3_600_000 ? "定时自动更新" : "每小时自动更新";

  return (
    <p className="text-xs text-[var(--muted)]" data-fetched-at={fetchedAt || undefined}>
      {label} · {cadence}
    </p>
  );
}
