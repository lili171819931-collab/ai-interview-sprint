import { NextResponse } from "next/server";
import { repoTree } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  try {
    const data = await repoTree(`${owner}/${repo}`);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: (e as any).status ?? 500 });
  }
}
