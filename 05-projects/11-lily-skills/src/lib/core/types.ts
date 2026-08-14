import { randomUUID } from "node:crypto";

export type Json = Record<string, unknown>;

export type SkillStatus = "draft" | "testing" | "active" | "deprecated" | "archived";
export type ExecutionType = "local" | "api" | "cli" | "mcp" | "webhook" | "composite" | "echo" | "http";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
export type ExecutionStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "awaiting_approval";
export type WorkflowRunStatus = "queued" | "running" | "awaiting_approval" | "completed" | "failed" | "cancelled";

export interface SkillRow {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  category_id: string | null;
  icon: string | null;
  author: string;
  status: SkillStatus;
  execution_type: ExecutionType;
  endpoint: string | null;
  command: string | null;
  input_schema: string;
  output_schema: string;
  permissions: string;
  ai_description: string | null;
  use_cases: string;
  examples: string;
  risk_level: RiskLevel;
  health_status: HealthStatus;
  health_checked_at: string | null;
  config: string;
  source: string;
  source_path: string | null;
  usage_count: number;
  success_count: number;
  failure_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: number;
}

export interface TagRow {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
}

export interface SkillDetail extends SkillRow {
  category: CategoryRow | null;
  tags: string[];
  permissions_list: string[];
  dependencies_list: { name: string; kind: string; version_constraint: string | null }[];
}

export interface Manifest {
  id?: string;
  name: string;
  version: string;
  description: string;
  category: string;
  tags: string[];
  icon?: string;
  author?: string;
  status?: SkillStatus;
  execution_type: ExecutionType;
  endpoint?: string;
  command?: string;
  input_schema?: Json;
  output_schema?: Json;
  permissions?: string[];
  risk_level?: RiskLevel;
  ai_description?: string;
  use_cases?: string[];
  examples?: string[];
  dependencies?: { name: string; kind?: string; version_constraint?: string }[];
  config?: Json;
}

export interface SkillAdapter {
  /** Adapter type marker (also used as fallback when no runtime handler registered). */
  readonly type: ExecutionType;
  /** Validate input against the skill's input schema. */
  validate?(input: Json): { ok: true } | { ok: false; errors: string[] };
  /** Execute the skill. Must return a serializable result. */
  execute(input: Json, ctx: ExecutionContext): Promise<Json>;
}

export interface ExecutionContext {
  skillId: string;
  executionId: string;
  trigger: string;
  log(level: "info" | "warn" | "error", message: string, data?: Json): void;
  signal?: AbortSignal;
}

export interface ExecutionRecord {
  id: string;
  skill_id: string;
  status: ExecutionStatus;
  input: Json;
  output: Json | null;
  error: string | null;
  trigger: string;
  workflow_run_id: string | null;
  agent_session_id: string | null;
  retry_count: number;
  logs: { level: string; message: string; at: string; data?: Json }[];
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseJson<T = Json>(raw: unknown, fallback: T): T {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw !== "string") return raw as T;
  if (raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function bind<T>(v: T | undefined | null): T | null {
  return v === undefined ? null : v;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;
}
