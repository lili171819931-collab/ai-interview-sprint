import { NextResponse } from "next/server";
import { getRadarStatus } from "@/lib/intel/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ schemaVersion: 1, ...getRadarStatus() });
}
