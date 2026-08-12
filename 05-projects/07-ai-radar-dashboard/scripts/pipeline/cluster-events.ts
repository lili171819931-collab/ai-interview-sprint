/**
 * Phase 4–6: cluster → score → analyze → data/events/latest.json
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { analyzeEvent } from "../../src/lib/intel/analyze";
import { clusterItems } from "../../src/lib/intel/cluster";
import { shanghaiDay } from "../../src/lib/intel/id";
import { eventsSnapshotSchema, ingestSnapshotSchema, userInterestsSchema } from "../../src/lib/intel/schema";
import { scoreClusters } from "../../src/lib/intel/score";
import type { EventsSnapshot, IntelItem, UserInterests } from "../../src/lib/intel/types";

const root = path.join(__dirname, "..", "..");
const itemsLatest = path.join(root, "data", "items", "latest.json");
const eventsDir = path.join(root, "data", "events");
const interestsPath = path.join(root, "data", "user-interests.json");

function loadInterests(): UserInterests | null {
  if (!existsSync(interestsPath)) return null;
  try {
    return userInterestsSchema.parse(JSON.parse(readFileSync(interestsPath, "utf8")));
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(itemsLatest)) {
    console.error("[intel:cluster] missing data/items/latest.json — run npm run intel:ingest first");
    process.exit(1);
  }

  const titleSimilarity = Number(process.env.INTEL_TITLE_SIM || "0.72");
  const analyzeTop = Number(process.env.INTEL_ANALYZE_TOP || "40");
  const ingest = ingestSnapshotSchema.parse(JSON.parse(readFileSync(itemsLatest, "utf8")));
  const interests = loadInterests();
  const now = new Date();
  const itemById = new Map<string, IntelItem>(ingest.items.map((i) => [i.id, i]));

  const clusters = clusterItems(ingest.items, { titleSimilarity });
  let events = scoreClusters(clusters, interests, now);

  // Analyze top-N by heat (full list gets heuristic lazily on read if missing — here we prefill top)
  const top = events.slice(0, Math.max(10, analyzeTop));
  for (let i = 0; i < top.length; i++) {
    const analysis = await analyzeEvent(top[i], itemById);
    top[i] = { ...top[i], analysis };
  }
  const analyzedIds = new Set(top.map((e) => e.id));
  events = events.map((e) => (analyzedIds.has(e.id) ? top.find((t) => t.id === e.id) || e : e));

  const multi = events.filter((e) => e.source_count > 1).length;
  const snapshot: EventsSnapshot = {
    generatedAt: now.toISOString(),
    reportDate: shanghaiDay(now),
    timezone: "Asia/Shanghai",
    methodNote:
      `URL+title cluster (Jaccard≥${titleSimilarity}); TrendScore composite; AI analysis heuristic` +
      (process.env.INTEL_LLM_URL ? "+optional LLM" : "") +
      ` on top ${analyzeTop}. Sources URLs never invented.`,
    itemCount: ingest.items.length,
    eventCount: events.length,
    thresholds: { titleSimilarity },
    events,
  };

  const parsed = eventsSnapshotSchema.parse(snapshot);
  mkdirSync(eventsDir, { recursive: true });
  const body = JSON.stringify(parsed, null, 2);
  const tmp = path.join(eventsDir, "latest.tmp.json");
  const latest = path.join(eventsDir, "latest.json");
  const dayFile = path.join(eventsDir, `${parsed.reportDate}.json`);
  writeFileSync(tmp, body, "utf8");
  renameSync(tmp, latest);
  writeFileSync(dayFile, body, "utf8");

  console.log(
    `[intel:cluster] items=${ingest.items.length} → events=${events.length} (multi=${multi}) analyzed=${top.length}`,
  );
  for (const [i, e] of events.slice(0, 5).entries()) {
    const line = e.analysis?.one_liner?.slice(0, 64) || e.representative_title.slice(0, 48);
    console.log(`  ${i + 1}. [${e.trend_status}] ${e.heat_score} · ${line}`);
  }
  console.log(`[intel:cluster] wrote data/events/latest.json`);
}

main().catch((err) => {
  console.error("[intel:cluster] fatal", err);
  process.exit(1);
});
