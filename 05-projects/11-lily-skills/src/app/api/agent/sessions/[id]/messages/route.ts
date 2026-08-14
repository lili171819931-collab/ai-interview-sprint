import { json, handle, ctx } from "../../../../helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const { agent } = ctx();
    return { messages: agent.messages(id) };
  });
}
