import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { buildSeedRadarReport } from "../src/data/radar-report-seed";
import { MONITOR_POOL_LABELS, RESEARCH_SOURCES } from "../src/data/research-sources";
import { radarDailyReportSchema } from "../src/lib/radar-schema";
import type { LiveFetchReport } from "../src/lib/types";
import type { RadarSignal } from "../src/lib/radar-types";

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const outFile = path.join(dataDir, "radar-daily-report.json");
const tmpFile = path.join(dataDir, "radar-daily-report.tmp.json");
const liveReportFile = path.join(dataDir, "live-fetch-report.json");

function shanghaiDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function readLiveReport(): LiveFetchReport | null {
  if (!existsSync(liveReportFile)) return null;
  try {
    return JSON.parse(readFileSync(liveReportFile, "utf8")) as LiveFetchReport;
  } catch {
    return null;
  }
}

function liveItemsToSignals(report: LiveFetchReport, day: string): RadarSignal[] {
  return report.items
    .filter((item) => item.status === "ok" && item.title && item.url)
    .slice(0, 12)
    .map((item, index) => {
      const matched = RESEARCH_SOURCES.find(
        (s) =>
          s.id.includes(item.sourceId.replace(/-news.*$/, "")) ||
          item.label.toLowerCase().includes(s.name.split(" ")[0].toLowerCase()),
      );
      return {
        id: `live-${item.sourceId}-${index}`,
        name: item.title!.slice(0, 120),
        category: "official" as const,
        pool: matched?.pool ?? ("official_release" as const),
        heat: 4 as const,
        confidence: "high" as const,
        updatedAt: item.publishedAt ? shanghaiDay(item.publishedAt) : day,
        sourceUrl: item.url!,
        sourceName: item.label,
        pmOpportunity: "核对是否需要更新对应工具 changelog / 候选池",
        summary: `公开源日更抓取成功：${item.label}`,
        entities: item.toolIds,
        factKind: "official" as const,
      };
    });
}

function main() {
  mkdirSync(dataDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const report = buildSeedRadarReport(generatedAt);
  const live = readLiveReport();

  if (live) {
    const liveSignals = liveItemsToSignals(live, report.reportDate);
    const seen = new Set(report.signals.map((s) => s.sourceUrl));
    for (const signal of liveSignals) {
      if (seen.has(signal.sourceUrl)) continue;
      report.signals.unshift(signal);
      seen.add(signal.sourceUrl);
    }
    report.executiveSummary = [
      `公开源抓取 ${live.successCount} 成功 / ${live.failureCount} 失败，已叠加进雷达信号。`,
      ...report.executiveSummary.slice(0, 4),
    ].slice(0, 5);
    report.methodNote =
      `雷达日报生成于 ${report.reportDate}；叠加 live-fetch-report（${live.successCount} ok）。` +
      ` 监控池：${Object.values(MONITOR_POOL_LABELS).join(" / ")}。不自动改七维分数。`;
  }

  if (process.env.RADAR_REPORT_KIND === "weekly") {
    report.kind = "weekly";
    report.executiveSummary[0] = `本周雷达复盘（${report.reportDate}）：回顾 5 池信号兑现与噪声。`;
  }

  // Keep board readable
  report.signals = report.signals.slice(0, 40);

  const parsed = radarDailyReportSchema.parse(report);
  writeFileSync(tmpFile, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  renameSync(tmpFile, outFile);

  console.log("✅ Radar daily report refreshed");
  console.log(`   date     : ${parsed.reportDate}`);
  console.log(`   kind     : ${parsed.kind}`);
  console.log(`   signals  : ${parsed.signals.length}`);
  console.log(`   pools    : ${parsed.monitorPools.map((p) => `${p.label}:${p.sourceCount}`).join(", ")}`);
  console.log(`   file     : ${outFile}`);
}

try {
  main();
} catch (err) {
  console.error("❌ Radar report refresh failed — previous file kept (if any)");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
