import path from "node:path";
import { getDb } from "./db/connection";
import { createSchema } from "./db/schema";
import { ensureDefaultCategories, ensureDefaultUser, scanSkillFolder } from "./core/skill-registry";
import { createEngine } from "./core/execution-engine";
import { AgentBrain } from "./core/agent/agent";
import { WorkflowEngine } from "./core/workflow-engine";

export interface LilySkillsContext {
  db: ReturnType<typeof getDb>;
  engine: ReturnType<typeof createEngine>;
  agent: AgentBrain;
  workflows: WorkflowEngine;
  projectRoot: string;
}

let ctx: LilySkillsContext | null = null;

/** Initialise the platform once: schema + defaults + skill scan + engines. */
export function bootstrap(): LilySkillsContext {
  if (ctx) return ctx;
  const db = getDb();
  createSchema(db);
  ensureDefaultUser(db);
  ensureDefaultCategories(db);
  const projectRoot = process.cwd();
  const skillsRoot = path.join(projectRoot, "skills");
  if (process.env.LILY_SKILLS_SKIP_SCAN !== "true") {
    scanSkillFolder(db, skillsRoot);
  }
  const engine = createEngine(db, projectRoot);
  const agent = new AgentBrain(db, engine);
  const workflows = new WorkflowEngine(db, engine, agent);
  ctx = { db, engine, agent, workflows, projectRoot };
  return ctx;
}

export function getContext(): LilySkillsContext {
  if (!ctx) return bootstrap();
  return ctx;
}

export function resetContext(): void {
  ctx = null;
}
