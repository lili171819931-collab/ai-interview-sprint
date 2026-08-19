import { NextResponse } from "next/server";
import { health } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(health());
}
