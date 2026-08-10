import { readFileSync, existsSync } from "fs";
import path from "path";
import { buildSeedBundle } from "@/data/seed";
import { dailyBundleSchema } from "@/lib/schema";
import type { DailyBundle, ToolRecord } from "@/lib/types";

const BUNDLE_PATH = path.join(process.cwd(), "data", "daily-bundle.json");

export type Freshness = "fresh" | "stale" | "missing";

export type BundleView = {
  bundle: DailyBundle;
  freshness: Freshness;
  lastUpdatedAt: string;
  lastUpdatedDate: string;
};

function shanghaiDateString(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function todayShanghai(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function loadRawBundle(): { bundle: DailyBundle; fromFile: boolean } {
  if (existsSync(BUNDLE_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(BUNDLE_PATH, "utf8"));
      const parsed = dailyBundleSchema.parse(raw);
      return { bundle: parsed as DailyBundle, fromFile: true };
    } catch {
      // fall through to seed
    }
  }
  return { bundle: buildSeedBundle("1970-01-01T00:00:00.000Z"), fromFile: false };
}

export function getBundleView(): BundleView {
  const { bundle, fromFile } = loadRawBundle();
  const lastUpdatedDate = shanghaiDateString(bundle.generatedAt);
  const today = todayShanghai();

  let freshness: Freshness = "fresh";
  if (!fromFile) freshness = "missing";
  else if (lastUpdatedDate !== today) freshness = "stale";

  const tools: ToolRecord[] = bundle.tools.map((t) => {
    if (freshness === "stale" || freshness === "missing") {
      return {
        ...t,
        status: t.status === "deprecated" ? "deprecated" : "stale",
      };
    }
    return t;
  });

  return {
    bundle: { ...bundle, tools },
    freshness,
    lastUpdatedAt: bundle.generatedAt,
    lastUpdatedDate,
  };
}

export function getTools(): ToolRecord[] {
  return getBundleView().bundle.tools;
}

export function getToolById(id: string): ToolRecord | undefined {
  return getTools().find((t) => t.id === id);
}

export function getToolsByIds(ids: string[]): ToolRecord[] {
  const map = new Map(getTools().map((t) => [t.id, t]));
  return ids.map((id) => map.get(id)).filter(Boolean) as ToolRecord[];
}

export function categoryCounts(tools: ToolRecord[]) {
  return tools.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}
