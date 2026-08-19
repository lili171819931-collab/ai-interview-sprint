/**
 * 一键日更：先归档过往快照 → 再刷新全部日更产物。
 *
 *   npm run daily:refresh
 *   npm run daily:refresh:offline
 *   npm run daily:refresh:quick   # 仅热点 + 雷达（更快）
 */
import { spawnSync } from "child_process";
import path from "path";
import { archiveCurrentSnapshots, shanghaiDay } from "./lib/archive";

const root = path.join(__dirname, "..");

function runOptional(label: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  console.log(`\n▶ ${label} (optional)`);
  const result = spawnSync("npx", ["tsx", ...args], {
    cwd: root,
    env,
    encoding: "utf8",
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.warn(`[daily] ${label} skipped/failed (exit ${result.status})`);
  }
}

function run(label: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("npx", ["tsx", ...args], {
    cwd: root,
    env,
    encoding: "utf8",
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit ${result.status}`);
  }
}

function main() {
  const mode = (process.env.DAILY_MODE || "full").toLowerCase();
  const offline = process.env.RADAR_OFFLINE === "1";
  const today = shanghaiDay();

  console.log("══════════════════════════════════════");
  console.log(`智衡日更 · ${today} · mode=${mode}${offline ? " · offline" : ""}`);
  console.log("══════════════════════════════════════");

  if (mode === "twitter") {
    if (!offline) runOptional("twitter:sync", ["scripts/sync-twitter-live.ts"]);
    console.log("\n✅ Twitter 实时推送完成（未归档）");
    return;
  }

  if (mode === "hourly") {
    // 全部动态分钟级：热点 + TrendRadar + 入库合并 + AIHOT 精选 + Twitter
    if (!offline) {
      runOptional("twitter:sync", ["scripts/sync-twitter-live.ts"], {
        ...process.env,
        TWITTER_CLI: process.env.TWITTER_CLI || "1",
      });
      runOptional("hot:sync", ["scripts/sync-global-hot-topics.ts"]);
      runOptional("trendradar:sync", ["scripts/sync-trendradar.ts"]);
      runOptional("aihot:sync", ["scripts/sync-aihot.ts"]);
      runOptional("github:hot", ["scripts/sync-github-hot.ts"]);
    }
    runOptional("intel:ingest", ["scripts/pipeline/ingest.ts"], {
      ...process.env,
      INTEL_ADAPTERS: "aihot,trendradar,global-hot",
      INTEL_OFFLINE: offline ? "1" : process.env.INTEL_OFFLINE || "",
    });
    console.log("\n✅ 整点/分钟更新完成（未归档）");
    return;
  }

  const index = archiveCurrentSnapshots(root, `pre-${mode}-refresh`);
  console.log(`[archive] history days: ${index.days.length}`);

  if (mode === "quick") {
    run("hot:sync", ["scripts/sync-global-hot-topics.ts"]);
    if (!offline) runOptional("aihot:sync", ["scripts/sync-aihot.ts"]);
    run("radar:daily", ["scripts/refresh-radar-report.ts"]);
  } else if (mode === "hot") {
    run("hot:sync", ["scripts/sync-global-hot-topics.ts"]);
  } else {
    // full：先抓热点/TrendRadar，再生成雷达，确保雷达吃到「今天」内容
    const env = { ...process.env };
    if (offline) env.RADAR_OFFLINE = "1";
    run("refresh-data", ["scripts/refresh-data.ts"], env);
    if (offline) {
      run("hot:sync (cached)", ["scripts/sync-global-hot-topics.ts"], {
        ...env,
        HOT_SKIP_FETCH: "1",
      });
    } else {
      run("hot:sync", ["scripts/sync-global-hot-topics.ts"], env);
    }
    run("trendradar:sync", ["scripts/sync-trendradar.ts"], env);
    if (!offline) runOptional("aihot:sync", ["scripts/sync-aihot.ts"], env);
    if (!offline) runOptional("github:sync", ["scripts/sync-github-stars.ts"], env);
    if (!offline) runOptional("github:hot", ["scripts/sync-github-hot.ts"], env);
    run("radar:daily", ["scripts/refresh-radar-report.ts"], env);
    run("pulse:sync", ["scripts/sync-builder-pulse.ts"], env);
    run("opp:sync", ["scripts/generate-opportunity-report.ts"], { ...env, OPP_SKIP_PULSE: "1" });
  }

  // 把今天最新结果也归档一份，保证 /history 当天可回看
  archiveCurrentSnapshots(root, `post-${mode}-refresh`);

  console.log("\n✅ 日更完成");
  console.log(`   今日：${today}`);
  console.log("   查看：http://localhost:3010/  ·  /hot  ·  /opportunities  ·  /history");
}

try {
  main();
} catch (e) {
  console.error("\n❌ 日更失败（已尽量保留归档与旧快照）");
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
