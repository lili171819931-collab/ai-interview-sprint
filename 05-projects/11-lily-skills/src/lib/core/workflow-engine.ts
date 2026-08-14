import type { Db } from "../db/connection";
import type { Json, WorkflowRunStatus } from "./types";
import { newId, nowIso, parseJson, bind } from "./types";
import type { ExecutionEngine } from "./execution-engine";
import { recommendSkills } from "./recommendation";
import type { AgentBrain } from "./agent/agent";

export type WorkflowNodeType =
  | "trigger" | "skill" | "ai" | "condition" | "loop" | "transform"
  | "input" | "output" | "webhook" | "human_approval";

export interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_key: string;
  type: WorkflowNodeType;
  config: Json;
  position: Json;
  edges: string[];
}

export interface WorkflowRunDetail {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: WorkflowRunStatus;
  current_node: string | null;
  result: Json | null;
  error: string | null;
  logs: { node: string; message: string; at: string }[];
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface RunContext {
  input: Json;
  outputs: Record<string, Json>;
  variables: Record<string, unknown>;
  logs: { node: string; message: string; at: string }[];
}

export class WorkflowEngine {
  constructor(private db: Db, private engine: ExecutionEngine, private agent: AgentBrain) {}

  createWorkflow(data: { name: string; description?: string; icon?: string; triggerType?: string; schedule?: string }): Json {
    const id = newId("wf");
    this.db
      .prepare(
        "INSERT INTO workflows (id, name, description, icon, trigger_type, schedule, status) VALUES (?, ?, ?, ?, ?, ?, 'draft')",
      )
      .run(id, data.name, data.description ?? null, data.icon ?? null, data.triggerType ?? "manual", data.schedule ?? null);
    return this.getWorkflow(id)!;
  }

  private mapNode(row: WorkflowNode): WorkflowNode {
    return {
      ...row,
      config: parseJson(row.config as unknown as string, {}),
      position: parseJson(row.position as unknown as string, {}),
      edges: parseJson(row.edges as unknown as string, []),
    };
  }

