import { json, handle, readBody, ctx } from "../../../helpers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await readBody(req);
    const run = await ctx().workflows.run(id, (body.input ?? {}) as Record<string, unknown>);
    return { run, ok: true };
  });
}
