import { existsSync, readFileSync } from "fs";
import path from "path";
import { dailyBriefSchema } from "@/lib/intel/schema";
import type { DailyBrief } from "@/lib/intel/types";

const LATEST = path.join(process.cwd(), "data", "briefs", "latest.json");

export function getLatestBrief(): DailyBrief | null {
  try {
    if (!existsSync(LATEST)) return null;
    return dailyBriefSchema.parse(JSON.parse(readFileSync(LATEST, "utf8"))) as DailyBrief;
  } catch (err) {
    console.warn("[briefs-data] parse failed", err);
    return null;
  }
}

export function getBriefByDate(date: string): DailyBrief | null {
  const p = path.join(process.cwd(), "data", "briefs", `daily-${date}.json`);
  try {
    if (!existsSync(p)) return getLatestBrief();
    return dailyBriefSchema.parse(JSON.parse(readFileSync(p, "utf8"))) as DailyBrief;
  } catch {
    return getLatestBrief();
  }
}
