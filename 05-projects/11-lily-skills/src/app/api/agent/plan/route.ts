import { json, handle, readBody, ctx } from "../../helpers";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const { agent } = ctx();
    const task = String(body.message ?? body.task ?? "");
    if (!task) throw new Error("message is required");
    const sessions = agent.listSessions();
    const sessionId = body.sessionId ? String(body.sessionId) : sessions[0]?.id;
    const plan = await agent.plan(sessionId ?? (() => { const c = agent.chat; return ""; })(), task);
    return { plan, ok: true };
  });
}
