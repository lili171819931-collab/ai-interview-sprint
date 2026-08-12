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
const hotFile = path.join(dataDir, "global-hot-topics.json");

function shanghaiDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function todayShanghai(): string {
  return shanghaiDay(new Date().toISOString());
}

/** 过滤无信息量的版本号标题，避免雷达被 releases 淹没 */
function isLowSignalTitle(title: string): boolean {
  const t = title.trim();
  if (!t) return true;
  if (/^v?\d+(\.\d+){1,3}([.-]\w+)?$/i.test(t)) return true;
  if (/^(stable|latest|main)$/i.test(t)) return true;
  if (/^[a-z0-9_-]+==\d/i.test(t)) return true;
  if (/^Release v?\d/i.test(t) && t.length < 24) return true;
  return false;
}

function readLiveReport(): LiveFetchReport | null {
  if (!existsSync(liveReportFile)) return null;
  try {
    return JSON.parse(readFileSync(liveReportFile, "utf8")) as LiveFetchReport;
  } catch {
    return null;
  }
}

type HotSnapshot = {
  generatedAt?: string;
  platforms?: Array<{
    name: string;
    region: string;
    items: Array<{ rank: number; title: string; url?: string; heat?: string | number | null }>;
  }>;
};

function readHotSnapshot(): HotSnapshot | null {
  if (!existsSync(hotFile)) return null;
  try {
    return JSON.parse(readFileSync(hotFile, "utf8")) as HotSnapshot;
  } catch {
    return null;
  }
}

function liveItemsToSignals(report: LiveFetchReport, day: string): RadarSignal[] {
  const rows = report.items
    .filter((item) => item.status === "ok" && item.title && item.url)
    .filter((item) => !isLowSignalTitle(item.title || ""))
    .filter((item) => {
      if (!item.publishedAt) return true;
      const ageDays = (Date.now() - Date.parse(item.publishedAt)) / 864e5;
      // 超过 45 天的 changelog/新闻不当作「今日雷达」主信号
      return Number.isFinite(ageDays) ? ageDays <= 45 : true;
    })
    .map((item, index) => {
      const matched = RESEARCH_SOURCES.find(
        (s) =>
          s.id.includes(item.sourceId.replace(/-news.*$/, "")) ||
          item.label.toLowerCase().includes(s.name.split(" ")[0].toLowerCase()),
      );
      const publishedDay = item.publishedAt ? shanghaiDay(item.publishedAt) : day;
      const freshnessBoost = publishedDay === day ? 20 : publishedDay === shanghaiDay(new Date(Date.now() - 864e5).toISOString()) ? 10 : 0;
      return {
        signal: {
          id: `live-${item.sourceId}-${index}`,
          name: item.title!.slice(0, 120),
          category: (item.label.toLowerCase().includes("blog") || item.label.toLowerCase().includes("news")
            ? "news"
            : "official") as RadarSignal["category"],
          pool: matched?.pool ?? ("official_release" as const),
          heat: (publishedDay === day ? 5 : 4) as RadarSignal["heat"],
          confidence: "high" as const,
          updatedAt: publishedDay,
          sourceUrl: item.url!,
          sourceName: item.label,
          pmOpportunity: "核对是否进入候选池 / 更新对应工具 changelog",
          summary: `公开源实时抓取：${item.label}`,
          entities: item.toolIds,
          factKind: "official" as const,
        } satisfies RadarSignal,
        sortKey: freshnessBoost * 1e12 + (item.publishedAt ? Date.parse(item.publishedAt) || 0 : 0),
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((x) => x.signal);

  return rows.slice(0, 16);
}

function hotItemsToSignals(hot: HotSnapshot, day: string): RadarSignal[] {
  const preferred = [
    "Hacker News",
    "Exa 全球科技热点",
    "TechCrunch Social",
    "Product Hunt",
    "知乎热榜",
    "微博热搜",
    "V2EX 热门",
    "B站热搜",
  ];
  const platforms = [...(hot.platforms || [])].sort((a, b) => {
    const ia = preferred.indexOf(a.name);
    const ib = preferred.indexOf(b.name);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const out: RadarSignal[] = [];
  for (const p of platforms) {
    for (const item of p.items.slice(0, 3)) {
      if (!item.title || isLowSignalTitle(item.title)) continue;
      const url = item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title)}`;
      out.push({
        id: `hot-${p.name}-${item.rank}-${item.title.slice(0, 16)}`,
        name: item.title.slice(0, 120),
        category: p.region === "海外" ? "news" : "news",
        pool: "news_brief",
        heat: item.rank <= 3 ? 5 : 4,
        confidence: "medium",
        updatedAt: day,
        sourceUrl: url,
        sourceName: `${p.name}·实时热点`,
        pmOpportunity: "判断是否可转成选题 / 工具机会 / 雷达候选",
        summary: `国内外实时热点聚合（${p.region} / ${p.name}）`,
        entities: [p.name, p.region],
        factKind: "confirmed",
      });
      if (out.length >= 12) return out;
    }
  }
  return out;
}

function main() {
  mkdirSync(dataDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const day = todayShanghai();
  const report = buildSeedRadarReport(generatedAt);
  const live = readLiveReport();
  const hot = readHotSnapshot();

  const fresh: RadarSignal[] = [];
  if (live) fresh.push(...liveItemsToSignals(live, day));
  if (hot) fresh.push(...hotItemsToSignals(hot, day));

  // 今日检索信号置顶，再保留 seed 基线（去重）
  const seen = new Set<string>();
  const merged: RadarSignal[] = [];
  for (const signal of [...fresh, ...report.signals]) {
    const key = `${signal.sourceUrl}::${signal.name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(signal);
  }
  report.signals = merged.slice(0, 40);

  const todayFresh = fresh.filter((s) => s.updatedAt === day).slice(0, 5);
  report.executiveSummary = [
    `今日重新检索：公开源 ${live?.successCount ?? 0} 路成功，热点平台 ${(hot?.platforms || []).length} 个已并入雷达。`,
    todayFresh.length
      ? `最新头条：${todayFresh.map((s) => s.name).join("；").slice(0, 180)}`
      : `已叠加最新公开 changelog / 博客 / 热点；基线监控池信号仍保留。`,
    ...report.executiveSummary.slice(0, 3),
  ].slice(0, 5);

  report.methodNote =
    `雷达日报 ${day} 重新检索生成；优先展示今日 live-fetch + global-hot-topics，过滤纯版本号噪声；` +
    `再叠加 seed 监控池基线。live ${live?.successCount ?? 0} ok。不自动改七维分数。`;

  if (process.env.RADAR_REPORT_KIND === "weekly") {
    report.kind = "weekly";
    report.executiveSummary[0] = `本周雷达复盘（${report.reportDate}）：回顾 5 池信号兑现与噪声。`;
  }

  // stamp reportDate to today explicitly
  report.reportDate = day;
  report.generatedAt = generatedAt;

  const parsed = radarDailyReportSchema.parse(report);
  writeFileSync(tmpFile, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  renameSync(tmpFile, outFile);

  console.log("✅ Radar daily report refreshed (re-retrieved)");
  console.log(`   date     : ${parsed.reportDate}`);
  console.log(`   kind     : ${parsed.kind}`);
  console.log(`   signals  : ${parsed.signals.length} (fresh ${fresh.length})`);
  console.log(`   top      : ${parsed.signals.slice(0, 5).map((s) => s.name).join(" | ")}`);
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
