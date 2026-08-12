/**
 * Phase 2 ingest: run SourceAdapters → data/items/{date}.jsonl + latest.json
 *
 *   npm run intel:ingest
 *   INTEL_OFFLINE=1 npm run intel:ingest          # skip RSSHub network
 *   INTEL_ADAPTERS=trendradar,global-hot npm run intel:ingest
 */
import { existsSync, mkdirSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { dedupeItems, shanghaiDay } from "../../src/lib/intel/id";
import { ingestSnapshotSchema } from "../../src/lib/intel/schema";
import type { IngestSnapshot, IntelItem } from "../../src/lib/intel/types";
import { resolveAdapters } from "../adapters/registry";
import { runAdapter } from "../adapters/types";

const root = path.join(__dirname, "..", "..");
const itemsDir = path.join(root, "data", "items");

async function main() {
  const now = new Date();
  const reportDate = shanghaiDay(now);
  const offline = process.env.INTEL_OFFLINE === "1" || process.env.RADAR_OFFLINE === "1";
  const adapters = resolveAdapters();

  console.log(`[intel:ingest] adapters=${adapters.map((a) => a.meta.id).join(",")} offline=${offline}`);

  const all: IntelItem[] = [];
  const adapterMeta: IngestSnapshot["adapters"] = [];

  for (const adapter of adapters) {
    const result = await runAdapter(adapter, { root, now, offline });
    adapterMeta.push({
      id: result.adapterId,
      ok: result.ok,
      itemCount: result.items.length,
      error: result.error,
    });
    if (result.ok) {
      all.push(...result.items);
      console.log(`[intel:ingest] ✓ ${result.adapterId}: ${result.items.length} items`);
    } else {
      console.warn(`[intel:ingest] ✗ ${result.adapterId}: ${result.error}`);
    }
  }

  const items = dedupeItems(all);
  const snapshot: IngestSnapshot = {
    generatedAt: now.toISOString(),
    reportDate,
    timezone: "Asia/Shanghai",
    adapters: adapterMeta,
    totalItems: items.length,
    items,
  };

  const parsed = ingestSnapshotSchema.parse(snapshot);

  mkdirSync(itemsDir, { recursive: true });
  const dayFile = path.join(itemsDir, `${reportDate}.json`);
  const latest = path.join(itemsDir, "latest.json");
  const tmp = path.join(itemsDir, "latest.tmp.json");
  const jsonl = path.join(itemsDir, `${reportDate}.jsonl`);

  const body = JSON.stringify(parsed, null, 2);
  writeFileSync(tmp, body, "utf8");
  renameSync(tmp, latest);
  writeFileSync(dayFile, body, "utf8");
  writeFileSync(jsonl, items.map((it) => JSON.stringify(it)).join("\n") + (items.length ? "\n" : ""), "utf8");

  console.log(`[intel:ingest] wrote ${items.length} items → data/items/latest.json (+ ${reportDate}.json/.jsonl)`);
  if (!existsSync(path.join(root, "data", "user-interests.json"))) {
    console.log("[intel:ingest] tip: edit data/user-interests.json for personalization (Phase 5+)");
  }
}

main().catch((err) => {
  console.error("[intel:ingest] fatal", err);
  process.exit(1);
});
