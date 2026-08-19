import { json, handle, readBody, ctx } from "../../helpers";
import { importRepoSkills } from "@/lib/core/github-import";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const url = String(body.url ?? "").trim();
    if (!url) throw new Error("url is required");
    const result = await importRepoSkills(ctx().db, url, {
      name: body.name ? String(body.name) : undefined,
      description: body.description ? String(body.description) : undefined,
      category: body.category ? String(body.category) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    });
    return {
      ok: true,
      ...result,
      message:
        result.type === "collection"
          ? `已导入 Skill 集合，注册 ${result.count} 个 Skill（${result.skills.map((s) => s.name).slice(0, 8).join("、")}${result.count > 8 ? "…" : ""}）`
          : `已导入「${result.skills[0]?.name}」并注册`,
    };
  });
}
