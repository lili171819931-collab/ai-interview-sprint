import { json, ctx } from "../helpers";

function parseLocal(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const db = ctx().db;
  const rows = status
    ? db.prepare(
        `SELECT e.*, s.name AS skill_name, s.icon AS skill_icon FROM skill_executions e JOIN skills s ON s.id = e.skill_id
         WHERE e.status = ? ORDER BY e.created_at DESC LIMIT ?`,
      ).all(status, limit)
    : db.prepare(
        `SELECT e.*, s.name AS skill_name, s.icon AS skill_icon FROM skill_executions e JOIN skills s ON s.id = e.skill_id
         ORDER BY e.created_at DESC LIMIT ?`,
      ).all(limit);
  const executions = (rows as Record<string, unknown>[]).map((r) => ({
    ...r,
    input: parseLocal(r.input),
    output: r.output ? parseLocal(r.output) : null,
    logs: parseLocal(r.logs),
  }));
  return json({ executions });
}
