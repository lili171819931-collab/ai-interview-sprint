import type { Db } from "../../db/connection";
import type { Json, SkillDetail } from "../types";
import { newId, nowIso, parseJson } from "../types";
import { understandIntent, type Intent } from "./intent";
import { recommendSkills, type Recommendation } from "../recommendation";
import { searchSkills } from "../search";
import { getSkill, listSkills } from "../skill-registry";
import type { ExecutionEngine } from "../execution-engine";

export interface AgentPlanStep {
  skillId: string;
  skillName: string;
  reason: string;
  input: Json;
  status: "pending" | "running" | "completed" | "failed" | "skipped" | "awaiting_approval";
  output?: Json;
  error?: string;
  executionId?: string;
}

export interface AgentPlan {
  id: string;
  sessionId: string;
  task: string;
  intent: Intent;
  recommendations: Recommendation[];
  steps: AgentPlanStep[];
  status: "proposed" | "approved" | "running" | "awaiting_approval" | "completed" | "failed" | "cancelled";
  createdAt: string;
}

export interface AgentChatResult {
  sessionId: string;
  message: string;
  plan: AgentPlan;
}

interface ChatParams {
  sessionId?: string | null;
  message: string;
  autoExecute?: boolean;
}

export class AgentBrain {
  constructor(private db: Db, private engine: ExecutionEngine) {}

  /** Full chat turn: persist message, understand, recommend, plan, optionally execute. */
  async chat(params: ChatParams): Promise<AgentChatResult> {
    const sessionId = params.sessionId ?? this.createSession(params.message);
    this.addMessage(sessionId, "user", params.message);

    const plan = await this.plan(sessionId, params.message);
    let response = composePlanMessage(plan);

    if (params.autoExecute) {
      const executed = await this.executePlan(plan.id);
      response = composePlanMessage(executed);
    }
    this.addMessage(sessionId, "agent", response);
    return { sessionId, message: response, plan };
  }

  /** Understand + recommend + build a plan (does not execute). */
  async plan(sessionId: string, task: string): Promise<AgentPlan> {
    const intent = understandIntent(task);
    intent.isSkillRequest = true; // skill mention resolved below

    const existing = listSkills(this.db, { status: "active", limit: 500 });
    const mentioned = existing.find((s) => task.toLowerCase().includes(s.name.toLowerCase()));

    let recommendations: Recommendation[];
    if (mentioned) {
      intent.skillMention = mentioned.name;
      recommendations = [{ skill: mentioned, score: 1, reasons: ["用户直接指定了该 Skill"] }];
    } else {
      recommendations = recommendSkills(this.db, task, { limit: 5 });
    }

    const steps = this.buildSteps(intent, task, recommendations);
    const planId = newId("plan");
    this.db
      .prepare("INSERT INTO agent_plans (id, session_id, task, steps, status) VALUES (?, ?, ?, ?, 'proposed')")
      .run(planId, sessionId, task, JSON.stringify(steps));

    for (const rec of recommendations) {
      this.db
        .prepare("INSERT INTO recommendations (id, session_id, skill_id, score, reasons) VALUES (?, ?, ?, ?, ?)")
        .run(newId("rec"), sessionId, rec.skill.id, rec.score, JSON.stringify(rec.reasons));
    }

    return {
      id: planId,
      sessionId,
      task,
      intent,
      recommendations,
      steps,
      status: "proposed",
      createdAt: nowIso(),
    };
  }

  /** Execute a proposed plan step by step with failure recovery. */
  async executePlan(planId: string): Promise<AgentPlan> {
    const row = this.db.prepare("SELECT * FROM agent_plans WHERE id = ?").get(planId) as
      | { id: string; session_id: string; task: string; steps: string; status: string }
      | undefined;
    if (!row) throw new Error(`Plan ${planId} not found`);
    const steps = parseJson<AgentPlanStep[]>(row.steps, []);
    this.db.prepare("UPDATE agent_plans SET status = 'running' WHERE id = ?").run(planId);

    const recommendations = recommendSkills(this.db, row.task, { limit: 10 });
    const usedIds = new Set<string>();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.status === "completed" || step.status === "skipped") continue;
      usedIds.add(step.skillId);
      steps[i].status = "running";
      this.saveSteps(planId, steps);

