/**
 * 生成对齐 BuilderPulse 方法的机会分析报告，并按日落盘归档。
 *
 *   npm run opp:sync
 *   PULSE_DATE=2026-08-12 npm run opp:sync
 *
 * 产物：
 *   data/opportunity-report-daily.json
 *   data/opportunities/YYYY-MM-DD.json
 *   data/archive/YYYY-MM-DD/opportunity-report.json
 */
import path from "path";
import {
  buildOpportunityReport,
  persistOpportunityReport,
} from "../src/lib/intel/opportunity-report";
import { shanghaiDay } from "../src/lib/intel/time";

async function ensurePulse() {
  // 可选：先同步 BuilderPulse（失败不阻断，build 会用现有 / seed）
  if (process.env.OPP_SKIP_PULSE === "1") return;
  const { spawnSync } = await import("child_process");
  const root = path.join(__dirname, "..");
  console.log("▶ pulse:sync (prerequisite)");
  const result = spawnSync("npx", ["tsx", "scripts/sync-builder-pulse.ts"], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.warn("[opp:sync] pulse:sync failed — continuing with existing / seed data");
  }
}

async function main() {
  await ensurePulse();
  // 默认生成“今天”的报告：若 BuilderPulse 已发布当天则对齐其方法，否则由智衡实时数据联动生成
  const date = process.env.PULSE_DATE?.trim() || process.env.OPP_DATE?.trim() || shanghaiDay();
  const report = buildOpportunityReport(date);
  // 若 pulse 实际是另一天，以 brief 日期为准已在 build 内处理；这里强制归档键用 report.reportDate
  const paths = persistOpportunityReport(report);

  console.log("✅ Opportunity report generated (BuilderPulse-aligned)");
  console.log(`   date     : ${report.reportDate}`);
  console.log(`   idea     : ${report.buildIdea.title}`);
  console.log(`   signals  : ${report.topSignals.length}`);
  console.log(`   opps     : ${report.opportunities.length}`);
  console.log(`   lenses   : ai=${report.stats.aiHot} cn=${report.stats.cnHot} intl=${report.stats.intlHot}`);
  console.log(`   latest   : ${path.relative(path.join(__dirname, ".."), paths.latest)}`);
  console.log(`   archive  : ${path.relative(path.join(__dirname, ".."), paths.dated)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
