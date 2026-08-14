import { json, handle, readBody, ctx } from "../../helpers";
import { createSkill } from "@/lib/core/skill-registry";
import type { Manifest } from "@/lib/core/types";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const manifest = body.manifest ? (body.manifest as unknown as Manifest) : (body as unknown as Manifest);
    const skill = createSkill(ctx().db, manifest, { source: "import", upsert: true });
    return { skill, ok: true, message: "Skill 已注册并自动进入 Registry / 搜索 / Agent Tool Registry" };
  });
}
