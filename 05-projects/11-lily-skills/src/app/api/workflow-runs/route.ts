import { json, ctx } from "../helpers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const workflowId = url.searchParams.get("workflowId") ?? undefined;
  return json({ runs: ctx().workflows.listRuns(workflowId) });
}
