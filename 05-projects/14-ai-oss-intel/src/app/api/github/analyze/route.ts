import { NextResponse } from "next/server";
import { enqueueBatch } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const fullNames = Array.isArray(body.repos) ? body.repos.map(String).filter(Boolean).slice(0, 100) : [];
  if (fullNames.length === 0) return NextResponse.json({ error: "missing repos[]" }, { status: 400 });
  const tasks = enqueueBatch(fullNames);
  return NextResponse.json({ ok: true, queued: tasks.length });
}
