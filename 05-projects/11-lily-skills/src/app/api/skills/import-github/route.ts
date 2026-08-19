import { json, handle, readBody, ctx } from "../../helpers";
import { importFromGitHub } from "@/lib/core/github-import";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const url = String(body.url ?? "").trim();
    if (!url) throw new Error("url is required");
    const result = await importFromGitHub(ctx().db, url, {
      name: body.name ? String(body.name) : undefined,
      description: body.description ? String(body.description) : undefined,
      category: body.category ? String(body.category) : undefined,
      execution_type: body.execution_type ? (String(body.execution_type) as "cli" | "http" | "api" | "local" | "composite" | "echo") : undefined,
      command: body.command ? String(body.command) : undefined,
      endpoint: body.endpoint ? String(body.endpoint) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    });
    return {
      ok: true,
      skill: result.skill,
      manifest: result.manifest,
      source: result.source,
      message: `已从 GitHub 导入「${result.skill.name}」并自动注册到 Registry / 搜索 / Agent Tool Registry`,
    };
  });
}
