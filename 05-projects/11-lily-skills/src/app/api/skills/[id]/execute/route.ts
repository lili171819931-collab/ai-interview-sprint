import { json, handle, readBody, ctx } from "../../../helpers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await readBody(req);
    const { engine } = ctx();
    const record = await engine.execute({
      skillId: id,
      input: (body.input ?? {}) as Record<string, unknown>,
      trigger: "manual",
      skipApproval: body.skipApproval === true,
    });
    return {
      execution: record,
      requiresApproval: record.status === "awaiting_approval",
      ok: true,
    };
  });
}
