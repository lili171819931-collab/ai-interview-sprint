import { json, ctx } from "../helpers";

export async function GET() {
  const { db, engine } = ctx();
  const counts = {
    skills: (db.prepare("SELECT COUNT(*) AS c FROM skills").get() as { c: number }).c,
    categories: (db.prepare("SELECT COUNT(*) AS c FROM skill_categories").get() as { c: number }).c,
    workflows: (db.prepare("SELECT COUNT(*) AS c FROM workflows").get() as { c: number }).c,
    executions: (db.prepare("SELECT COUNT(*) AS c FROM skill_executions").get() as { c: number }).c,
  };
  return json({ ok: true, status: "running", counts, engine: "ready" });
}
