/**
 * 从本地 TrendRadar SQLite 同步热点 → data/trendradar-hot.json
 * 依赖：08-resources/TrendRadar 已安装并至少跑过一次 `uv run python -m trendradar`
 */
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { buildSeedTrendRadarSnapshot } from "../src/data/trendradar-seed";
import { trendRadarSnapshotSchema } from "../src/lib/trendradar-schema";
import type { TrendRadarSnapshot } from "../src/lib/trendradar-types";

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const outFile = path.join(dataDir, "trendradar-hot.json");
const tmpFile = path.join(dataDir, "trendradar-hot.tmp.json");

const DEFAULT_TR_ROOT = path.join(root, "..", "..", "08-resources", "TrendRadar");

const AI_RE =
  /\bAI\b|人工智能|大模型|ChatGPT|Claude|OpenAI|GPT|LLM|智能体|Agent|深度学习|机器学习|算力|芯片|算力|AIGC|生成式/i;

function shanghaiDay(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function resolveTrendRadarRoot(): string {
  return process.env.TRENDRADAR_ROOT?.trim() || DEFAULT_TR_ROOT;
}

function findLatestNewsDb(trRoot: string): string | null {
  const newsDir = path.join(trRoot, "output", "news");
  if (!existsSync(newsDir)) return null;
  const preferred = path.join(newsDir, `${shanghaiDay()}.db`);
  if (existsSync(preferred)) return preferred;
  // fallback: newest *.db by name
  const { readdirSync, statSync } = require("fs") as typeof import("fs");
  const files = readdirSync(newsDir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => path.join(newsDir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] || null;
}

type DumpRow = {
  id: number;
  title: string;
  platform_id: string;
  platform_name: string;
  rank: number;
  url: string;
  first_crawl_time: string;
  last_crawl_time: string;
};

type DumpPayload = {
  crawl_time: string;
  total_items: number;
  platforms: { id: string; name: string; status: string; item_count: number }[];
  items: DumpRow[];
};

function dumpWithPython(dbPath: string): DumpPayload {
  const py = `
import json, sqlite3, sys
db = sys.argv[1]
con = sqlite3.connect(db)
con.row_factory = sqlite3.Row
cur = con.cursor()
platforms = {r["id"]: r["name"] for r in cur.execute("SELECT id, name FROM platforms")}
# latest crawl
crawl = cur.execute("SELECT id, crawl_time, total_items FROM crawl_records ORDER BY id DESC LIMIT 1").fetchone()
crawl_id = crawl["id"] if crawl else None
crawl_time = crawl["crawl_time"] if crawl else ""
total_items = crawl["total_items"] if crawl else 0
status_map = {}
if crawl_id is not None:
    for r in cur.execute("SELECT platform_id, status FROM crawl_source_status WHERE crawl_record_id=?", (crawl_id,)):
        status_map[r["platform_id"]] = r["status"]
# top items: best rank per platform, then overall top
rows = cur.execute("""
  SELECT id, title, platform_id, rank, url, first_crawl_time, last_crawl_time
  FROM news_items
  ORDER BY rank ASC, id ASC
  LIMIT 80
""").fetchall()
# counts
counts = {r[0]: r[1] for r in cur.execute("SELECT platform_id, COUNT(*) FROM news_items GROUP BY platform_id")}
plat_out = []
for pid, name in platforms.items():
    st = status_map.get(pid, "unknown")
    if st not in ("success", "failed"):
        st = "unknown"
    plat_out.append({"id": pid, "name": name, "status": st, "item_count": int(counts.get(pid, 0))})
items = []
for r in rows:
    items.append({
        "id": r["id"],
        "title": r["title"],
        "platform_id": r["platform_id"],
        "platform_name": platforms.get(r["platform_id"], r["platform_id"]),
        "rank": int(r["rank"] or 99),
        "url": r["url"] or "",
        "first_crawl_time": r["first_crawl_time"] or "",
        "last_crawl_time": r["last_crawl_time"] or "",
    })
print(json.dumps({
  "crawl_time": crawl_time,
  "total_items": int(total_items or len(items)),
  "platforms": plat_out,
  "items": items,
}, ensure_ascii=False))
`;
  const out = execFileSync("python3", ["-c", py, dbPath], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(out) as DumpPayload;
}

function toSnapshot(dump: DumpPayload, reportDate: string): TrendRadarSnapshot {
  const success = dump.platforms.filter((p) => p.status === "success").length;
  const failed = dump.platforms.filter((p) => p.status === "failed").length;
  const items = dump.items.slice(0, 40).map((row) => ({
    id: `tr-${row.id}`,
    title: row.title,
    platformId: row.platform_id,
    platformName: row.platform_name,
    rank: row.rank,
    url: row.url || "https://github.com/sansan0/TrendRadar",
    firstSeen: row.first_crawl_time || reportDate,
    lastSeen: row.last_crawl_time || reportDate,
    aiRelated: AI_RE.test(row.title),
  }));

  return {
    generatedAt: new Date().toISOString(),
    reportDate,
    timezone: "Asia/Shanghai",
    source: "trendradar-local",
    sourceUrl: "https://github.com/sansan0/TrendRadar",
    crawlTime: dump.crawl_time || reportDate,
    totalItems: dump.total_items,
    successPlatforms: success,
    failedPlatforms: failed,
    platforms: dump.platforms.map((p) => ({
      id: p.id,
      name: p.name,
      status: (p.status === "success" || p.status === "failed" ? p.status : "unknown") as
        | "success"
        | "failed"
        | "unknown",
      itemCount: p.item_count,
    })),
    items: items.length
      ? items
      : buildSeedTrendRadarSnapshot().items,
    htmlReportUrl: "http://127.0.0.1:8080/html/latest/current.html",
    methodNote:
      `同步自本地 TrendRadar SQLite（${path.basename(findLatestNewsDb(resolveTrendRadarRoot()) || "n/a")}）。` +
      " 多平台热搜聚合；不改动智衡七维评分。命令：npm run trendradar:sync",
  };
}

function main() {
  mkdirSync(dataDir, { recursive: true });
  const trRoot = resolveTrendRadarRoot();
  const db = findLatestNewsDb(trRoot);
  const reportDate = shanghaiDay();

  let snapshot: TrendRadarSnapshot;
  if (!db) {
    console.warn(`⚠️  未找到 TrendRadar 数据库：${path.join(trRoot, "output", "news")}`);
    console.warn("   请先：cd 08-resources/TrendRadar && uv run python -m trendradar");
    snapshot = buildSeedTrendRadarSnapshot();
  } else {
    console.log(`读取: ${db}`);
    const dump = dumpWithPython(db);
    snapshot = toSnapshot(dump, reportDate);
  }

  const parsed = trendRadarSnapshotSchema.parse(snapshot);
  writeFileSync(tmpFile, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  renameSync(tmpFile, outFile);

  console.log("✅ TrendRadar hot snapshot synced");
  console.log(`   date     : ${parsed.reportDate}`);
  console.log(`   source   : ${parsed.source}`);
  console.log(`   items    : ${parsed.items.length} / total ${parsed.totalItems}`);
  console.log(`   platforms: ${parsed.successPlatforms} ok / ${parsed.failedPlatforms} fail`);
  console.log(`   ai-related: ${parsed.items.filter((i) => i.aiRelated).length}`);
  console.log(`   out      : ${path.relative(root, outFile)}`);
}

main();
