import { NextResponse } from "next/server";
import { getRate, rateLevel, isTokenConfigured } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ authenticated: isTokenConfigured(), rateLimit: getRate(), level: rateLevel(getRate().remaining) });
}