      try {
        const record = await this.engine.execute({
          skillId: step.skillId,
          input: step.input,
          trigger: "agent",
          agentSessionId: row.session_id,
        });
        steps[i].executionId = record.id;
        this.recordToolCall(row.session_id, planId, step, record.id, "running");

        if (record.status === "awaiting_approval") {
          steps[i].status = "awaiting_approval";
          this.saveSteps(planId, steps);
          this.db.prepare("UPDATE agent_plans SET status = 'awaiting_approval' WHERE id = ?").run(planId);
          return this.loadPlan(planId);
        }
        if (record.status === "completed") {
          steps[i].status = "completed";
          steps[i].output = record.output ?? {};
          this.updateToolCall(record.id, "completed", record.output ?? {});
        } else {
          throw new Error(record.error ?? "execution failed");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        steps[i].status = "failed";
        steps[i].error = message;
        // Failure recovery: try an alternative skill
        const alternative = recommendations.find((r) => !usedIds.has(r.skill.id) && r.skill.id !== step.skillId);
        if (alternative) {
          const altIntent = understandIntent(row.task);
          const altStep: AgentPlanStep = {
            skillId: alternative.skill.id,
            skillName: alternative.skill.name,
            reason: `原 Skill 失败，使用备选: ${alternative.skill.name}`,
            input: buildInputForSkill(alternative.skill, altIntent, row.task),
            status: "pending",
          };
          try {
            const altRecord = await this.engine.execute({
              skillId: altStep.skillId,
              input: altStep.input,
              trigger: "agent",
              agentSessionId: row.session_id,
            });
            altStep.executionId = altRecord.id;
            this.recordToolCall(row.session_id, planId, altStep, altRecord.id, "running");
            if (altRecord.status === "awaiting_approval") {
              altStep.status = "awaiting_approval";
              steps.splice(i + 1, 0, altStep);
              this.saveSteps(planId, steps);
              this.db.prepare("UPDATE agent_plans SET status = 'awaiting_approval' WHERE id = ?").run(planId);
              return this.loadPlan(planId);
            }
            if (altRecord.status === "completed") {
              altStep.status = "completed";
              altStep.output = altRecord.output ?? {};
              this.updateToolCall(altRecord.id, "completed", altRecord.output ?? {});
              steps[i].status = "skipped";
              steps[i].error = `已切换备选: ${message}`;
            } else {
              altStep.status = "failed";
              altStep.error = altRecord.error ?? "execution failed";
            }
            steps.splice(i + 1, 0, altStep);
          } catch (altErr) {
            altStep.status = "failed";
            altStep.error = altErr instanceof Error ? altErr.message : String(altErr);
            steps.splice(i + 1, 0, altStep);
          }
        }
      }
      this.saveSteps(planId, steps);
    }

