import { json, ctx } from "../helpers";
import { listTags } from "@/lib/core/skill-registry";

export async function GET() {
  return json({ tags: listTags(ctx().db, 200) });
}
