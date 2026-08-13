import { existsSync, readFileSync } from "fs";
import path from "path";
import { ingestSnapshotSchema } from "@/lib/intel/schema";
import type { IngestSnapshot, IntelItem } from "@/lib/intel/types";

const LATEST = path.join(process.cwd(), "data", "items", "latest.json");

export function getItemsSnapshot(): IngestSnapshot | null {
  try {
    if (!existsSync(LATEST)) return null;
    return ingestSnapshotSchema.parse(JSON.parse(readFileSync(LATEST, "utf8"))) as IngestSnapshot;
  } catch (err) {
    console.warn("[items-data] parse failed", err);
    return null;
  }
}

export function getIntelItemById(id: string): IntelItem | null {
  return getItemsSnapshot()?.items.find((it) => it.id === id) || null;
}
