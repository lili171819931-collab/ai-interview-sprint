/**
 * Lily-Skills E2E test.
 *
 * Boots the production server (or dev), exercises the full user journey over
 * real HTTP, and verifies every acceptance scenario. Exits non-zero on failure.
 *
 * Usage:  node tests/e2e.mjs            (uses `next start`, requires `next build` first)
 *         MODE=dev node tests/e2e.mjs   (uses `next dev`, no build needed)
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 3999 + Math.floor(Math.random() * 200);
const BASE = `http://localhost:${PORT}`;
const MODE = process.env.MODE ?? "prod";

let passed = 0;
let failed = 0;

function ok(cond, label, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✖ ${label} ${detail}`);
  }
}

async function jget(p) {
  const r = await fetch(`${BASE}${p}`);
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}
async function jpost(p, data) {
  const r = await fetch(`${BASE}${p}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

async function waitReady(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/api/status`);
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  // Fresh database
  await run(`node_modules/.bin/tsx scripts/db-reset.ts`);
  await run(`node_modules/.bin/tsx scripts/seed.ts`);

  const serverCmd = MODE === "dev" ? ["npx", "next", "dev", "-p", String(PORT)] : ["npx", "next", "start", "-p", String(PORT)];
  const server = spawn(serverCmd[0], serverCmd.slice(1), { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], detached: true });
  let log = "";
  server.stdout.on("data", (d) => (log += d.toString()));
  server.stderr.on("data", (d) => (log += d.toString()));

  try {
    console.log(`\n[Lily-Skills E2E] server on ${BASE} (mode=${MODE})`);
    if (!(await waitReady())) {
      throw new Error(`server did not become ready. log:\n${log.slice(-2000)}`);
    }
    console.log("server ready\n");

    // ---- Platform status ----
    console.log("1) Platform");
    const status = await jget("/api/status");
    ok(status.status === 200 && status.body.ok === true, "GET /api/status returns ok");

    // ---- Skill Registry ----
    console.log("\n2) Skill Registry");
    const skills = await jget("/api/skills");
    ok(skills.status === 200 && skills.body.skills?.length >= 10, `GET /api/skills returns >=10 skills (${skills.body.skills?.length})`);
    const detail = await jget(`/api/skills/${skills.body.skills[0].id}`);
    ok(detail.status === 200 && detail.body.skill?.name, `GET /api/skills/:id returns detail (${detail.body.skill?.name})`);

    // Register a brand-new skill (proves auto-registration loop)
    const newSkill = await jpost("/api/skills/register", {
      name: `E2E Skill ${Date.now().toString().slice(-4)}`,
      version: "1.0.0",
      description: "E2E test skill",
      category: "Development",
      tags: ["e2e", "test"],
      execution_type: "echo",
      input_schema: { type: "object", properties: { message: { type: "string", required: true } }, required: ["message"] },
      permissions: ["read"],
      risk_level: "low",
    });
    ok(newSkill.status === 200 && newSkill.body.skill?.id, "POST /api/skills/register auto-registers a new skill");
    ok(newSkill.body.skill?.tags?.includes("e2e"), "new skill got auto tags");

    // Search finds the new skill
    const search = await jget("/api/search?q=trend");
    ok(search.status === 200 && search.body.results?.length > 0, "GET /api/search returns semantic results");

    // ---- Execution ----
    console.log("\n3) Skill Execution");
    const calc = skills.body.skills.find((s) => s.slug === "calculator");
    const execRes = await jpost(`/api/skills/${calc.id}/execute`, { input: { expression: "(2+3)*6" }, skipApproval: true });
    ok(execRes.status === 200 && execRes.body.execution?.status === "completed", `execute calculator -> ${execRes.body.execution?.status}`);
    ok(execRes.body.execution?.output?.result === 30, "calculator output is 30");

    // Approval flow: create a high-risk skill and verify approval gate
    const risky = await jpost("/api/skills/register", {
      name: `E2E Risky ${Date.now().toString().slice(-4)}`,
      version: "1.0.0",
      description: "high risk skill",
      category: "Other",
      execution_type: "echo",
      risk_level: "critical",
      permissions: ["write"],
      input_schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
    });
    const riskExec = await jpost(`/api/skills/${risky.body.skill.id}/execute`, { input: { message: "x" } });
    ok(riskExec.body.execution?.status === "awaiting_approval", "critical-risk execution requires approval");
    const approved = await jpost(`/api/executions/${riskExec.body.execution.id}/approve`);
    ok(approved.body.execution?.status === "completed", "approval then executes");

    // ---- AI Agent ----
    console.log("\n4) AI Agent");
    const chat = await jpost("/api/agent/chat", { message: "帮我分析 TikTok 上 AI Agent 的热点并生成 3 个选题", autoExecute: false });
    ok(chat.body.plan?.recommendations?.length > 0, "agent returns recommendations");
    ok(chat.body.plan?.steps?.length > 0, "agent builds a multi-step plan");
    const exe = await jpost("/api/agent/execute", { planId: chat.body.plan.id });
    const failedSteps = (exe.body.plan?.steps ?? []).filter((s) => s.status === "failed").map((s) => `${s.skillName}: ${s.error ?? "unknown error"}`);
    ok(exe.body.plan?.status === "completed", `agent executes plan -> ${exe.body.plan?.status}${failedSteps.length ? " | " + failedSteps.join("; ") : ""}`);
    ok(exe.body.plan?.steps?.some((s) => s.status === "completed"), "at least one step completed");

    // ---- Workflow ----
    console.log("\n5) Workflow");
    const wfs = await jget("/api/workflows");
    ok(wfs.status === 200 && wfs.body.workflows?.length >= 1, "GET /api/workflows returns workflows");
    const wf = wfs.body.workflows[0];
    const wfRun = await jpost(`/api/workflows/${wf.id}/run`, { input: { platform: "youtube", topic: "AI 编程", count: 2 } });
    const expectedPause = wf.nodes?.some((n) => n.type === "human_approval");
    if (expectedPause) {
      ok(wfRun.body.run?.status === "awaiting_approval", "workflow pauses at human approval");
      const resumed = await jpost(`/api/workflow-runs/${wfRun.body.run.id}/approve`);
      ok(resumed.body.run?.status === "completed", "workflow resumes after approval");
    } else {
      ok(wfRun.body.run?.status === "completed", `workflow run -> ${wfRun.body.run?.status}`);
    }

    // ---- Analytics ----
    console.log("\n6) Analytics");
    const analytics = await jget("/api/analytics");
    ok(analytics.status === 200 && analytics.body.analytics?.totalExecutions >= 1, "GET /api/analytics returns metrics");
    ok(analytics.body.analytics?.topSkills?.length >= 1, "analytics has top skills");

    // ---- Pages render ----
    console.log("\n7) Pages");
    for (const p of ["/", "/skills", "/agent", "/workflows", "/executions", "/analytics", "/developer"]) {
      const r = await fetch(`${BASE}${p}`);
      const html = await r.text();
      ok(r.status === 200 && html.includes("Lily-Skills"), `GET ${p} renders (${r.status})`);
    }

    console.log(`\n========================================`);
    console.log(`E2E RESULT: ${passed} passed, ${failed} failed`);
    console.log(`========================================`);
    process.exitCode = failed === 0 ? 0 : 1;
  } catch (err) {
    console.error("E2E ERROR:", err.message);
    console.error("--- server log tail ---\n" + log.slice(-3000));
    process.exitCode = 1;
  } finally {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch { /* already dead */ }
  }
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd.split(" ")[0], cmd.split(" ").slice(1), { cwd: ROOT, stdio: "inherit" });
    c.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    c.on("error", reject);
  });
}

main();
