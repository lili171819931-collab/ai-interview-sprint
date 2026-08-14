/**
 * Lily-Skills SDK — the standard way to author a Skill.
 *
 * A Skill is: a folder under `skills/` containing
 *   - `skill.json`   → the Skill Manifest (metadata + schemas)
 *   - `adapter.ts`   → pure `execute(input, ctx)` / optional `validate(input)`
 *
 * The adapter file needs NO imports. The platform spawns it through the
 * Adapter Runner (`runner.ts`) using a JSON-over-stdio protocol, so every
 * skill is isolated in its own process and can be written in any language
 * that speaks JSON over stdio.
 */
export type Json = Record<string, unknown>;

export interface AdapterContext {
  skillId: string;
  executionId: string;
  trigger: string;
  log(level: "info" | "warn" | "error", message: string, data?: Json): void;
}

export interface SkillHandler {
  execute(input: Json, ctx: AdapterContext): Promise<Json> | Json;
  validate?(input: Json): { ok: true } | { ok: false; errors: string[] };
}

export interface SkillPackage {
  manifest: Record<string, unknown>;
  handler: SkillHandler;
}

/** Compose a Skill package in code (alternative to folder-based skills). */
export function defineSkill(manifest: Record<string, unknown>, handler: SkillHandler): SkillPackage {
  return { manifest, handler };
}

/**
 * Adapter entry helper — used by in-process adapters. When the file is run
 * directly as a sub-process (node adapter.ts), it reads a JSON request from
 * stdin and writes the JSON response to stdout.
 */
export async function runAsAdapter(handler: SkillHandler): Promise<void> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const request = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const ctx: AdapterContext = {
    skillId: String(request.skillId ?? ""),
    executionId: String(request.executionId ?? ""),
    trigger: String(request.trigger ?? "manual"),
    log() {
      /* logs are collected by the runner */
    },
  };
  const response: Json = { ok: false };
  try {
    const output = await handler.execute(request.input ?? {}, ctx);
    response.ok = true;
    response.output = output;
  } catch (err) {
    response.ok = false;
    response.error = err instanceof Error ? err.message : String(err);
  }
  process.stdout.write(JSON.stringify(response));
}
