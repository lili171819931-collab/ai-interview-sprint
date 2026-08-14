import path from "node:path";
import { resetDbForTests, closeDb, type Db } from "../src/lib/db/connection";
import { createSchema } from "../src/lib/db/schema";
import { ensureDefaultCategories, ensureDefaultUser, scanSkillFolder } from "../src/lib/core/skill-registry";
import { createEngine, ExecutionEngine } from "../src/lib/core/execution-engine";
import { AgentBrain } from "../src/lib/core/agent/agent";
import { WorkflowEngine } from "../src/lib/core/workflow-engine";

export interface TestEnv {
  db: Db;
  engine: ExecutionEngine;
  agent: AgentBrain;
  workflows: WorkflowEngine;
}

export function setupTest(): TestEnv {
  const db = resetDbForTests(":memory:");
  createSchema(db);
  ensureDefaultUser(db);
  ensureDefaultCategories(db);
  scanSkillFolder(db, path.join(process.cwd(), "skills"));
  const engine = createEngine(db, process.cwd());
  const agent = new AgentBrain(db, engine);
  const workflows = new WorkflowEngine(db, engine, agent);
  return { db, engine, agent, workflows };
}

export function teardownTest(): void {
  closeDb();
}
