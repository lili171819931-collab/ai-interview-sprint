"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatUpdatedAt } from "@/lib/intel/time";

const HOUR_MS = 60 * 60 * 1000;

export function AutoRefresh({ fetchedAt }: { fetchedAt: string | null }) {
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    async function tick() {
      if (busy.current) return;
      busy.current = true;
      try {
        const age = fetchedAt ? Date.now() - Date.parse(fetchedAt) : HOUR_MS + 1;
        if (age >= HOUR_MS - 30_000) {
          await fetch("/api/refresh?mode=hourly", { method: "POST" });
        }
        router.refresh();
      } catch {
        router.refresh();
      } finally {
        busy.current = false;
      }
    }

    const id = window.setInterval(tick, HOUR_MS);
    const age = fetchedAt ? Date.now() - Date.parse(fetchedAt) : Number.POSITIVE_INFINITY;
    const delay = Number.isFinite(age) && age < HOUR_MS ? HOUR_MS - age : 8_000;
    const first = window.setTimeout(tick, Math.max(8_000, Math.min(delay, HOUR_MS)));
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [fetchedAt, router]);

  return (
    <p className="text-xs text-[var(--muted)]">
      更新于 {formatUpdatedAt(fetchedAt)} · 每小时自动更新
    </p>
  );
}
