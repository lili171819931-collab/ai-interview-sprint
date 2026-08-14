import { json, handle, readBody, ctx } from "../../helpers";
import { getSkill, updateSkill, deleteSkill } from "@/lib/core/skill-registry";
import type { Manifest } from "@/lib/core/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const skill = getSkill(ctx().db, id);
    if (!skill) throw new Error(`Skill ${id} not found`);
    return { skill };
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await readBody(req);
    const skill = updateSkill(ctx().db, id, body as Partial<Manifest>);
    return { skill, ok: true };
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    deleteSkill(ctx().db, id);
    return { ok: true };
  });
}
