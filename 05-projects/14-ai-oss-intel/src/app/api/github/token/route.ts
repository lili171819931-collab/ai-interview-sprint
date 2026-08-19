import { NextResponse } from "next/server";
import { setToken, clearToken, getToken, repoDetail } from "@/lib/server/githubClient";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action ?? "set";
  if (action === "test") {
    const token = getToken();
    if (!token) return NextResponse.json({ ok: false, error: "GitHub API 当前处于未认证模式。请配置 Token。" }, { status: 400 });
    try {
      const user = await repoDetail("octocat/Hello-World");
      const login = user.owner?.login ?? null;
      return NextResponse.json({ ok: true, authenticated: true, username: login });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 401 });
    }
  }
  const token = String(body.token ?? "").trim();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  setToken(token);
  return NextResponse.json({ ok: true, message: "Token 已安全保存（仅服务器本地 data/github-token）" });
}
export async function DELETE() {
  clearToken();
  return NextResponse.json({ ok: true, message: "已断开 GitHub 集成" });
}
