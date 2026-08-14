import { json, ctx } from "../helpers";
import { getAnalytics } from "@/lib/core/analytics";

export async function GET() {
  return json({ analytics: getAnalytics(ctx().db) });
}
