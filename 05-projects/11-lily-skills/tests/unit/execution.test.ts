import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTest, teardownTest, type TestEnv } from "../helpers";
import { createSkill } from "../../src/lib/core/skill-registry";

let env: TestEnv;
beforeEach(() => { env = setupTest(); });
afterEach(() => { teardownTest(); });

describe("Execution Engine", () => {
  it("executes a local skill via adapter runner", async () => {
    const skill = env.db.prepare("SELECT * FROM skills WHERE slug = 'calculator'").get() as { id: string };
    const record = await env.engine.execute({ skillId: skill.id, input: { expression: "(2+3)*6" }, trigger: "api", skipApproval: true });
    expect(record.status).toBe("completed");
    expect(record.output).toMatchObject({ result: 30 });
  });

  it("fails a local skill that has no adapter file", async () => {
    const skill = createSkill(env.db, {
      name: "NoAdapter", version: "1.0.0", description: "no adapter", category: "Other",
      tags: [], execution_type: "local", risk_level: "low", permissions: ["read"],
    });
    const record = await env.engine.execute({ skillId: skill.id, input: {}, trigger: "api", skipApproval: true });
    expect(record.status).toBe("failed");
    expect(record.error).toContain("adapter");
  });

  it("validates required inputs", async () => {
    const skill = createSkill(env.db, {
      name: "NeedInput", version: "1", description: "x", category: "Other", tags: [],
      execution_type: "echo", risk_level: "low", permissions: [],
      input_schema: { type: "object", properties: { message: { type: "string", required: true } }, required: ["message"] },
    });
    const record = await env.engine.execute({ skillId: skill.id, input: {}, trigger: "api", skipApproval: true });
    expect(record.status).toBe("failed");
    expect(record.error).toContain("message");
  });

  it("echo adapter returns input", async () => {
    const skill = createSkill(env.db, { name: "Echo", version: "1", description: "x", category: "Other", tags: [], execution_type: "echo", risk_level: "low", permissions: [] });
    const record = await env.engine.execute({ skillId: skill.id, input: { message: "hi" }, trigger: "manual", skipApproval: true });
    expect(record.status).toBe("completed");
    expect(record.output).toMatchObject({ echoed: { message: "hi" } });
  });

  it("gates high-risk skills behind approval", async () => {
    const skill = createSkill(env.db, { name: "Risky", version: "1", description: "x", category: "Other", tags: [], execution_type: "echo", risk_level: "critical", permissions: ["write"] });
    const record = await env.engine.execute({ skillId: skill.id, input: {}, trigger: "manual" });
    expect(record.status).toBe("awaiting_approval");
    const approved = await env.engine.approve(record.id);
    expect(approved.status).toBe("completed");
  });

  it("tracks usage stats and health", async () => {
    const skill = createSkill(env.db, { name: "Stats", version: "1", description: "x", category: "Other", tags: [], execution_type: "echo", risk_level: "low", permissions: [] });
    await env.engine.execute({ skillId: skill.id, input: {}, trigger: "manual", skipApproval: true });
    const row = env.db.prepare("SELECT usage_count, success_count FROM skills WHERE id = ?").get(skill.id) as { usage_count: number; success_count: number };
    expect(row.usage_count).toBe(1);
    expect(row.success_count).toBe(1);
    const stats = env.db.prepare("SELECT * FROM skill_usage_stats WHERE skill_id = ?").get(skill.id) as { usage_count: number };
    expect(stats.usage_count).toBe(1);
  });
});