  getWorkflow(id: string): Json | null {
    const wf = this.db.prepare("SELECT * FROM workflows WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!wf) return null;
    const nodes = (this.db
      .prepare("SELECT * FROM workflow_nodes WHERE workflow_id = ? ORDER BY rowid")
      .all(id) as unknown as WorkflowNode[]).map((n) => this.mapNode(n));
    return { ...wf, nodes };
  }

  listWorkflows(): Json[] {
    const rows = this.db.prepare("SELECT * FROM workflows ORDER BY updated_at DESC").all() as Record<string, unknown>[];
    return rows.map((wf) => {
      const nodes = (this.db.prepare("SELECT * FROM workflow_nodes WHERE workflow_id = ?").all(String(wf.id)) as unknown as WorkflowNode[]).map((n) => this.mapNode(n));
      return { ...wf, nodes };
    });
  }

  updateWorkflow(id: string, patch: { name?: string; description?: string; icon?: string; status?: string; triggerType?: string; schedule?: string; nodes?: WorkflowNode[] }): Json {
    const existing = this.getWorkflow(id);
    if (!existing) throw new Error(`Workflow ${id} not found`);
    this.db
      .prepare("UPDATE workflows SET name=?, description=?, icon=?, status=?, trigger_type=?, schedule=?, updated_at=? WHERE id=?")
      .run(
        patch.name ?? (existing.name as string),
        bind(patch.description !== undefined ? patch.description : (existing.description as string | null)),
        bind(patch.icon !== undefined ? patch.icon : (existing.icon as string | null)),
        patch.status ?? (existing.status as string),
        bind(patch.triggerType ?? (existing.trigger_type as string | null)),
        bind(patch.schedule ?? (existing.schedule as string | null)),
        nowIso(),
        id,
      );
    if (patch.nodes) {
      this.db.prepare("DELETE FROM workflow_nodes WHERE workflow_id = ?").run(id);
      for (const node of patch.nodes) {
        this.db
          .prepare(
            "INSERT INTO workflow_nodes (id, workflow_id, node_key, type, config, position, edges) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
          .run(newId("wn"), id, node.node_key, node.type, JSON.stringify(node.config), JSON.stringify(node.position), JSON.stringify(node.edges));
      }
    }
    return this.getWorkflow(id)!;
  }

  deleteWorkflow(id: string): void {
    this.db.prepare("DELETE FROM workflows WHERE id = ?").run(id);
  }

  /** Run a workflow with input. Returns the run. */
  async run(workflowId: string, input: Json): Promise<WorkflowRunDetail> {
    const wf = this.getWorkflow(workflowId) as (Record<string, unknown> & { nodes: WorkflowNode[] }) | null;
    if (!wf) throw new Error(`Workflow ${workflowId} not found`);
    const nodes = wf.nodes ?? [];
    if (nodes.length === 0) throw new Error(`Workflow "${wf.name}" has no nodes`);

    const runId = newId("wrun");
    this.db
      .prepare("INSERT INTO workflow_runs (id, workflow_id, status, created_at) VALUES (?, ?, 'running', ?)")
      .run(runId, workflowId, nowIso());

    const context: RunContext = { input, outputs: {}, variables: {}, logs: [] };
    const entry = nodes.find((n) => n.type === "trigger" || n.type === "input") ?? nodes[0];

    try {
      await this.walk(runId, wf, nodes, entry.node_key, context);
      const completed = this.db.prepare("SELECT * FROM workflow_runs WHERE id = ?").get(runId) as { status: string };
      if (completed.status === "running") {
        this.db
          .prepare("UPDATE workflow_runs SET status='completed', result=?, finished_at=?, current_node=NULL, logs=? WHERE id=?")
          .run(JSON.stringify(context.variables.result ?? { outputs: context.outputs, variables: context.variables }), nowIso(), JSON.stringify(context.logs), runId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.db
        .prepare("UPDATE workflow_runs SET status='failed', error=?, finished_at=?, logs=? WHERE id=?")
        .run(message, nowIso(), JSON.stringify(context.logs), runId);
    }
    return this.getRun(runId);
  }

  private async walk(
    runId: string,
    wf: Record<string, unknown>,
    nodes: WorkflowNode[],
    nodeKey: string,
    ctx: RunContext,
  ): Promise<void> {
    const visited = new Set<string>();
    let currentKey = nodeKey;

    while (currentKey) {
      if (visited.has(currentKey)) throw new Error(`检测到循环节点: ${currentKey}`);
      visited.add(currentKey);
      const node = nodes.find((n) => n.node_key === currentKey);
      if (!node) throw new Error(`节点不存在: ${currentKey}`);
      this.db.prepare("UPDATE workflow_runs SET current_node = ? WHERE id = ?").run(currentKey, runId);
      ctx.logs.push({ node: currentKey, message: `进入节点 (${node.type})`, at: nowIso() });
      this.saveLogs(runId, ctx.logs);

      switch (node.type) {
        case "trigger":
        case "input":
        case "output": {
          if (node.type === "output") {
            ctx.variables.result = this.evalTemplate(node.config?.template as string | undefined, ctx) ?? ctx.variables.result ?? {};
          }
          currentKey = this.next(nodes, node, ctx);
          break;
        }
        case "skill": {
          const skillId = node.config?.skill_id as string | undefined;
          if (!skillId) throw new Error(`Skill 节点缺少 skill_id: ${currentKey}`);
          const input = this.coerceInput(skillId, this.buildNodeInput(node.config?.input as Json | undefined, ctx));
          const record = await this.engine.execute({ skillId, input, trigger: "workflow", workflowRunId: runId });
          if (record.status === "awaiting_approval") {
            this.persistContext(runId, ctx);
            this.db.prepare("UPDATE workflow_runs SET status='awaiting_approval', logs=? WHERE id=?").run(JSON.stringify(ctx.logs), runId);
            return; // pause; resume() continues
          }
          if (record.status !== "completed") throw new Error(`Skill ${skillId} 失败: ${record.error ?? record.status}`);
          ctx.outputs[currentKey] = record.output ?? {};
          ctx.variables[`output.${node.node_key}`] = record.output ?? {};
          ctx.logs.push({ node: currentKey, message: `Skill ${skillId} 执行成功`, at: nowIso() });
          currentKey = this.next(nodes, node, ctx);
          break;
        }
        case "ai": {
          const query = String(this.evalTemplate(node.config?.query as string | undefined, ctx) ?? "根据上下文推荐下一步 Skill");
          const recommendations = recommendSkills(this.db, query, { limit: 1 });
          const top = recommendations[0];
          if (!top) throw new Error(`AI 节点无法找到 Skill: ${currentKey}`);
          const input = this.buildNodeInput(node.config?.input as Json | undefined, ctx);
          const record = await this.engine.execute({ skillId: top.skill.id, input, trigger: "workflow", workflowRunId: runId, skipApproval: true });
          if (record.status !== "completed") throw new Error(`AI 节点 Skill 失败: ${record.error ?? record.status}`);
          ctx.outputs[currentKey] = { chosen_skill: top.skill.name, output: record.output ?? {} };
          ctx.variables[`ai.${node.node_key}`] = top.skill.name;
          currentKey = this.next(nodes, node, ctx);
          break;
        }
        case "condition": {
          const field = node.config?.field as string | undefined;
          const op = (node.config?.op as string | undefined) ?? "eq";
          const value = node.config?.value;
          const actual = field ? this.resolvePath(ctx, String(field)) : undefined;
          const matched = compareValues(actual, op, value);
          const branches = (node.config?.branches as { to?: string; when?: string }[] | undefined) ?? [];
          const target = branches.find((b) => (b.when === "true") === matched)?.to ?? branches.find((b) => !b.when)?.to;
          ctx.logs.push({ node: currentKey, message: `条件 ${field} ${op} ${JSON.stringify(value)} → ${matched ? "true" : "false"}`, at: nowIso() });
          currentKey = target ?? "";
          break;
        }
        case "transform": {
          const set = node.config?.set as Record<string, string> | undefined;
          if (set) {
            for (const [k, expr] of Object.entries(set)) {
              ctx.variables[k] = this.evalTemplate(expr as string, ctx);
            }
          }
          currentKey = this.next(nodes, node, ctx);
          break;
        }
        case "human_approval": {
          const message = String(node.config?.message ?? "请确认是否继续");
          ctx.logs.push({ node: currentKey, message: `等待人工审批: ${message}`, at: nowIso() });
          this.persistContext(runId, ctx);
          this.db
            .prepare("UPDATE workflow_runs SET status='awaiting_approval', current_node=?, logs=? WHERE id=?")
            .run(currentKey, JSON.stringify(ctx.logs), runId);
          return;
        }
        case "loop": {
          const count = Number(node.config?.count ?? 1);
          const loopNode = node.config?.node as string | undefined;
          if (!loopNode) throw new Error(`Loop 节点缺少 node: ${currentKey}`);
          for (let i = 0; i < count; i++) {
            const target = nodes.find((n) => n.node_key === loopNode);
            if (!target) throw new Error(`Loop 目标节点不存在: ${loopNode}`);
            ctx.variables["loop.index"] = i;
            await this.walk(runId, wf, nodes, loopNode, ctx);
            // re-check status (approval may have paused)
            const st = this.db.prepare("SELECT status FROM workflow_runs WHERE id=?").get(runId) as { status: string };
            if (st.status !== "running") return;
          }
          currentKey = this.next(nodes, node, ctx);
          break;
        }
        case "webhook":
          currentKey = this.next(nodes, node, ctx);
          break;
        default:
          throw new Error(`未知节点类型: ${node.type}`);
      }
      this.saveLogs(runId, ctx.logs);
    }
  }

  /** Resume an awaiting-approval workflow run. */
  async resume(runId: string): Promise<WorkflowRunDetail> {
    const run = this.getRun(runId);
    if (run.status !== "awaiting_approval") return run;
    const current = run.current_node;
    const wf = this.getWorkflow(run.workflow_id) as (Record<string, unknown> & { nodes: WorkflowNode[] }) | null;
    if (!wf) throw new Error("workflow not found");
    // Reconstruct context from logs is lossy; simplest: restart from current node with empty context is wrong.
    // We persist run context in workflow_runs.result interim — for MVP we store a JSON context.
    const ctxRaw = parseJson<{ input: Json; outputs: Record<string, Json>; variables: Record<string, unknown>; logs: { node: string; message: string; at: string }[] }>(
      String((this.db.prepare("SELECT result FROM workflow_runs WHERE id=?").get(runId) as { result: string }).result ?? "{}"),
      { input: {}, outputs: {}, variables: {}, logs: [] },
    );
    const ctx: RunContext = { ...ctxRaw, logs: [...ctxRaw.logs] };
    this.db.prepare("UPDATE workflow_runs SET status='running', current_node=?, result=? WHERE id=?").run(null, JSON.stringify(ctx), runId);
    // Persist context for future resumes
    this.persistContext(runId, ctx);
    if (!current) return this.getRun(runId);

    // Auto-approve any skill executions from this run that were awaiting approval.
    const pending = this.db
      .prepare("SELECT id FROM skill_executions WHERE workflow_run_id = ? AND status = 'awaiting_approval'")
      .all(runId) as { id: string }[];
    for (const p of pending) {
      try {
        this.engine.approve(p.id);
      } catch {
        /* ignore individual failures */
      }
    }

    // If the pause was at a gate node, continue past it.
    const nodes = wf.nodes as WorkflowNode[];
    const node = nodes.find((n) => n.node_key === current);
    let startKey = current;
    if (node && (node.type === "human_approval" || node.type === "skill")) {
      startKey = this.next(nodes, node, ctx);
    }
    await this.walk(runId, wf, nodes, startKey, ctx);
    const st = this.db.prepare("SELECT status FROM workflow_runs WHERE id=?").get(runId) as { status: string };
    if (st.status === "running") {
      this.db
        .prepare("UPDATE workflow_runs SET status='completed', result=?, finished_at=?, current_node=NULL, logs=? WHERE id=?")
        .run(JSON.stringify(ctx.variables.result ?? { outputs: ctx.outputs, variables: ctx.variables }), nowIso(), JSON.stringify(ctx.logs), runId);
    }
    return this.getRun(runId);
  }

  private persistContext(runId: string, ctx: RunContext): void {
    this.db.prepare("UPDATE workflow_runs SET result = ? WHERE id = ?").run(JSON.stringify(ctx), runId);
  }

  private saveLogs(runId: string, logs: RunContext["logs"]): void {
    this.db.prepare("UPDATE workflow_runs SET logs = ? WHERE id = ?").run(JSON.stringify(logs), runId);
  }

  private next(nodes: WorkflowNode[], node: WorkflowNode, ctx: RunContext): string {
    const edges = node.edges ?? [];
    if (edges.length === 0) return "";
    if (edges.length === 1) return edges[0];
    // Multiple edges: prefer one with a "when" condition matching, else first
    return edges[0];
  }

  /** Coerce template-produced strings into schema-typed values (number/boolean/array). */
  private coerceInput(skillId: string, input: Json): Json {
    const skill = this.db.prepare("SELECT input_schema FROM skills WHERE id = ? OR slug = ? LIMIT 1").get(skillId, skillId) as
      | { input_schema: string }
      | undefined;
    if (!skill) return input;
    const schema = parseJson<{ properties?: Record<string, { type?: string }> }>(skill.input_schema, {});
    const out: Json = { ...input };
    for (const [key, prop] of Object.entries(schema.properties ?? {})) {
      const val = out[key];
      if (val == null) continue;
      if (prop.type === "number") {
        const n = Number(val);
        out[key] = Number.isNaN(n) ? val : n;
      } else if (prop.type === "boolean") {
        out[key] = val === true || val === "true" || val === "1";
      } else if (prop.type === "array" && typeof val === "string") {
        try {
          out[key] = JSON.parse(val);
        } catch {
          out[key] = val.split(/[,，]/).map((x: string) => x.trim()).filter(Boolean);
        }
      }
    }
    return out;
  }

  private buildNodeInput(template: Json | undefined, ctx: RunContext): Json {
    if (!template) return { context: ctx.variables, input: ctx.input };
    const out: Json = {};
    for (const [k, v] of Object.entries(template)) {
      out[k] = typeof v === "string" ? this.evalTemplate(v, ctx) : v;
    }
    return out;
  }

  private evalTemplate(template: string | undefined, ctx: RunContext): unknown {
    if (!template) return undefined;
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, path: string) => {
      const val = this.resolvePath(ctx, path);
      return val == null ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
    });
  }

  private resolvePath(ctx: RunContext, path: string): unknown {
    if (path.startsWith("input.")) {
      return path.slice(6).split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], ctx.input);
    }
    if (path.startsWith("output.")) {
      return path.split(".").slice(1).reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], ctx.outputs);
    }
    return path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], ctx.variables);
  }

  getRun(runId: string): WorkflowRunDetail {
    const row = this.db.prepare("SELECT * FROM workflow_runs WHERE id = ?").get(runId) as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Run ${runId} not found`);
    const wf = this.db.prepare("SELECT name FROM workflows WHERE id = ?").get(String(row.workflow_id)) as { name: string } | undefined;
    return {
      id: String(row.id),
      workflow_id: String(row.workflow_id),
      workflow_name: wf?.name ?? "unknown",
      status: row.status as WorkflowRunStatus,
      current_node: row.current_node ? String(row.current_node) : null,
      result: row.result ? parseJson(String(row.result), null) : null,
      error: row.error ? String(row.error) : null,
      logs: parseJson(String(row.logs), []),
      started_at: row.started_at ? String(row.started_at) : null,
      finished_at: row.finished_at ? String(row.finished_at) : null,
      created_at: String(row.created_at),
    };
  }

  listRuns(workflowId?: string): WorkflowRunDetail[] {
    const rows = workflowId
      ? (this.db.prepare("SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY created_at DESC LIMIT 50").all(workflowId) as Record<string, unknown>[])
      : (this.db.prepare("SELECT * FROM workflow_runs ORDER BY created_at DESC LIMIT 50").all() as Record<string, unknown>[]);
    return rows.map((row) => {
      const wf = this.db.prepare("SELECT name FROM workflows WHERE id = ?").get(String(row.workflow_id)) as { name: string } | undefined;
      return {
        id: String(row.id),
        workflow_id: String(row.workflow_id),
        workflow_name: wf?.name ?? "unknown",
        status: row.status as WorkflowRunStatus,
        current_node: row.current_node ? String(row.current_node) : null,
        result: row.result ? parseJson(String(row.result), null) : null,
        error: row.error ? String(row.error) : null,
        logs: parseJson(String(row.logs), []),
        started_at: row.started_at ? String(row.started_at) : null,
        finished_at: row.finished_at ? String(row.finished_at) : null,
        created_at: String(row.created_at),
      };
    });
  }
}

function compareValues(actual: unknown, op: string, expected: unknown): boolean {
  switch (op) {
    case "eq": return actual == expected;
    case "neq": return actual != expected;
    case "gt": return Number(actual) > Number(expected);
    case "gte": return Number(actual) >= Number(expected);
    case "lt": return Number(actual) < Number(expected);
    case "lte": return Number(actual) <= Number(expected);
    case "contains": return String(actual ?? "").includes(String(expected ?? ""));
    case "not_contains": return !String(actual ?? "").includes(String(expected ?? ""));
    case "exists": return actual != null && actual !== "";
    default: return false;
  }
}
