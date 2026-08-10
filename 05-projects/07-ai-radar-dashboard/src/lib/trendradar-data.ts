import { existsSync, readFileSync } from "fs";
import path from "path";
import { buildSeedTrendRadarSnapshot } from "@/data/trendradar-seed";
import { trendRadarSnapshotSchema } from "@/lib/trendradar-schema";
import type { TrendRadarSnapshot } from "@/lib/trendradar-types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "trendradar-hot.json");

export type TrendRadarView = {
  snapshot: TrendRadarSnapshot;
  fromFile: boolean;
};

export function getTrendRadarView(): TrendRadarView {
  if (existsSync(SNAPSHOT_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
      const parsed = trendRadarSnapshotSchema.parse(raw) as TrendRadarSnapshot;
      return { snapshot: parsed, fromFile: true };
    } catch {
      // fall through
    }
  }
  return {
    snapshot: buildSeedTrendRadarSnapshot(new Date().toISOString()),
    fromFile: false,
  };
}
