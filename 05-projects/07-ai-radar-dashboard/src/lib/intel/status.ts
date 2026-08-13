import { existsSync, readFileSync } from "fs";
import path from "path";
import { getAihotDailySnapshot, getAihotHotSnapshot, getAihotItemsSnapshot } from "@/lib/intel/aihot-data";
import { getModelLeaderboard } from "@/lib/intel/models-data";

const META = path.join(process.cwd(), "data", "aihot", "meta.json");
const HOUR_MS = 60 * 60 * 1000;

export type RadarStatus = {
  fetchedAt: string | null;
  stale: boolean;
  intervalMinutes: 60;
  nextAt: string | null;
  sources: { aihot: boolean; models: boolean };
};

export function getRadarStatus(): RadarStatus {
  let fetchedAt: string | null = null;
  try {
    if (existsSync(META)) {
      const meta = JSON.parse(readFileSync(META, "utf8")) as { fetchedAt?: string };
      fetchedAt = meta.fetchedAt || null;
    }
  } catch {
    fetchedAt = null;
  }
  if (!fetchedAt) {
    fetchedAt =
      getAihotItemsSnapshot()?.fetchedAt ||
      getAihotHotSnapshot()?.fetchedAt ||
      getAihotDailySnapshot()?.fetchedAt ||
      getModelLeaderboard()?.fetchedAt ||
      null;
  }
  const ts = fetchedAt ? Date.parse(fetchedAt) : NaN;
  const stale = !Number.isFinite(ts) || Date.now() - ts > HOUR_MS;
  const nextAt = Number.isFinite(ts) ? new Date(ts + HOUR_MS).toISOString() : null;
  return {
    fetchedAt,
    stale,
    intervalMinutes: 60,
    nextAt,
    sources: {
      aihot: Boolean(getAihotItemsSnapshot()?.items.length || getAihotHotSnapshot()?.items.length),
      models: Boolean(getModelLeaderboard()?.items.length),
    },
  };
}
