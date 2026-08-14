"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Bot, Puzzle, Workflow, Activity, BarChart3, Code2, Search, Settings,
} from "lucide-react";
import { api } from "@/lib/client";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent", label: "AI Agent", icon: Bot },
  { href: "/skills", label: "Skills", icon: Puzzle },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/executions", label: "Execution Center", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/developer", label: "Developer Center", icon: Code2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api<{ status: string; counts: { skills: number } }>("/api/status").then((d) => setStatus(d.status)).catch(() => setStatus("offline"));
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/skills?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-[#0c0c0f]">
        <Link href="/" className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent glow">
            <span className="text-sm font-bold">L</span>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Lily-Skills</div>
            <div className="text-[10px] text-subtle">Personal AI Skill OS</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active ? "bg-surface2 text-fg" : "text-muted hover:bg-surface hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-subtle">
            <span className={`h-1.5 w-1.5 rounded-full ${status === "running" ? "bg-accent2" : "bg-danger"}`} />
            {status === "running" ? "平台运行中" : status ?? "连接中…"}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-bg/80 px-5 backdrop-blur">
          <form onSubmit={submitSearch} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search skills, workflows, capabilities…"
              className="h-9 w-full rounded-lg border border-border2 bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-subtle focus:border-accent/60"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/agent" className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-[#b3a6ff] hover:bg-accent/20">
              🤖 Ask AI Agent
            </Link>
            <Link href="/skills" className="rounded-lg bg-surface2 p-2 text-muted hover:text-fg">
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
