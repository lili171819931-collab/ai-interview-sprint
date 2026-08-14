import { NextResponse } from "next/server";
import { getContext } from "@/lib/bootstrap";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function handle(fn: () => unknown | Promise<unknown>): Promise<NextResponse> {
  return Promise.resolve()
    .then(fn)
    .then((data) => json(data))
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      const status = /not found|不存在|already exists|已存在/.test(message) ? 404 : 400;
      return json({ error: message, ok: false }, status);
    });
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return (body ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function ctx() {
  return getContext();
}
