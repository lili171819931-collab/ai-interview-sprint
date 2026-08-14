"use client";

export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || (data as { error?: string }).error) {
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return data;
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
