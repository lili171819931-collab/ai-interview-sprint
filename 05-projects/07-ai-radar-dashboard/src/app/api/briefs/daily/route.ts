import { NextResponse } from "next/server";
import { getBriefByDate, getLatestBrief } from "@/lib/intel/briefs-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const brief = date ? getBriefByDate(date) : getLatestBrief();
  if (!brief) {
    return NextResponse.json(
      { ok: false, error: "no_brief", hint: "npm run intel:briefs" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, brief });
}