    const finalSteps = parseJson<AgentPlanStep[]>(this.db.prepare("SELECT steps FROM agent_plans WHERE id = ?").get(planId)!.steps, []);
    const anyFailed = finalSteps.some((s) => s.status === "failed");
    const anyAwaiting = finalSteps.some((s) => s.status === "awaiting_approval");
    const status = anyAwaiting ? "awaiting_approval" : anyFailed ? "failed" : "completed";
    this.db.prepare("UPDATE agent_plans SET status = ? WHERE id = ?").run(status, planId);
    this.markRecommendationsAccepted(row.session_id, finalSteps);
    return this.loadPlan(planId);
  }

  /** Resume a plan whose steps were awaiting approval (after user approves). */
  async resumePlan(planId: string): Promise<AgentPlan> {
    const plan = this.loadPlan(planId);
    const stillAwaiting = plan.steps.some((s) => s.status === "awaiting_approval");
    if (!stillAwaiting) return plan;
    // Approve pending executions, then re-run
    for (const step of plan.steps) {
      if (step.status === "awaiting_approval" && step.executionId) {
        try {
          const record = await this.engine.approve(step.executionId);
          step.status = record.status === "completed" ? "completed" : "failed";
          step.output = record.output ?? undefined;
          step.error = record.error ?? undefined;
        } catch (err) {
          step.status = "failed";
          step.error = err instanceof Error ? err.message : String(err);
        }
      }
    }
    this.saveSteps(planId, plan.steps);
    const still = plan.steps.filter((s) => s.status === "pending" || s.status === "running" || s.status === "awaiting_approval");
    if (still.length === 0) {
      const anyFailed = plan.steps.some((s) => s.status === "failed");
      this.db.prepare("UPDATE agent_plans SET status = ? WHERE id = ?").run(anyFailed ? "failed" : "completed", planId);
      this.markRecommendationsAccepted(plan.sessionId, plan.steps);
    }
    return this.loadPlan(planId);
  }

  private buildSteps(intent: Intent, task: string, recommendations: Recommendation[]): AgentPlanStep[] {
    if (intent.skillMention && recommendations.length > 0) {
      const skill = recommendations[0].skill;
      return [this.makeStep(skill, "用户指定", intent, task)];
    }
    const chosen = recommendations.slice(0, 3);
    // Order: research/analysis first, then creation, then reporting
    const research = chosen.filter((r) => /research|analysis|scan|intelligence|collect|search/i.test(r.skill.name) || r.skill.category?.name.includes("Research"));
    const creation = chosen.filter((r) => /generate|create|writer|content|script|report|summary|topic|strategy/i.test(r.skill.name));
    const rest = chosen.filter((r) => !research.includes(r) && !creation.includes(r));
    const ordered = [...research, ...creation, ...rest].slice(0, 4);
    return ordered.map((r) => this.makeStep(r.skill, r.reasons[0] ?? "匹配需求", intent, task));
  }

  private makeStep(skill: SkillDetail, reason: string, intent: Intent, task: string): AgentPlanStep {
    return { skillId: skill.id, skillName: skill.name, reason, input: buildInputForSkill(skill, intent, task), status: "pending" };
  }

  private saveSteps(planId: string, steps: AgentPlanStep[]): void {
    this.db.prepare("UPDATE agent_plans SET steps = ? WHERE id = ?").run(JSON.stringify(steps), planId);
  }

  private loadPlan(planId: string): AgentPlan {
    const row = this.db.prepare("SELECT * FROM agent_plans WHERE id = ?").get(planId) as {
      id: string;
      session_id: string;
      task: string;
      steps: string;
      status: string;
    };
    const intent = understandIntent(row.task);
    const recRows = this.db
      .prepare("SELECT * FROM recommendations WHERE session_id = ? ORDER BY score DESC")
      .all(row.session_id) as { skill_id: string; score: number; reasons: string }[];
    const recommendations: Recommendation[] = recRows
      .map((r) => {
        const skill = getSkill(this.db, r.skill_id);
        return skill ? { skill, score: r.score, reasons: parseJson<string[]>(r.reasons, []) } : null;
      })
      .filter((r): r is Recommendation => r !== null);
    return {
      id: row.id,
      sessionId: row.session_id,
      task: row.task,
      intent,
      recommendations,
      steps: parseJson<AgentPlanStep[]>(row.steps, []),
      status: row.status as AgentPlan["status"],
      createdAt: nowIso(),
    };
  }

  private createSession(title: string): string {
    const id = newId("sess");
    this.db
      .prepare("INSERT INTO agent_sessions (id, title, status) VALUES (?, ?, 'active')")
      .run(id, title.slice(0, 80));
    return id;
  }

  private addMessage(sessionId: string, role: "user" | "agent" | "system", content: string): void {
    this.db
      .prepare("INSERT INTO agent_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)")
      .run(newId("amsg"), sessionId, role, content);
    this.db.prepare("UPDATE agent_sessions SET updated_at = ? WHERE id = ?").run(nowIso(), sessionId);
  }

  private recordToolCall(
    sessionId: string,
    planId: string,
    step: AgentPlanStep,
    executionId: string,
    status: string,
  ): void {
    this.db
      .prepare(
        "INSERT INTO agent_tool_calls (id, session_id, plan_id, skill_id, execution_id, step_index, input, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(newId("atc"), sessionId, planId, step.skillId, executionId, 0, JSON.stringify(step.input), status);
  }

  private updateToolCall(executionId: string, status: string, output: Json): void {
    this.db
      .prepare("UPDATE agent_tool_calls SET status = ?, output = ? WHERE execution_id = ?")
      .run(status, JSON.stringify(output), executionId);
  }

  private markRecommendationsAccepted(sessionId: string, steps: AgentPlanStep[]): void {
    const accepted = new Set(steps.filter((s) => s.status === "completed").map((s) => s.skillId));
    const rows = this.db
      .prepare("SELECT id, skill_id FROM recommendations WHERE session_id = ? AND accepted IS NULL")
      .all(sessionId) as { id: string; skill_id: string }[];
    for (const r of rows) {
      if (accepted.has(r.skill_id)) {
        this.db.prepare("UPDATE recommendations SET accepted = 1 WHERE id = ?").run(r.id);
        this.db
          .prepare(
            `UPDATE skill_usage_stats SET ai_recommended_count = ai_recommended_count + 1, ai_accepted_count = ai_accepted_count + 1
             WHERE skill_id = ? AND date = ?`,
          )
          .run(r.skill_id, nowIso().slice(0, 10));
      } else {
        this.db.prepare("UPDATE recommendations SET accepted = 0 WHERE id = ?").run(r.id);
        this.db
          .prepare(
            `INSERT INTO skill_usage_stats (id, skill_id, date, ai_recommended_count) VALUES (?, ?, ?, 1)
             ON CONFLICT(skill_id, date) DO UPDATE SET ai_recommended_count = ai_recommended_count + 1`,
          )
          .run(newId("stat"), r.skill_id, nowIso().slice(0, 10));
      }
    }
  }

  listSessions(): { id: string; title: string; updated_at: string }[] {
    return this.db
      .prepare("SELECT id, title, updated_at FROM agent_sessions ORDER BY updated_at DESC LIMIT 50")
      .all() as { id: string; title: string; updated_at: string }[];
  }

  messages(sessionId: string): { id: string; role: string; content: string; created_at: string }[] {
    return this.db
      .prepare("SELECT id, role, content, created_at FROM agent_messages WHERE session_id = ? ORDER BY created_at ASC")
      .all(sessionId) as { id: string; role: string; content: string; created_at: string }[];
  }
}

