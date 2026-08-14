import { json, handle, ctx } from "../../helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const record = ctx().engine.getRecord(id);
    const skill = ctx().db.prepare("SELECT name, icon FROM skills WHERE id = ?").get(record.skill_id);
    return {
      execution: {
        ...record,
        skill_name: (skill as { name?: string } | undefined)?.name ?? null,
        skill_icon: (skill as { icon?: string } | undefined)?.icon ?? null,
      },
    };
  });
}
