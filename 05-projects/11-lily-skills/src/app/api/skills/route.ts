import { json, handle, readBody, ctx } from "../helpers";
import { listSkills, createSkill } from "@/lib/core/skill-registry";
import type { Manifest } from "@/lib/core/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = {
    categoryId: url.searchParams.get("categoryId"),
    tag: url.searchParams.get("tag"),
    status: url.searchParams.get("status"),
    executionType: url.searchParams.get("executionType"),
    q: url.searchParams.get("q"),
    favorite: url.searchParams.get("favorite") === "true",
    sort: url.searchParams.get("sort") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
    offset: Number(url.searchParams.get("offset") ?? 0),
  };
  return json({ skills: listSkills(ctx().db, filters), total: listSkills(ctx().db, { ...filters, limit: 10000 }).length });
}

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const skill = createSkill(ctx().db, body as unknown as Manifest, { source: "manual" });
    return { skill, ok: true };
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const skillId = String(body.id);
    const { updateSkill } = await import("@/lib/core/skill-registry");
    const skill = updateSkill(ctx().db, skillId, body as Partial<Manifest>);
    return { skill, ok: true };
  });
}

