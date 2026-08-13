import { spawn } from "child_process";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Mode = "full" | "quick" | "hot" | "hourly";

function allowed(): boolean {
  if (process.env.ALLOW_LIVE_REFRESH === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/**
 * POST /api/refresh
 * body/query: { mode?: "full" | "quick" | "hot" }
 *
 * - full: 归档 + 全量日更（较慢）
 * - quick: 归档 + 雷达日报 + 热点
 * - hot: 归档 + 仅热点
 */
export async function POST(req: Request) {
  if (!allowed()) {
    return NextResponse.json(
      { ok: false, error: "Live refresh disabled in production. Set ALLOW_LIVE_REFRESH=1." },
      { status: 403 },
    );
  }

  let mode: Mode = "quick";
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("mode");
    if (q === "full" || q === "quick" || q === "hot" || q === "hourly") mode = q;
    else {
      const body = (await req.json().catch(() => ({}))) as { mode?: string };
      if (body.mode === "full" || body.mode === "quick" || body.mode === "hot" || body.mode === "hourly") {
        mode = body.mode;
      }
    }
  } catch {
    // default quick
  }

  const root = process.cwd();
  const env = {
    ...process.env,
    DAILY_MODE: mode,
    PATH: [
      path.join(process.env.HOME || "", ".agent-reach-venv/bin"),
      path.join(process.env.HOME || "", ".local/bin"),
      process.env.PATH || "",
    ].join(":"),
  };

  const startedAt = new Date().toISOString();

  const result = await new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>((resolve) => {
    const child = spawn("npx", ["tsx", "scripts/daily-refresh.ts"], {
      cwd: root,
      env,
      shell: process.platform === "win32",
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.on("error", (err) =>
      resolve({ code: 1, stdout, stderr: `${stderr}\n${err.message}` }),
    );
  });

  const ok = result.code === 0;
  return NextResponse.json(
    {
      ok,
      mode,
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: result.code,
      logTail: (result.stdout + "\n" + result.stderr).split("\n").slice(-40).join("\n"),
    },
    { status: ok ? 200 : 500 },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoints: "POST /api/refresh?mode=hourly|quick|hot|full",
    allowed: allowed(),
  });
}
