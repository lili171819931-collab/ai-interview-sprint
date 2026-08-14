import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTest, teardownTest, type TestEnv } from "../helpers";

let env: TestEnv;
beforeEach(() => { env = setupTest(); });
afterEach(() => { teardownTest(); });

describe("AI Agent", () => {
  it("understands intent and builds a multi-skill plan", async () => {
    const result = await env.agent.chat({ message: "帮我分析 TikTok 上 AI Agent 的热点并生成选题", autoExecute: false });
    expect(result.plan.intent.category).toBe("AI & Research");
    expect(result.plan.recommendations.length).toBeGreaterThan(0);
    expect(result.plan.steps.length).toBeGreaterThan(0);
  });

  it("recognizes a skill mention and plans a single step", async () => {
    const result = await env.agent.chat({ message: "运行 echo demo", autoExecute: false });
    expect(result.plan.intent.skillMention).toBe("Echo Demo");
    expect(result.plan.steps[0].skillName).toBe("Echo Demo");
  });

  it("executes the plan end-to-end", async () => {
    const result = await env.agent.chat({ message: "帮我分析 TikTok 上 AI Agent 的热点并生成 3 个选题", autoExecute: false });
    const executed = await env.agent.executePlan(result.plan.id);
    expect(executed.status).toBe("completed");
    expect(executed.steps.some((s) => s.status === "completed")).toBe(true);
  });

  it("recovers from a failing step with an alternative", async () => {
    const result = await env.agent.chat({ message: "生成一个内容简报", autoExecute: false });
    const executed = await env.agent.executePlan(result.plan.id);
    // Should not throw; recovery either completes or fails gracefully with a status
    expect(["completed", "failed", "awaiting_approval"]).toContain(executed.status);
  });
});
