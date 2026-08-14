import { spawn } from "node:child_process";
import type { Json, SkillRow, ExecutionContext } from "../types";

/**
 * CLI adapter — runs a shell command templated from the input.
 * Placeholders `{{key}}` are substituted from input values.
 * High/critical risk skills require approval before reaching here.
 */
export async function executeCliSkill(skill: SkillRow, input: Json, ctx: ExecutionContext): Promise<Json> {
  const template = skill.command;
  if (!template) throw new Error(`Skill "${skill.name}" has no command configured`);
  const command = template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, key: string) => {
    const val = key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], input);
    return val == null ? "" : String(val);
  });
  const timeoutMs = 30_000;
  return new Promise<Json>((resolve, reject) => {
    const child = spawn("/bin/sh", ["-c", command], { cwd: process.cwd() });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        reject(new Error(`CLI skill timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
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
      if (code !== 0) reject(new Error(`Command exited ${code}: ${stderr.trim().slice(0, 2000)}`));
      else resolve({ exit_code: code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}
