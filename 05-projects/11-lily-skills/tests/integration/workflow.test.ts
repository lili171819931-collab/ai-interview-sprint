import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTest, teardownTest, type TestEnv } from "../helpers";
import { newId } from "../../src/lib/core/types";

let env: TestEnv;
beforeEach(() => { env = setupTest(); });
afterEach(() => { teardownTest(); });

describe("Workflow Engine", () => {
  it("creates, lists and runs a linear workflow", async () => {
    const wf = env.workflows.createWorkflow({ name: "Test WF", description: "d", triggerType: "manual" });
    env.workflows.updateWorkflow(String(wf.id), {
      status: "active",
      nodes: [
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "trigger", type: "trigger", config: {}, position: {}, edges: ["calc"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "calc", type: "skill", config: { skill_id: "calculator", input: { expression: "{{input.expr}}" } }, position: {}, edges: ["out"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "out", type: "output", config: { template: "{{output.calc.result}}" }, position: {}, edges: [] },
      ],
    });
    const run = await env.workflows.run(String(wf.id), { expr: "(1+2)*3" });
    expect(run.status).toBe("completed");
    expect(JSON.stringify(run.result)).toContain("9");
  });

  it("pauses at human approval and resumes", async () => {
    const wf = env.workflows.createWorkflow({ name: "Approve WF", triggerType: "manual" });
    env.workflows.updateWorkflow(String(wf.id), {
      status: "active",
      nodes: [
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "trigger", type: "trigger", config: {}, position: {}, edges: ["approve"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "approve", type: "human_approval", config: { message: "确认?" }, position: {}, edges: ["echo"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "echo", type: "skill", config: { skill_id: "echo-demo", input: { message: "{{input.msg}}" } }, position: {}, edges: [] },
      ],
    });
    const run = await env.workflows.run(String(wf.id), { msg: "hi" });
    expect(run.status).toBe("awaiting_approval");
    const resumed = await env.workflows.resume(run.id);
    expect(resumed.status).toBe("completed");
  });

  it("supports condition branching", async () => {
    const wf = env.workflows.createWorkflow({ name: "Cond WF", triggerType: "manual" });
    env.workflows.updateWorkflow(String(wf.id), {
      status: "active",
      nodes: [
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "trigger", type: "trigger", config: {}, position: {}, edges: ["cond"] },
        {
          id: newId("wn"), workflow_id: String(wf.id), node_key: "cond", type: "condition",
          config: { field: "input.n", op: "gt", value: 5, branches: [{ when: "true", to: "big" }, { when: "false", to: "small" }] },
          position: {}, edges: [],
        },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "big", type: "skill", config: { skill_id: "echo-demo", input: { message: "big" } }, position: {}, edges: [] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "small", type: "skill", config: { skill_id: "echo-demo", input: { message: "small" } }, position: {}, edges: [] },
      ],
    });
    const run = await env.workflows.run(String(wf.id), { n: 10 });
    expect(run.status).toBe("completed");
    const result = run.result as { outputs?: Record<string, { echoed?: { message?: string } }> };
    expect(result.outputs?.big?.echoed?.message).toBe("big");
  });
});
