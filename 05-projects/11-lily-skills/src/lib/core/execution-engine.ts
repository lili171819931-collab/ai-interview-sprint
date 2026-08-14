import path from "node:path";
import type { Db } from "../db/connection";
import type { Json, SkillRow, ExecutionRecord, ExecutionContext } from "./types";
import { newId, nowIso, parseJson } from "./types";
import { requiresApproval, effectivePermissions } from "./permissions";
import { validateInput, type JsonSchema } from "./schema-validator";
import { executeLocalSkill } from "./adapters/local-adapter";
import { executeEchoSkill } from "./adapters/echo-adapter";
import { executeHttpSkill } from "./adapters/http-adapter";
import { executeCliSkill } from "./adapters/cli-adapter";
import { executeCompositeSkill } from "./adapters/composite-adapter";

export interface ExecuteParams {
  skillId: string;
  input: Json;
  trigger?: "manual" | "agent" | "workflow" | "api" | "composite";
  workflowRunId?: string | null;
  agentSessionId?: string | null;
  /** Bypass the approval gate (user already approved). */
  skipApproval?: boolean;
  maxRetries?: number;
}

export interface ExecutionEngineOptions {
  db: Db;
  projectRoot: string;
  timeoutMs?: number;
}

const TRANSIENT_MARKERS = ["ECONNREFUSED", "ENOTFOUND", "timed out", "ETIMEDOUT", "fetch failed", "EPIPE", "exited with code"];

export class ExecutionEngine {
  constructor(private opts: ExecutionEngineOptions) {}

  /** Full entry point: creates a record, gates on approval, validates, runs. */
  async execute(params: ExecuteParams): Promise<ExecutionRecord> {
    const { db } = this.opts;
    const skill = db
      .prepare("SELECT * FROM skills WHERE id = ? OR slug = ? LIMIT 1")
      .get(params.skillId, params.skillId) as SkillRow | undefined;
    if (!skill) throw new Error(`Skill ${params.skillId} not found`);

    const executionId = newId("exec");
    db.prepare(
      `INSERT INTO skill_executions (id, skill_id, status, input, trigger, workflow_run_id, agent_session_id, created_at)
       VALUES (?, ?, 'queued', ?, ?, ?, ?, datetime('now'))`,
    ).run(executionId, skill.id, JSON.stringify(params.input), params.trigger ?? "manual", params.workflowRunId ?? null, params.agentSessionId ?? null);

    // Approval gate
    if (!params.skipApproval && requiresApproval(skill)) {
      db.prepare(`UPDATE skill_executions SET status = 'awaiting_approval' WHERE id = ?`).run(executionId);
      return this.getRecord(executionId);
    }

    return this.runRecord(executionId, skill, params);
  }

  /** Runs an already-created record (after approval, or from a queued job). */
  async runRecord(executionId: string, skill?: SkillRow, params?: ExecuteParams): Promise<ExecutionRecord> {
    const { db } = this.opts;
    const record = this.getRecord(executionId);
    const resolvedSkill = skill ?? (db.prepare("SELECT * FROM skills WHERE id = ?").get(record.skill_id) as SkillRow | undefined);
    if (!resolvedSkill) throw new Error(`Skill for execution ${executionId} not found`);

    const maxRetries = params?.maxRetries ?? 2;
    const logs: { level: string; message: string; at: string }[] = [];
    const log = (level: "info" | "warn" | "error", message: string) => logs.push({ level, message, at: nowIso() });

    // Validate input
    const inputSchema = parseJson<JsonSchema>(resolvedSkill.input_schema, {});
    const validation = validateInput(parseJson(record.input, {}), inputSchema);
    if (!validation.ok) {
      const error = validation.errors.join("; ");
      this.finish(executionId, "failed", null, error, logs, resolvedSkill);
      return this.getRecord(executionId);
    }

    // Run with retries
    let lastError: string | null = null;
    let lastOutput: Json | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) log("warn", `重试第 ${attempt} 次`);
      try {
        const startedAt = nowIso();
        db.prepare(`UPDATE skill_executions SET status='running', started_at=?, retry_count=?, logs=? WHERE id=?`).run(
          startedAt,
          attempt,
          JSON.stringify(logs),
          executionId,
        );
        const ctx: ExecutionContext = {
          skillId: resolvedSkill.id,
          executionId,
          trigger: record.trigger,
          log: (level, message) => log(level, message),
        };
        const output = await this.dispatch(resolvedSkill, parseJson(record.input, {}), ctx);
        lastOutput = output;
        this.finish(executionId, "completed", output, null, logs, resolvedSkill);
        return this.getRecord(executionId);
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        log("error", `执行失败: ${lastError}`);
        const isTransient = TRANSIENT_MARKERS.some((m) => lastError!.includes(m));
        if (attempt < maxRetries && isTransient) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
    this.finish(executionId, "failed", null, lastError, logs, resolvedSkill);
    return this.getRecord(executionId);
  }

  private async dispatch(skill: SkillRow, input: Json, ctx: ExecutionContext): Promise<Json> {
    switch (skill.execution_type) {
      case "echo":
        return executeEchoSkill(skill, input, ctx);
      case "http":
      case "api":
        return executeHttpSkill(skill, input, ctx);
      case "cli":
        return executeCliSkill(skill, input, ctx);
      case "composite":
        return executeCompositeSkill(skill, input, ctx, async (subId, subInput) => {
          const sub = await this.execute({ skillId: subId, input: subInput, trigger: "composite", skipApproval: true });
          if (sub.status !== "completed") throw new Error(`子 Skill ${subId} 执行失败: ${sub.error ?? sub.status}`);
          return sub.output ?? {};
        });
      case "local":
      default:
        return executeLocalSkill(skill, input, ctx, {
          projectRoot: this.opts.projectRoot,
          timeoutMs: this.opts.timeoutMs,
        });
    }
  }

