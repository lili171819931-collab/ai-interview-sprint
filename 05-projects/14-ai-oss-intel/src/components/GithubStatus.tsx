"use client";
import { useEffect, useState } from "react";
import { GithubIcon } from "@/components/icons";

interface Health {
  authenticated: boolean;
  rateLimit: { limit: number; remaining: number; used: number; reset: number };
  level: string;
  cache?: { enabled: boolean; entries: number };
  queue?: { tasks: number; running: number; done: number; error: number; remaining: number };
}

function useHealth(interval = 30000) {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/github/health");
        if (res.ok) { const h = await res.json(); if (alive) setHealth(h); }
      } catch {} finally { if (alive) setLoading(false); }
    };
    load();
    const t = setInterval(load, interval);
    return () => { alive = false; clearInterval(t); };
  }, [interval]);
  return { health, loading };
}

const LEVEL_META: Record<string, { label: string; color: string }> = {
  healthy: { label: "🟢 Healthy", color: "#34d399" },
  warning: { label: "🟡 Warning", color: "#fbbf24" },
  critical: { label: "🔴 Critical", color: "#f87171" },
  out: { label: "🔴 Rate Limit Exhausted", color: "#f87171" },
};

export function GithubStatusDot() {
  const { health, loading } = useHealth();
  if (loading && !health) return <span className="chip !text-[10px] !py-1">GitHub API …</span>;
  const level = LEVEL_META[health?.level ?? "warning"] ?? LEVEL_META.warning;
  const rem = health?.rateLimit?.remaining;
  const authed = health?.authenticated;
  const reset = health?.rateLimit?.reset ? new Date(health.rateLimit.reset * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : null;
  const low = !authed && (health?.level === "critical" || health?.level === "out");
  const tip = authed
    ? `GitHub API 已认证（5000 次/小时）· 剩余 ${rem ?? "—"}${reset ? ` · 重置 ${reset}` : ""}`
    : `GitHub API 未认证（60 次/小时，搜索 10 次/分钟）· 剩余 ${rem ?? "—"}${reset ? ` · 重置 ${reset}` : ""} · 建议在 My GitHub 页配置 GITHUB_TOKEN 自动提速`;
  return (
    <span className="chip !text-[10px] !py-1 hidden md:inline-flex" style={{ color: low ? "#f87171" : level.color, borderColor: (low ? "#f87171" : level.color) + "55", background: (low ? "#f87171" : level.color) + "10" }} title={tip}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" /> API {rem ?? "—"} · {authed ? "已认证" : low ? "未认证·限流" : "未认证"}
    </span>
  );
}

export function GithubIntegrationPanel() {
  const { health, loading } = useHealth(15000);
  const [tokenInput, setTokenInput] = useState("");
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const testConnection = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/github/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test" }) });
      const data = await res.json();
      if (data.ok) { setUsername(data.username ?? "connected"); setMsg("✓ GitHub API Connected"); }
      else setMsg(`✗ ${data.error ?? "连接失败"}`);
    } catch { setMsg("✗ 连接失败"); } finally { setBusy(false); }
  };
  const saveToken = async () => {
    if (!tokenInput.trim()) return;
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/github/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: tokenInput.trim() }) });
      const data = await res.json();
      setMsg(data.ok ? `✓ ${data.message}` : `✗ ${data.error ?? "保存失败"}`);
      if (data.ok) setTokenInput("");
    } catch { setMsg("✗ 保存失败"); } finally { setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true); setMsg("");
    try {
      await fetch("/api/github/token", { method: "DELETE" });
      setUsername(null); setMsg("✓ 已断开 GitHub 集成");
    } catch { setMsg("✗ 断开失败"); } finally { setBusy(false); }
  };

  const level = LEVEL_META[health?.level ?? "warning"] ?? LEVEL_META.warning;
  const r = health?.rateLimit;
  const resetIn = r?.reset ? Math.max(0, Math.round((r.reset * 1000 - Date.now()) / 1000)) : 0;

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <GithubIcon size={18} className="text-[#7dd3fc]" />
        <span className="text-[15px] font-bold text-white">GitHub Integration · API Status</span>
        <span className="chip ml-auto !text-[11px]" style={{ color: level.color, borderColor: level.color + "55", background: level.color + "12" }}>{level.label}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        <Stat label="API Status" value={health?.authenticated ? "● Connected" : "○ Not Authenticated"} color={health?.authenticated ? "#34d399" : "#fbbf24"} />
        <Stat label="Rate Limit" value={r ? `${r.limit ?? "—"} / ${r.remaining ?? "—"}` : "—"} color="#7dd3fc" />
        <Stat label="Used" value={r ? `${r.used ?? "—"}` : "—"} color="#f472b6" />
        <Stat label="Reset" value={resetIn > 0 ? `${Math.floor(resetIn / 60)}m ${resetIn % 60}s` : "—"} color="#fbbf24" />
      </div>

      <div className="flex flex-wrap gap-2 text-[11.5px] text-[#8b98b3]">
        <span className="chip">Cache {health?.cache?.enabled ? "✅ 已启用" : "—"}</span>
        <span className="chip">队列 {health?.queue?.remaining ?? 0} 个任务（running {health?.queue?.running ?? 0} / done {health?.queue?.done ?? 0}）</span>
        {health?.authenticated && username !== null && <span className="chip chip-accent">Authenticated User：{username}</span>}
      </div>

      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 space-y-2">
        <div className="text-[12px] font-bold text-[#7dd3fc]">Token 管理（仅保存在服务器本地，绝不出现在前端/仓库）</div>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder={health?.authenticated ? "已配置 Token（••••••••）· 输入新 Token 可更新" : "粘贴 GitHub Personal Access Token"}
          className="w-full h-9 px-3 rounded-lg bg-[#101a2e] border border-[#1c2942] text-[12.5px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={saveToken} disabled={busy || !tokenInput.trim()} className="chip chip-accent">Update Token</button>
          <button onClick={testConnection} disabled={busy} className="chip hover:!text-[#7dd3fc]">Test Connection</button>
          <button onClick={disconnect} disabled={busy} className="chip hover:!text-rose-400">Disconnect</button>
          {msg && <span className="text-[12px] text-[#aab6cd] self-center">{msg}</span>}
        </div>
        <div className="text-[11px] text-[#5b6885]">配置方式：① 在服务器设置环境变量 GITHUB_TOKEN；② 或在此保存到 data/github-token（已 gitignore）。未认证时自动降级直连（限流 10/分钟）。</div>
      </div>

      <div className="text-[11px] text-[#5b6885]">生产级客户端已启用：Token 认证 · Rate Limit 管理 · 403/429 自动等待 + 指数退避重试 · 文件+内存缓存（按端点 TTL）· 请求去重 · 批量队列 · 日志（不含 Token）。</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
      <div className="text-[10.5px] text-[#5b6885]">{label}</div>
      <div className="text-[13.5px] font-bold num mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}