function buildInputForSkill(skill: SkillDetail, intent: Intent, task: string): Json {
  const schema = parseJson<{ properties?: Record<string, { type?: string; required?: boolean; description?: string; enum?: unknown[] }> }>(
    skill.input_schema,
    {},
  );
  const input: Json = {};
  const props = schema.properties ?? {};
  for (const [key, prop] of Object.entries(props)) {
    // Respect enum constraints: prefer a value mentioned in the task.
    if (prop.enum && prop.enum.length > 0) {
      const matched = prop.enum.find(
        (e) => typeof e === "string" && (task.toLowerCase().includes(e.toLowerCase()) || intent.entities.some((en) => e.toLowerCase().includes(en))),
      );
      input[key] = matched ?? prop.enum[0];
      continue;
    }
    if (prop.type === "string") {
      if (/query|q\b|prompt|topic|text|content|task|message|requirement/.test(key)) input[key] = task;
      else if (/keyword|tag|entity/.test(key)) input[key] = intent.keywords.slice(0, 5).join(", ");
      else if (/platform|source|channel/.test(key)) input[key] = intent.entities[0] ?? "tiktok";
      else if (/topic|subject|subject/.test(key)) input[key] = task.slice(0, 120);
      else input[key] = task.slice(0, 200);
    } else if (prop.type === "number") {
      input[key] = /count|limit|number|n\b|top/.test(key) ? 5 : 1;
    } else if (prop.type === "boolean") {
      input[key] = false;
    } else if (prop.type === "array") {
      input[key] = intent.entities.length ? intent.entities : intent.keywords.slice(0, 3);
    } else {
      input[key] = task.slice(0, 200);
    }
  }
  return input;
}

/** Compose the human-readable agent response for a plan. */
export function composePlanMessage(plan: AgentPlan): string {
  const lines: string[] = [];
  lines.push(`## 我理解的目标\n${plan.task}\n`);
  lines.push(`**意图**: ${plan.intent.category} · ${plan.intent.actions.join(", ")}${plan.intent.entities.length ? ` · 关注平台: ${plan.intent.entities.join(", ")}` : ""}\n`);
  lines.push(`## 推荐 Skills`);
  plan.recommendations.slice(0, 5).forEach((r, i) => {
    lines.push(`${i + 1}. **${r.skill.name}** — ${r.reasons.join("；")}`);
  });
  lines.push(`\n## 执行计划`);
  plan.steps.forEach((s, i) => {
    const statusIcon = { pending: "○", running: "●", completed: "✅", failed: "❌", skipped: "⏭️", awaiting_approval: "⏸️" }[s.status];
    lines.push(`${i + 1}. ${statusIcon} ${s.skillName} — ${s.reason}`);
    if (s.output) {
      const preview = JSON.stringify(s.output).slice(0, 160);
      lines.push(`   ↳ ${preview}`);
    }
    if (s.error) lines.push(`   ↳ ⚠️ ${s.error}`);
  });
  lines.push(`\n## 状态\n${plan.status === "completed" ? "✅ 任务完成" : plan.status === "awaiting_approval" ? "⏸️ 等待审批（部分步骤需要确认）" : plan.status === "proposed" ? "请确认后执行" : plan.status === "running" ? "执行中…" : "⚠️ 部分步骤失败"}`);
  return lines.join("\n");
}
