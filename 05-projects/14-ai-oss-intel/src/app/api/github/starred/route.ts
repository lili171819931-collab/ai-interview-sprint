import { NextResponse } from "next/server";
import { starredRepos } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user") ?? "";
  if (!user) return NextResponse.json({ error: "missing user" }, { status: 400 });
  try {
    const data = await starredRepos(user, 1);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
