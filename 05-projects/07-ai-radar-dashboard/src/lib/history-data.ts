import { existsSync, readFileSync } from "fs";
import path from "path";
import type { HistoryDayEntry, HistoryIndex } from "@/lib/history-types";

const INDEX_PATH = path.join(process.cwd(), "data", "history", "index.json");

export function getHistoryIndex(): HistoryIndex {
  if (!existsSync(INDEX_PATH)) {
    return {
      updatedAt: new Date().toISOString(),
      timezone: "Asia/Shanghai",
      days: [],
    };
  }
  try {
    return JSON.parse(readFileSync(INDEX_PATH, "utf8")) as HistoryIndex;
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      timezone: "Asia/Shanghai",
      days: [],
    };
  }
}

export function getHistoryDay(date: string): HistoryDayEntry | undefined {
  return getHistoryIndex().days.find((d) => d.date === date);
}

export function readArchiveJson<T = unknown>(date: string, fileName: string): T | null {
  const p = path.join(process.cwd(), "data", "archive", date, fileName);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}
