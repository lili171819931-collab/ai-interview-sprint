import { existsSync, readFileSync } from "fs";
import path from "path";
import { buildSeedGlobalHotTopics } from "@/data/global-hot-seed";
import { globalHotTopicsSnapshotSchema } from "@/lib/global-hot-schema";
import type { GlobalHotTopicsSnapshot } from "@/lib/global-hot-types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "global-hot-topics.json");

export type GlobalHotTopicsView = {
  snapshot: GlobalHotTopicsSnapshot;
  fromFile: boolean;
};

export function getGlobalHotTopicsView(): GlobalHotTopicsView {
  if (existsSync(SNAPSHOT_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
      const parsed = globalHotTopicsSnapshotSchema.parse(raw) as GlobalHotTopicsSnapshot;
      return { snapshot: parsed, fromFile: true };
    } catch {
      // fall through
    }
  }
  return {
    snapshot: buildSeedGlobalHotTopics(new Date().toISOString()),
    fromFile: false,
  };
}
