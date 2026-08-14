import { json, ctx } from "../helpers";
import { searchSkills } from "@/lib/core/search";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 10);
  const results = searchSkills(ctx().db, q, {
    limit,
    categoryId: url.searchParams.get("categoryId"),
    tag: url.searchParams.get("tag"),
    executionType: url.searchParams.get("executionType"),
  });
  return json({
    query: q,
    results: results.map((r) => ({ skill: r.skill, score: Math.round(r.score * 1000) / 1000, matchedTerms: r.matchedTerms })),
  });
}
