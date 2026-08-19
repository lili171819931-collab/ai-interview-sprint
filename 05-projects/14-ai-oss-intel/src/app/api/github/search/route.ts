import { NextResponse } from "next/server";
import { searchRepos } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "stars";
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });
  try {
    const data = await searchRepos(q, sort);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
