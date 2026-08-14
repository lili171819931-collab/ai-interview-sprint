import path from "node:path";
import { bootstrap, getContext } from "../src/lib/bootstrap";
import { newId } from "../src/lib/core/types";

async function main() {
  bootstrap();
  const { db, workflows } = getContext();

  // Seed a sample workflow if none exists
  const wfCount = (db.prepare("SELECT COUNT(*) AS c FROM workflows").get() as { c: number }).c;
  if (wfCount === 0) {
    const wf = workflows.createWorkflow({
      name: "海外 AI 热点周报",
      description: "扫描热点 → AI 决策 → 生成选题 → 输出周报（演示工作流）",
      icon: "🗞️",
      triggerType: "schedule",
      schedule: "0 9 * * 1",
    });
    workflows.updateWorkflow(String(wf.id), {
      status: "active",
      nodes: [
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "trigger", type: "trigger", config: {}, position: { x: 40, y: 40 }, edges: ["scan"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "scan", type: "skill", config: { skill_id: "trend-scanner", input: { platform: "{{input.platform}}", topic: "{{input.topic}}", count: "{{input.count}}" } }, position: { x: 240, y: 40 }, edges: ["generate"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "generate", type: "skill", config: { skill_id: "topic-generator", input: { topic: "{{input.topic}}", keywords: "{{output.scan.summary}}", count: "{{input.count}}" } }, position: { x: 440, y: 40 }, edges: ["approve"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "approve", type: "human_approval", config: { message: "请确认周报内容后发布" }, position: { x: 640, y: 40 }, edges: ["output"] },
        { id: newId("wn"), workflow_id: String(wf.id), node_key: "output", type: "output", config: { template: "{{output.generate}}" }, position: { x: 840, y: 40 }, edges: [] },
      ],
    });
    console.log(`seeded workflow: ${wf.name}`);
  }

  const skillCount = (db.prepare("SELECT COUNT(*) AS c FROM skills").get() as { c: number }).c;
  console.log(`skills: ${skillCount}, categories: ${(db.prepare("SELECT COUNT(*) AS c FROM skill_categories").get() as { c: number }).c}, workflows: ${wfCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
