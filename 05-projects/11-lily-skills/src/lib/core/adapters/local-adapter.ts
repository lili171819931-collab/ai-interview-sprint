import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Json, SkillRow, ExecutionContext } from "../types";

export interface LocalAdapterOptions {
  projectRoot: string;
  timeoutMs?: number;
}

/**
 * Executes a local skill by spawning its adapter file in an isolated Node
 * process using the Adapter Runner (JSON over stdio).
 */
export async function executeLocalSkill(
  skill: SkillRow,
  input: Json,
  ctx: ExecutionContext,
  opts: LocalAdapterOptions,
): Promise<Json> {
  const folder = skill.source_path ? path.resolve(opts.projectRoot, skill.source_path) : "";
  const adapterPath = findAdapterFile(folder);
  if (!adapterPath) {
    throw new Error(`Local skill "${skill.name}" has no adapter file (expected skills/<name>/adapter.ts or adapter.mjs)`);
  }
  const runnerPath = path.join(opts.projectRoot, "src", "lib", "skill-sdk", "runner.ts");
  const timeoutMs = opts.timeoutMs ?? 60_000;

  const payload = JSON.stringify({ input, skillId: skill.id, executionId: ctx.executionId, trigger: ctx.trigger });

  return new Promise<Json>((resolve, reject) => {
    const child = spawn(process.execPath, [runnerPath, adapterPath], {
      cwd: opts.projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        reject(new Error(`Skill execution timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
    });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Adapter exited with code ${code}: ${stderr.trim().slice(0, 2000)}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { ok: boolean; output?: Json; error?: string };
        if (parsed.ok) resolve(parsed.output ?? {});
        else reject(new Error(parsed.error ?? "Adapter returned ok:false"));
      } catch {
        reject(new Error(`Adapter returned invalid JSON: ${stdout.trim().slice(0, 2000)}`));
      }
    });
    child.stdin.end(payload);
  });
}

function findAdapterFile(folder: string): string | null {
  if (!folder || !fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) return null;
  for (const candidate of ["adapter.ts", "adapter.mjs", "adapter.js", "index.ts", "index.mjs"]) {
    const p = path.join(folder, candidate);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
