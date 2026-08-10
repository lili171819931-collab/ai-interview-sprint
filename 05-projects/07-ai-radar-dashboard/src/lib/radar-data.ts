import { existsSync, readFileSync } from "fs";
import path from "path";
import { buildSeedRadarReport } from "@/data/radar-report-seed";
import { radarDailyReportSchema } from "@/lib/radar-schema";
import type { RadarDailyReport } from "@/lib/radar-types";

const REPORT_PATH = path.join(process.cwd(), "data", "radar-daily-report.json");

export type RadarReportView = {
  report: RadarDailyReport;
  fromFile: boolean;
};

export function getRadarReportView(): RadarReportView {
  if (existsSync(REPORT_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(REPORT_PATH, "utf8"));
      const parsed = radarDailyReportSchema.parse(raw) as RadarDailyReport;
      return { report: parsed, fromFile: true };
    } catch {
      // fall through
    }
  }
  return {
    report: buildSeedRadarReport(new Date().toISOString()),
    fromFile: false,
  };
}
