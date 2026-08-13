/**
 * Convenience: ingest → cluster → briefs → optional push
 *   npm run intel:refresh
 * Skip push: INTEL_PUSH_SKIP=1
 */
import { spawnSync } from "child_process";
import path from "path";

const root = path.join(__dirname, "..", "..");

function run(script: string, optional = false) {
  const r = spawnSync("npx", ["tsx", script], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    if (optional) {
      console.warn(`[intel:refresh] optional ${script} failed (exit ${r.status})`);
      return;
    }
    process.exit(r.status || 1);
  }
}

if (process.env.INTEL_OFFLINE !== "1" && process.env.AIHOT_SKIP !== "1") {
  run("scripts/sync-aihot.ts", true);
}
run("scripts/pipeline/ingest.ts");
run("scripts/pipeline/cluster-events.ts");
run("scripts/pipeline/generate-briefs.ts");
if (process.env.INTEL_PUSH_SKIP !== "1") {
  run("scripts/pipeline/push-notify.ts");
} else {
  console.log("[intel:refresh] INTEL_PUSH_SKIP=1 · skipped push");
}
console.log("[intel:refresh] done");
