import { json, handle, readBody, ctx } from "../helpers";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const skillId = String(body.skillId ?? "");
    const db = ctx().db;
    if (!skillId) throw new Error("skillId is required");
    const existing = db.prepare("SELECT 1 FROM favorites WHERE skill_id = ?").get(skillId);
    if (existing) {
      db.prepare("DELETE FROM favorites WHERE skill_id = ?").run(skillId);
      return { favorite: false, ok: true };
    }
    db.prepare("INSERT INTO favorites (skill_id) VALUES (?)").run(skillId);
    return { favorite: true, ok: true };
  });
}
