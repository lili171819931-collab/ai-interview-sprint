import { json, ctx } from "../../helpers";

export async function GET() {
  const { agent } = ctx();
  return json({ sessions: agent.listSessions() });
}
