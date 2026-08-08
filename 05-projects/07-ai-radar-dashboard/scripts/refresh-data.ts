import { mkdirSync, writeFileSync, existsSync, readFileSync, renameSync } from "fs";
import path from "path";
import { buildSeedBundle, SEED_HIGHLIGHTS } from "../src/data/seed";
import { assertNoExtremeInferred, dailyBundleSchema } from "../src/lib/schema";
import type { DailyBundle, LiveFetchItem, LiveFetchReport, ToolRecord } from "../src/lib/types";
import { LIVE_SOURCES } from "./live-sources";
import { fetchFeed, shanghaiDay, toIsoDate, type FeedItem } from "./lib/feeds";

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const outFile = path.join(dataDir, "daily-bundle.json");
const tmpFile = path.join(dataDir, "daily-bundle.tmp.json");
const reportFile = path.join(dataDir, "live-fetch-report.json");

type RankedUpdate = {
  toolId: string;
  note: string;
  publishedAt?: string;
  sourceLabel: string;
};

function readPrevious(): DailyBundle | null {
  if (!existsSync(outFile)) return null;
  try {
    return JSON.parse(readFileSync(outFile, "utf8")) as DailyBundle;
  } catch {
    return null;
  }
}

function absolutize(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, base).toString();
  } catch {
    return undefined;
  }
}

function applyItemToTools(
  tools: ToolRecord[],
  toolIds: string[],
  item: FeedItem,
  sourceLabel: string,
  sourceUrl: string,
  level: "official" | "secondary",
  accessedDay: string,
): RankedUpdate[] {
  const publishedIso = toIsoDate(item.publishedAt);
  const day = publishedIso ? shanghaiDay(publishedIso) : accessedDay;
  const summary = item.title.slice(0, 120);
  const link = absolutize(item.url, sourceUrl);
  const updates: RankedUpdate[] = [];

  for (const id of toolIds) {
    const tool = tools.find((t) => t.id === id);
    if (!tool) continue;
    tool.changelogSummary = summary;
    tool.updatedAt = day;
    tool.status = "active";
    const already = tool.sources.some((s) => s.url === link && Boolean(link));
    if (!already) {
      tool.sources = [
        {
          title: `${sourceLabel}: ${summary}`.slice(0, 160),
          ...(link ? { url: link } : {}),
          level,
          accessedAt: accessedDay,
        },
        ...tool.sources,
      ].slice(0, 6);
    }
    updates.push({
      toolId: id,
      note: summary,
      publishedAt: publishedIso,
      sourceLabel,
    });
  }
  return updates;
}

async function runLiveFetch(tools: ToolRecord[]): Promise<{
  report: LiveFetchReport;
  ranked: RankedUpdate[];
}> {
  const offline = process.env.RADAR_OFFLINE === "1";
  const fetchedAt = new Date().toISOString();
  const accessedDay = shanghaiDay(fetchedAt);
  const items: LiveFetchItem[] = [];
  const ranked: RankedUpdate[] = [];

  if (offline) {
    return {
      report: {
        fetchedAt,
        offline: true,
        successCount: 0,
        failureCount: 0,
        items: LIVE_SOURCES.map((s) => ({
          sourceId: s.id,
          label: s.label,
          toolIds: s.toolIds,
          status: "fail" as const,
          error: "RADAR_OFFLINE=1",
        })),
      },
      ranked: [],
    };
  }

  const results = await Promise.all(
    LIVE_SOURCES.map(async (source) => {
      const result = await fetchFeed(source.url, source.kind);
      return { source, result };
    }),
  );

  for (const { source, result } of results) {
    if (!result.ok) {
      items.push({
        sourceId: source.id,
        label: source.label,
        toolIds: source.toolIds,
        status: "fail",
        error: result.error,
      });
      continue;
    }

    const latest = result.items[0];
    const publishedAt = toIsoDate(latest.publishedAt);
    items.push({
      sourceId: source.id,
      label: source.label,
      toolIds: source.toolIds,
      status: "ok",
      title: latest.title,
      url: latest.url,
      publishedAt,
    });

    ranked.push(
      ...applyItemToTools(
        tools,
        source.toolIds,
        latest,
        source.label,
        source.url,
        source.level,
        accessedDay,
      ),
    );
  }

  const successCount = items.filter((i) => i.status === "ok").length;
  const failureCount = items.filter((i) => i.status === "fail").length;

  return {
    report: { fetchedAt, offline: false, successCount, failureCount, items },
    ranked,
  };
}

function buildHighlights(ranked: RankedUpdate[], toolIds: Set<string>) {
  const sorted = [...ranked].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  const seen = new Set<string>();
  const live: { toolId: string; note: string }[] = [];
  for (const u of sorted) {
    if (seen.has(u.toolId)) continue;
    if (!toolIds.has(u.toolId)) continue;
    seen.add(u.toolId);
    live.push({ toolId: u.toolId, note: `[日更] ${u.note}` });
    if (live.length >= 5) break;
  }

  if (live.length >= 3) return live;

  const filled = [...live];
  for (const h of SEED_HIGHLIGHTS) {
    if (filled.some((x) => x.toolId === h.toolId)) continue;
    filled.push(h);
    if (filled.length >= 5) break;
  }
  return filled.slice(0, 5);
}

async function main() {
  mkdirSync(dataDir, { recursive: true });
  const previous = readPrevious();
  const bundle = buildSeedBundle(new Date().toISOString());

  const { report, ranked } = await runLiveFetch(bundle.tools);
  bundle.liveFetch = report;
  bundle.highlights = buildHighlights(
    ranked,
    new Set(bundle.tools.map((t) => t.id)),
  );

  const ok = report.successCount;
  const fail = report.failureCount;
  bundle.methodNote = report.offline
    ? `离线模式（RADAR_OFFLINE=1）：仅校验并写入 seed，未请求外网。工具 ${bundle.tools.length} 款。`
    : `公开源日更：${ok}/${ok + fail} 路成功` +
      (fail ? `，${fail} 路失败已跳过` : "") +
      `；seed 人工底座 + RSS/Atom/公开 Changelog；分数不因抓取自动改写。`;

  if (process.env.RADAR_METHOD_NOTE) {
    bundle.methodNote = process.env.RADAR_METHOD_NOTE;
  }

  const parsed = dailyBundleSchema.parse(bundle);
  assertNoExtremeInferred(parsed.tools);

  writeFileSync(tmpFile, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  renameSync(tmpFile, outFile);
  writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log("✅ Daily bundle refreshed");
  console.log(`   previous : ${previous?.generatedAt ?? "(none)"}`);
  console.log(`   current  : ${parsed.generatedAt}`);
  console.log(`   tools    : ${parsed.tools.length}`);
  console.log(`   live     : ${ok} ok / ${fail} fail` + (report.offline ? " (offline)" : ""));
  console.log(`   file     : ${outFile}`);
  console.log(`   report   : ${reportFile}`);
  for (const item of report.items) {
    const mark = item.status === "ok" ? "✓" : "✗";
    const detail = item.status === "ok" ? item.title : item.error;
    console.log(`   ${mark} ${item.sourceId}: ${detail}`);
  }
}

main().catch((err) => {
  console.error("❌ Refresh failed — previous snapshot kept (if any)");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
