"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

type SyncMode = "hourly" | "hot" | "github" | "github-hot" | "producthunt" | "opp" | null;

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
  labelKey,
}: {
  intervalMs: number;
  syncMode?: SyncMode;
  syncEveryCycles?: number;
  fetchedAt?: string | null;
  labelKey: MessageKey;
}) {
  const router = useRouter();
  const { t } = useLocale();
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

  const cadenceKey: MessageKey =
    intervalMs < 90_000 ? "refresh.minutely" : intervalMs < 3_600_000 ? "refresh.timed" : "refresh.hourly";

  return (
    <p className="text-xs text-[var(--muted)]" data-fetched-at={fetchedAt || undefined}>
      {t(labelKey)} · {t(cadenceKey)}
    </p>
  );
}
