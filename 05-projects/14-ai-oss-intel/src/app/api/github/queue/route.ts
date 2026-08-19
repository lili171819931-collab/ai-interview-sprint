import { NextResponse } from "next/server";
import { queueStats, getLogs } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ queue: queueStats(), logs: getLogs(20) });
}
