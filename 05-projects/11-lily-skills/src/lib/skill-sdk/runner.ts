/**
 * Adapter Runner — spawns a skill adapter file in a child process and speaks
 * JSON over stdio.
 *
 * Protocol:
 *   stdin  → { "input": {...}, "skillId": "...", "executionId": "...", "trigger": "..." }
 *   stdout → { "ok": true, "output": {...} } | { "ok": false, "error": "..." }
 *
 * Usage: node src/lib/skill-sdk/runner.ts <absolute-path-to-adapter>
 */
import { pathToFileURL } from "node:url";

async function main(): Promise<void> {
  const adapterPath = process.argv[2];
  if (!adapterPath) {
    process.stdout.write(JSON.stringify({ ok: false, error: "no adapter path provided" }));
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  let request: Record<string, unknown>;
  try {
    request = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    process.stdout.write(JSON.stringify({ ok: false, error: "invalid JSON on stdin" }));
    return;
  }

  try {
    const mod = (await import(pathToFileURL(adapterPath).href)) as {
      execute?: (input: Record<string, unknown>, ctx: unknown) => unknown;
      validate?: (input: Record<string, unknown>) => unknown;
    };
    if (typeof mod.execute !== "function") {
      process.stdout.write(JSON.stringify({ ok: false, error: "adapter does not export execute()" }));
      return;
    }
    const ctx = {
      skillId: String(request.skillId ?? ""),
      executionId: String(request.executionId ?? ""),
      trigger: String(request.trigger ?? "manual"),
      log() {
        /* structured logs are collected by the execution engine */
      },
    };
    const output = await mod.execute((request.input ?? {}) as Record<string, unknown>, ctx);
    process.stdout.write(JSON.stringify({ ok: true, output: output ?? {} }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  }
}

void main();
