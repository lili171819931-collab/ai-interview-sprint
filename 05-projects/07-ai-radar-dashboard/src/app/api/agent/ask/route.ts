import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/intel/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/agent/ask
 * body: { question: string }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { question?: string };
    const question = (body.question || "").trim();
    if (!question) {
      return NextResponse.json({ ok: false, error: "question required" }, { status: 400 });
    }
    const result = await answerQuestion(question);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
