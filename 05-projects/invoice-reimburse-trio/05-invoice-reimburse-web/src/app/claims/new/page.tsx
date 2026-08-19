"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SCENARIO_MODES } from "@/lib/scenarios";

export default function NewClaimPage() {
  const router = useRouter();
  const [title, setTitle] = useState("本月费用报销");
  const [periodStart, setPeriodStart] = useState("2026-08-01");
  const [periodEnd, setPeriodEnd] = useState("2026-08-31");
  const [purpose, setPurpose] = useState("");
  const [cityTier, setCityTier] = useState("上海");
  const [entertainGuests, setEntertainGuests] = useState("3");
  const [modes, setModes] = useState<string[]>(["B"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleMode(code: string) {
    setModes((prev) =>
      prev.includes(code) ? prev.filter((m) => m !== code) : [...prev, code],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        periodStart,
        periodEnd,
        purpose,
        modes: modes.length ? modes : ["B"],
        cityTier,
        entertainGuests: entertainGuests ? Number(entertainGuests) : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "创建失败");
      return;
    }
    const claim = await res.json();
    router.push(`/claims/${claim.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <a href="/" className="text-sm text-[var(--brand)]">
        ← 返回工作台
      </a>
      <h1 className="mt-3 text-3xl font-semibold">新建报销单</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">选择情景模式后进入上传与合规主战场</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
        <label className="block text-sm">
          <span>标题</span>
          <input className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span>开始日期</span>
            <input type="date" className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span>结束日期</span>
            <input type="date" className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
          </label>
        </div>
        <label className="block text-sm">
          <span>事由</span>
          <textarea className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2" rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="例如：上海客户拜访，含差旅与宴请" required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span>城市档（差旅）</span>
            <input className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2" value={cityTier} onChange={(e) => setCityTier(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span>招待人数</span>
            <input className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2" value={entertainGuests} onChange={(e) => setEntertainGuests(e.target.value)} />
          </label>
        </div>

        <div>
          <p className="text-sm mb-2">情景模式</p>
          <div className="flex flex-wrap gap-2">
            {SCENARIO_MODES.filter((m) => m.must || m.code === "E" || m.code === "G").map((m) => (
              <button
                type="button"
                key={m.code}
                onClick={() => toggleMode(m.code)}
                className="rounded-full px-3 py-1 text-sm border"
                style={{
                  borderColor: modes.includes(m.code) ? "var(--brand)" : "var(--line)",
                  background: modes.includes(m.code) ? "var(--brand-soft)" : "white",
                }}
              >
                {m.code} · {m.name}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button disabled={loading} className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-white text-sm font-medium disabled:opacity-60">
          {loading ? "创建中…" : "创建并进入详情"}
        </button>
      </form>
    </main>
  );
}