  private finish(
    executionId: string,
    status: "completed" | "failed",
    output: Json | null,
    error: string | null,
    logs: { level: string; message: string; at: string }[],
    skill: SkillRow,
  ): void {
    const { db } = this.opts;
    const finishedAt = nowIso();
    const record = this.getRecord(executionId);
    const durationMs = record.started_at ? Date.parse(finishedAt) - Date.parse(record.started_at) : null;
    db.prepare(
      `UPDATE skill_executions SET status=?, output=?, error=?, finished_at=?, duration_ms=?, logs=? WHERE id=?`,
    ).run(status, output ? JSON.stringify(output) : null, error, finishedAt, durationMs, JSON.stringify(logs), executionId);

    // Update skill counters
    db.prepare(
      `UPDATE skills SET usage_count = usage_count + 1,
        success_count = success_count + ?, failure_count = failure_count + ?,
        last_used_at = ?, updated_at = ? WHERE id = ?`,
    ).run(status === "completed" ? 1 : 0, status === "failed" ? 1 : 0, finishedAt, finishedAt, skill.id);

    // Usage stats (today)
    const today = finishedAt.slice(0, 10);
    db.prepare(
      `INSERT INTO skill_usage_stats (id, skill_id, date, usage_count, success_count, failure_count, total_duration_ms, avg_duration_ms)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT(skill_id, date) DO UPDATE SET
         usage_count = usage_count + 1,
         success_count = success_count + excluded.success_count,
         failure_count = failure_count + excluded.failure_count,
         total_duration_ms = total_duration_ms + excluded.total_duration_ms,
         avg_duration_ms = (total_duration_ms + excluded.total_duration_ms) / (usage_count + 1)`,
    ).run(newId("stat"), skill.id, today, status === "completed" ? 1 : 0, status === "failed" ? 1 : 0, durationMs ?? 0, durationMs ?? 0);

    this.updateHealth(skill.id);
    this.audit(`execution:${status}`, "skill_execution", executionId, { skill_id: skill.id, trigger: record.trigger });
  }

  /** Health monitor: derive health from the last 10 executions. */
  private updateHealth(skillId: string): void {
    const { db } = this.opts;
    const rows = db
      .prepare("SELECT status FROM skill_executions WHERE skill_id = ? ORDER BY created_at DESC LIMIT 10")
      .all(skillId) as { status: string }[];
    const failures = rows.filter((r) => r.status === "failed").length;
    let health = "healthy";
    if (rows.length >= 7 && failures >= 7) health = "down";
    else if (failures >= 3) health = "degraded";
    db.prepare("UPDATE skills SET health_status = ?, health_checked_at = ? WHERE id = ?").run(health, nowIso(), skillId);
  }

  getRecord(executionId: string): ExecutionRecord {
    const row = this.opts.db.prepare("SELECT * FROM skill_executions WHERE id = ?").get(executionId) as Record<string, unknown>;
    if (!row) throw new Error(`Execution ${executionId} not found`);
    return {
      id: String(row.id),
      skill_id: String(row.skill_id),
      status: row.status as ExecutionRecord["status"],
      input: parseJson(String(row.input), {}),
      output: row.output ? parseJson(String(row.output), null) : null,
      error: row.error ? String(row.error) : null,
      trigger: String(row.trigger),
      workflow_run_id: row.workflow_run_id ? String(row.workflow_run_id) : null,
      agent_session_id: row.agent_session_id ? String(row.agent_session_id) : null,
      retry_count: Number(row.retry_count),
      logs: parseJson(String(row.logs), []),
      started_at: row.started_at ? String(row.started_at) : null,
      finished_at: row.finished_at ? String(row.finished_at) : null,
      duration_ms: row.duration_ms == null ? null : Number(row.duration_ms),
      created_at: String(row.created_at),
    };
  }

  private audit(action: string, entityType: string, entityId: string, detail: Json): void {
    this.opts.db
      .prepare("INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, detail) VALUES (?, ?, ?, ?, ?, ?)")
      .run(newId("audit"), "system", action, entityType, entityId, JSON.stringify(detail));
  }

  /** Approve an awaiting-approval execution and run it. */
  async approve(executionId: string): Promise<ExecutionRecord> {
    const record = this.getRecord(executionId);
    if (record.status !== "awaiting_approval") throw new Error(`Execution ${executionId} is not awaiting approval`);
    this.opts.db.prepare("UPDATE skill_executions SET status = 'queued' WHERE id = ?").run(executionId);
    return this.runRecord(executionId);
  }

  cancel(executionId: string): ExecutionRecord {
    const record = this.getRecord(executionId);
    if (record.status === "completed" || record.status === "failed" || record.status === "cancelled") {
      throw new Error(`Execution ${executionId} cannot be cancelled`);
    }
    this.opts.db
      .prepare("UPDATE skill_executions SET status='cancelled', finished_at=?, error='cancelled by user' WHERE id=?")
      .run(nowIso(), executionId);
    return this.getRecord(executionId);
  }

  effectivePermissions(skillId: string): string[] {
    const skill = this.opts.db.prepare("SELECT * FROM skills WHERE id = ?").get(skillId) as SkillRow | undefined;
    return skill ? effectivePermissions(skill) : [];
  }
}

export function createEngine(db: Db, projectRoot = process.cwd()): ExecutionEngine {
  return new ExecutionEngine({ db, projectRoot, timeoutMs: Number(process.env.SKILL_TIMEOUT_MS ?? 60_000) });
}
