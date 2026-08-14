import { json, handle, readBody, ctx } from "../../helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const wf = ctx().workflows.getWorkflow(id);
    if (!wf) throw new Error(`Workflow ${id} not found`);
    return { workflow: wf };
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await readBody(req);
    const wf = ctx().workflows.updateWorkflow(id, {
      name: body.name ? String(body.name) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      icon: body.icon != null ? String(body.icon) : undefined,
      status: body.status ? String(body.status) : undefined,
      triggerType: body.triggerType ? String(body.triggerType) : undefined,
      schedule: body.schedule != null ? String(body.schedule) : undefined,
      nodes: body.nodes as never,
    });
    return { workflow: wf, ok: true };
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    ctx().workflows.deleteWorkflow(id);
    return { ok: true };
  });
}
