/**
 * 日更归档：把当前 data/*.json 快照按报告日期落入 data/archive/YYYY-MM-DD/
 * 并维护 data/history/index.json，供 /history 浏览过往报告。
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import path from "path";

export const SNAPSHOT_FILES = [
  "daily-bundle.json",
  "radar-daily-report.json",
  "builder-pulse-daily.json",
  "trendradar-hot.json",
  "global-hot-topics.json",
  "live-fetch-report.json",
] as const;

export type HistoryDayEntry = {
  date: string;
  archivedAt: string;
  files: string[];
  summary: {
    radarReportDate?: string;
    pulseReportDate?: string;
    hotGeneratedAt?: string;
    bundleGeneratedAt?: string;
    sourcesOk?: number;
    sourcesTotal?: number;
    radarSignals?: number;
  };
};

export type HistoryIndex = {
  updatedAt: string;
  timezone: "Asia/Shanghai";
  days: HistoryDayEntry[];
};

export function shanghaiDay(d: Date | string = new Date()): string {
  const iso = typeof d === "string" ? d : d.toISOString();
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

function readJson(filePath: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 从快照推断归档日期（优先 reportDate，其次 generatedAt 的上海日） */
export function inferSnapshotDate(fileName: string, raw: Record<string, unknown> | null): string | null {
  if (!raw) return null;
  if (typeof raw.reportDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.reportDate)) {
    return raw.reportDate;
  }
  if (typeof raw.generatedAt === "string") {
    return shanghaiDay(raw.generatedAt);
  }
  return null;
}

function summarizeDay(dir: string, files: string[]): HistoryDayEntry["summary"] {
  const summary: HistoryDayEntry["summary"] = {};
  const radar = readJson(path.join(dir, "radar-daily-report.json"));
  const pulse = readJson(path.join(dir, "builder-pulse-daily.json"));
  const hot = readJson(path.join(dir, "global-hot-topics.json"));
  const bundle = readJson(path.join(dir, "daily-bundle.json"));
  if (radar) {
    if (typeof radar.reportDate === "string") summary.radarReportDate = radar.reportDate;
    if (Array.isArray(radar.signals)) summary.radarSignals = radar.signals.length;
  }
  if (pulse && typeof pulse.reportDate === "string") summary.pulseReportDate = pulse.reportDate;
  if (hot && typeof hot.generatedAt === "string") summary.hotGeneratedAt = hot.generatedAt;
  if (bundle && typeof bundle.generatedAt === "string") summary.bundleGeneratedAt = bundle.generatedAt;
  if (hot && hot.stats && typeof hot.stats === "object") {
    const s = hot.stats as Record<string, unknown>;
    if (typeof s.sourcesOk === "number") summary.sourcesOk = s.sourcesOk;
    if (typeof s.sourcesTotal === "number") summary.sourcesTotal = s.sourcesTotal;
  }
  void files;
  return summary;
}

export function rebuildHistoryIndex(root: string): HistoryIndex {
  const archiveRoot = path.join(root, "data", "archive");
  const historyDir = path.join(root, "data", "history");
  mkdirSync(historyDir, { recursive: true });

  const days: HistoryDayEntry[] = [];
  if (existsSync(archiveRoot)) {
    const dirs = readdirSync(archiveRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
      .map((d) => d.name)
      .sort()
      .reverse();
    for (const date of dirs) {
      const dir = path.join(archiveRoot, date);
      const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
      const marker = path.join(dir, "_archived_at.txt");
      const archivedAt = existsSync(marker)
        ? readFileSync(marker, "utf8").trim()
        : new Date().toISOString();
      days.push({
        date,
        archivedAt,
        files,
        summary: summarizeDay(dir, files),
      });
    }
  }

  const index: HistoryIndex = {
    updatedAt: new Date().toISOString(),
    timezone: "Asia/Shanghai",
    days,
  };
  writeFileSync(path.join(historyDir, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
  return index;
}

/**
 * 将当前 data 快照按各自报告日期归档。
 * 同一天重复日更会覆盖该日归档（保留最新一版当天快照），不会删其他日期。
 */
export function archiveCurrentSnapshots(root: string, reason = "pre-refresh"): HistoryIndex {
  const dataDir = path.join(root, "data");
  const archiveRoot = path.join(dataDir, "archive");
  mkdirSync(archiveRoot, { recursive: true });

  const byDate = new Map<string, string[]>();
  for (const name of SNAPSHOT_FILES) {
    const src = path.join(dataDir, name);
    const raw = readJson(src);
    const date = inferSnapshotDate(name, raw);
    if (!date || !existsSync(src)) continue;
    const list = byDate.get(date) || [];
    list.push(name);
    byDate.set(date, list);
  }

  const now = new Date().toISOString();
  for (const [date, files] of byDate) {
    const dir = path.join(archiveRoot, date);
    mkdirSync(dir, { recursive: true });
    for (const name of files) {
      copyFileSync(path.join(dataDir, name), path.join(dir, name));
    }
    writeFileSync(
      path.join(dir, "_archived_at.txt"),
      `${now}\nreason=${reason}\nfiles=${files.join(",")}\n`,
      "utf8",
    );
    console.log(`[archive] ${date} ← ${files.length} files (${reason})`);
  }

  if (byDate.size === 0) {
    console.log("[archive] nothing to archive (no dated snapshots)");
  }

  return rebuildHistoryIndex(root);
}
