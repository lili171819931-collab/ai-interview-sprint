/**
 * 同步国内外实时热点 → data/global-hot-topics.json
 *
 * 1) 优先运行 08-resources/scrapling-examples/global_hot_topics_dashboard.py
 * 2) 若已有 JSON 则直接转换
 * 3) 失败则写 seed
 *
 * 能力对齐：https://github.com/Panniantong/Agent-Reach
 */
import { spawnSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { buildSeedGlobalHotTopics } from "../src/data/global-hot-seed";
import { globalHotTopicsSnapshotSchema } from "../src/lib/global-hot-schema";
import type {
  GlobalHotItem,
  GlobalHotPlatformGroup,
  GlobalHotRegion,
  GlobalHotSourceStatus,
  GlobalHotTopicsSnapshot,
} from "../src/lib/global-hot-types";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data", "global-hot-topics.json");
const EXAMPLES = path.resolve(ROOT, "../../08-resources/scrapling-examples");
const PY_SCRIPT = path.join(EXAMPLES, "global_hot_topics_dashboard.py");
const PY_JSON = path.join(EXAMPLES, "global_hot_topics.json");
const AGENT_REACH = "https://github.com/Panniantong/Agent-Reach";

type RawReport = {
  generatedAt?: string;
  methodNote?: string;
  sources?: Record<
    string,
    {
      label?: string;
      region?: string;
      ok?: boolean;
      mode?: string;
      hits?: number;
      error?: string;
    }
  >;
  platforms?: Record<
    string,
    Array<{
      platform?: string;
      region?: string;
      rank?: number;
      title?: string;
      heat?: string | number | null;
      url?: string;
      fetched_at?: string;
      source_id?: string;
    }>
  >;
  stats?: {
    platforms?: number;
    items?: number;
    sources_ok?: number;
    sources_total?: number;
    by_region?: { 国内?: number; 海外?: number };
  };
};

function runPythonAggregator(): boolean {
  if (!existsSync(PY_SCRIPT)) {
    console.warn(`[hot:sync] missing python script: ${PY_SCRIPT}`);
    return false;
  }
  const env = {
    ...process.env,
    HOT_NO_OPEN: "1",
    PATH: [
      path.join(process.env.HOME || "", ".agent-reach-venv/bin"),
      path.join(process.env.HOME || "", ".local/bin"),
      process.env.PATH || "",
    ].join(":"),
  };
  // Prefer python3; skip browser auto-open by monkeypatch via env not available —
  // script opens browser; acceptable for interactive sync.
  const result = spawnSync("python3", [PY_SCRIPT], {
    cwd: EXAMPLES,
    env,
    encoding: "utf8",
    timeout: 240_000,
  });
  if (result.status !== 0) {
    console.warn("[hot:sync] python aggregator failed");
    if (result.stderr) console.warn(result.stderr.slice(0, 800));
    if (result.stdout) console.warn(result.stdout.slice(0, 400));
    return false;
  }
  console.log(result.stdout?.split("\n").slice(0, 30).join("\n"));
  return existsSync(PY_JSON);
}

function toRegion(v: string | undefined): GlobalHotRegion {
  return v === "海外" ? "海外" : "国内";
}

function transform(raw: RawReport): GlobalHotTopicsSnapshot {
  const sources: GlobalHotSourceStatus[] = Object.entries(raw.sources || {}).map(([id, meta]) => ({
    id,
    label: meta.label || id,
    region: meta.region || "",
    ok: Boolean(meta.ok),
    mode: meta.mode || "",
    hits: Number(meta.hits || 0),
    ...(meta.error ? { error: String(meta.error) } : {}),
  }));

  const platforms: GlobalHotPlatformGroup[] = Object.entries(raw.platforms || {}).map(
    ([name, rows]) => {
      const items: GlobalHotItem[] = (rows || [])
        .filter((r) => (r.title || "").trim())
        .map((r, idx) => ({
          platform: String(r.platform || name),
          region: toRegion(r.region),
          rank: Number(r.rank || idx + 1),
          title: String(r.title || "").trim(),
          heat: r.heat ?? null,
          url: String(r.url || ""),
          fetched_at: String(r.fetched_at || raw.generatedAt || new Date().toISOString()),
          ...(r.source_id ? { source_id: String(r.source_id) } : {}),
        }));
      const region = items[0]?.region || toRegion(undefined);
      return { name, region, items };
    },
  );

  const allItems = platforms.flatMap((p) => p.items);
  const snap: GlobalHotTopicsSnapshot = {
    generatedAt: raw.generatedAt || new Date().toISOString(),
    timezone: "Asia/Shanghai",
    source: "agent-reach-scrapling",
    methodNote:
      raw.methodNote ||
      "Agent Reach 能力层 + Scrapling/NewsNow/RSS 多源聚合（公开页优先，登录态源失败不阻断）。",
    agentReachUrl: AGENT_REACH,
    sources: sources.sort((a, b) => Number(b.ok) - Number(a.ok) || a.label.localeCompare(b.label)),
    platforms,
    stats: {
      platforms: platforms.length,
      items: allItems.length,
      sourcesOk: sources.filter((s) => s.ok).length,
      sourcesTotal: sources.length,
      byRegion: {
        国内: allItems.filter((i) => i.region === "国内").length,
        海外: allItems.filter((i) => i.region === "海外").length,
      },
    },
  };
  return globalHotTopicsSnapshotSchema.parse(snap) as GlobalHotTopicsSnapshot;
}

function main() {
  mkdirSync(path.dirname(OUT), { recursive: true });

  let usedPython = false;
  if (process.env.HOT_SKIP_FETCH !== "1") {
    usedPython = runPythonAggregator();
  }

  if (existsSync(PY_JSON)) {
    try {
      const raw = JSON.parse(readFileSync(PY_JSON, "utf8")) as RawReport;
      const snap = transform(raw);
      writeFileSync(OUT, JSON.stringify(snap, null, 2), "utf8");
      // keep a copy of HTML next to data for optional static open
      const htmlSrc = path.join(EXAMPLES, "global_hot_topics.html");
      if (existsSync(htmlSrc)) {
        copyFileSync(htmlSrc, path.join(ROOT, "data", "global-hot-topics.html"));
      }
      console.log(
        `[hot:sync] wrote ${OUT} (platforms=${snap.stats.platforms}, items=${snap.stats.items}, ok=${snap.stats.sourcesOk}/${snap.stats.sourcesTotal}${usedPython ? ", live" : ", cached-json"})`,
      );
      return;
    } catch (e) {
      console.warn("[hot:sync] transform failed, falling back to seed:", e);
    }
  }

  const seed = buildSeedGlobalHotTopics(new Date().toISOString());
  writeFileSync(OUT, JSON.stringify(seed, null, 2), "utf8");
  console.log(`[hot:sync] wrote seed → ${OUT}`);
}

main();
