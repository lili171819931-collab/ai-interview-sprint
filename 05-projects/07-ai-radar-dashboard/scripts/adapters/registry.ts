import { globalHotAdapter } from "./global-hot";
import { rsshubAdapter } from "./rsshub";
import { trendradarAdapter } from "./trendradar";
import type { SourceAdapter } from "./types";

const ALL: SourceAdapter[] = [trendradarAdapter, globalHotAdapter, rsshubAdapter];

export function listAdapters(): SourceAdapter[] {
  return [...ALL];
}

export function getAdapter(id: string): SourceAdapter | undefined {
  return ALL.find((a) => a.meta.id === id);
}

/** Comma-separated INTEL_ADAPTERS=trendradar,global-hot,rsshub */
export function resolveAdapters(): SourceAdapter[] {
  const raw = process.env.INTEL_ADAPTERS?.trim();
  if (!raw || raw === "all") return listAdapters();
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.map((id) => getAdapter(id)).filter((a): a is SourceAdapter => Boolean(a));
}
