import { json, handle, ctx } from "../../../helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const record = ctx().engine.cancel(id);
    return { execution: record, ok: true };
  });
}
