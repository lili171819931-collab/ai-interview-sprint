import { json, handle, readBody, ctx } from "../helpers";

export async function GET() {
  return json({ workflows: ctx().workflows.listWorkflows() });
}

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    const wf = ctx().workflows.createWorkflow({
      name: String(body.name ?? "未命名工作流"),
      description: body.description ? String(body.description) : undefined,
      icon: body.icon ? String(body.icon) : undefined,
      triggerType: body.triggerType ? String(body.triggerType) : undefined,
      schedule: body.schedule ? String(body.schedule) : undefined,
    });
    return { workflow: wf, ok: true };
  });
}
