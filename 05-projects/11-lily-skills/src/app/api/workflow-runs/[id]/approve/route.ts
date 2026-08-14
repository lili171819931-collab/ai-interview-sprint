import { json, handle, ctx } from "../../../helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const run = await ctx().workflows.resume(id);
    return { run, ok: true };
  });
}
