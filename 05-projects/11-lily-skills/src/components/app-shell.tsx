"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Bot, Puzzle, Workflow, Activity, BarChart3, Code2, Search, Languages, Settings,
} from "lucide-react";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api<{ status: string; counts: { skills: number } }>("/api/status").then((d) => setStatus(d.status)).catch(() => setStatus("offline"));
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/skills?q=${encodeURIComponent(q)}`);
  };

  const NAV = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/agent", label: t("nav.agent"), icon: Bot },
    { href: "/skills", label: t("nav.skills"), icon: Puzzle },
    { href: "/workflows", label: t("nav.workflows"), icon: Workflow },
    { href: "/executions", label: t("nav.executions"), icon: Activity },
    { href: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
    { href: "/developer", label: t("nav.developer"), icon: Code2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-[#0c0c0f]">
        <Link href="/" className="flex items-center gap-2.5 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lily-skills-mark.svg" alt="Lily-Skills" className="h-9 w-9" />
          <div>
            <div className="text-sm font-semibold tracking-tight">{t("app.name")}</div>
            <div className="text-[10px] text-subtle">{t("app.tagline")}</div>
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
            {status === "running" ? t("app.status_running") : status === "offline" ? t("app.status_offline") : t("app.status_connecting")}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-bg/80 px-5 backdrop-blur">
          <form onSubmit={submitSearch} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("topbar.search")}
              className="h-9 w-full rounded-lg border border-border2 bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-subtle focus:border-accent/60"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex overflow-hidden rounded-lg border border-border2 bg-surface">
              {(["zh", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  title={l === "zh" ? "中文" : "English"}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    lang === l ? "bg-accent text-white" : "text-muted hover:text-fg"
                  }`}
                >
                  <Languages className="h-3 w-3" />
                  {l === "zh" ? "中" : "EN"}
                </button>
              ))}
            </div>
            <Link href="/agent" className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-[#b3a6ff] hover:bg-accent/20">
              🤖 {t("topbar.ask")}
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
