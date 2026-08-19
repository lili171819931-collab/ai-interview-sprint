import { NextResponse } from "next/server";
import { needsTranslation } from "@/lib/i18n/script";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { texts?: unknown; target?: unknown };

function parseGtx(raw: unknown): string {
  if (!Array.isArray(raw) || !Array.isArray(raw[0])) return "";
  return (raw[0] as unknown[])
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .trim();
}

async function translateOne(text: string, target: "zh" | "en"): Promise<string> {
  const tl = target === "zh" ? "zh-CN" : "en";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text.slice(0, 400))}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ai-radar-dashboard/0.1" },
  });
  if (!res.ok) return text;
  const json = (await res.json()) as unknown;
  return parseGtx(json) || text;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const target = body.target === "en" ? "en" : "zh";
  const texts = Array.isArray(body.texts)
    ? body.texts.filter((x): x is string => typeof x === "string").slice(0, 40)
    : [];
  if (!texts.length) return NextResponse.json({ ok: true, items: [] });

  const items: { src: string; dst: string }[] = [];
  for (const src of texts) {
    const trimmed = src.trim();
    if (!trimmed || !needsTranslation(trimmed, target)) {
      items.push({ src, dst: src });
      continue;
    }
    try {
      const dst = await translateOne(trimmed, target);
      items.push({ src, dst });
    } catch {
      items.push({ src, dst: src });
    }
  }
  return NextResponse.json({ ok: true, target, items });
}
