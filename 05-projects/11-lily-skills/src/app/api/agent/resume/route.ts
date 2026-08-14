import { json, handle, readBody, ctx } from "../../helpers";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const { agent } = ctx();
    const planId = String(body.planId ?? "");
    if (!planId) throw new Error("planId is required");
    const plan = await agent.resumePlan(planId);
    return { plan, ok: true };
  });
}
