"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("lili@demo.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "登录失败");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-8 shadow-[0_20px_60px_rgba(28,36,32,0.08)]">
        <p className="text-sm tracking-[0.18em] text-[var(--brand)] font-semibold">REIMBURSE LAB</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">票易报</h1>
        <p className="mt-2 text-[var(--muted)] text-sm leading-relaxed">
          把散落的发票变成一张财务愿意批的报销单。
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="text-[var(--muted)]">邮箱</span>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--muted)]">密码</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--brand)] text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "登录中…" : "进入工作台"}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--ink)]">
          <p className="font-medium">演示账号</p>
          <p className="mt-1 text-[var(--muted)]">报销人 lili@demo.com / demo123</p>
          <p className="text-[var(--muted)]">审批人 manager@demo.com / demo123</p>
        </div>
      </div>
    </main>
  );
}
