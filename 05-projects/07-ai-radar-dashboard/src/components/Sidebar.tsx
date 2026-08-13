"use client";

import { AutoRefresh } from "@/components/AutoRefresh";
import { BrandMark } from "@/components/BrandMark";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Flame,
  Globe2,
  LayoutList,
  Lightbulb,
  Menu,
  MessageSquareText,
  Newspaper,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

const groups = [
  {
    label: "内容",
    items: [
      { href: "/", label: "精选", icon: Sparkles },
      { href: "/all", label: "全部动态", icon: LayoutList },
      { href: "/ranking", label: "AI热点榜", icon: Flame },
      { href: "/hot", label: "热点分析", icon: Globe2 },
      { href: "/briefs", label: "AI 日报", icon: Newspaper },
    ],
  },
  {
    label: "洞察",
    items: [{ href: "/opportunities", label: "AI机会报告", icon: Lightbulb }],
  },
  {
    label: "模型",
    items: [{ href: "/leaderboard", label: "模型榜", icon: Trophy }],
  },
  {
    label: "更多",
    items: [{ href: "/ask", label: "Agent 接入", icon: MessageSquareText }],
  },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ fetchedAt }: { fetchedAt: string | null }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-6 text-sm">
      {groups.map((g) => (
        <div key={g.label} className="space-y-1">
          <p className="px-3 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{g.label}</p>
          {g.items.map((it) => {
            const Icon = it.icon;
            const on = active(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                  on ? "bg-[var(--signal-dim)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                <Icon size={16} aria-hidden />
                {it.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[var(--line)] bg-[var(--ink)] px-4 py-3">
        <BrandMark size={28} />
        <button type="button" className="p-1 text-[var(--muted)]" onClick={() => setOpen((v) => !v)} aria-label="菜单">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {open ? <div className="lg:hidden border-b border-[var(--line)] bg-[var(--ink)] px-3 py-4">{nav}</div> : null}
      <aside className="sidebar">
        <div className="px-3">
          <BrandMark size={30} />
        </div>
        {nav}
        <div className="mt-auto px-3">
          <AutoRefresh fetchedAt={fetchedAt} />
        </div>
      </aside>
    </>
  );
}
