import { json, handle, readBody, ctx } from "../../helpers";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const { agent } = ctx();
    const result = await agent.chat({
      sessionId: body.sessionId ? String(body.sessionId) : null,
      message: String(body.message ?? ""),
      autoExecute: body.autoExecute === true,
    });
    return { ...result, ok: true };
  });
}
