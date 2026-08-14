import { json, handle, ctx } from "../../helpers";
import { scanSkillFolder } from "@/lib/core/skill-registry";

export async function POST() {
  return handle(() => {
    const results = scanSkillFolder(ctx().db, `${process.cwd()}/skills`);
    return { registered: results.map((r) => ({ id: r.id, name: r.name, category: r.category?.name })), ok: true };
  });
}
