import { existsSync, readFileSync } from "fs";
import path from "path";
import { analyzeEventHeuristic } from "@/lib/intel/analyze";
import { eventsSnapshotSchema } from "@/lib/intel/schema";
import type { EventsSnapshot, IntelEvent } from "@/lib/intel/types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "events", "latest.json");

export type EventsView = {
  snapshot: EventsSnapshot;
  fromFile: boolean;
};

function emptySnapshot(): EventsSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    reportDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date()),
    timezone: "Asia/Shanghai",
    methodNote: "尚无事件快照。请运行 npm run intel:refresh",
    itemCount: 0,
    eventCount: 0,
    thresholds: { titleSimilarity: 0.72 },
    events: [],
  };
}

export function getEventsView(): EventsView {
  try {
    if (existsSync(SNAPSHOT_PATH)) {
      const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
      const parsed = eventsSnapshotSchema.parse(raw) as EventsSnapshot;
      // Ensure analysis for display (top pages may read events without pre-analysis)
      const events = parsed.events.map((e) =>
        e.analysis ? e : { ...e, analysis: analyzeEventHeuristic(e) },
      );
      return { snapshot: { ...parsed, events }, fromFile: true };
    }
  } catch (err) {
    console.warn("[events-data] parse failed", err);
  }
  return { snapshot: emptySnapshot(), fromFile: false };
}

export function getEventById(id: string): IntelEvent | null {
  const { snapshot } = getEventsView();
  return snapshot.events.find((e) => e.id === id) || null;
}

export function getTopEvents(n = 10): IntelEvent[] {
  return getEventsView().snapshot.events.slice(0, n);
}

export function getEventsByStatus(): Record<string, IntelEvent[]> {
  const { snapshot } = getEventsView();
  const buckets: Record<string, IntelEvent[]> = {
    emerging: [],
    rising: [],
    hot: [],
    stable: [],
    cooling: [],
    fading: [],
  };
  for (const e of snapshot.events) {
    (buckets[e.trend_status] ||= []).push(e);
  }
  return buckets;
}
