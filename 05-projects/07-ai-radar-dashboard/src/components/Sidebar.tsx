"use client";

import { AutoRefresh } from "@/components/AutoRefresh";
import { BrandMark } from "@/components/BrandMark";
import { LangToggle } from "@/components/i18n/LangToggle";
import { useLocale } from "@/components/i18n/LocaleProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Flame,
  FolderGit2,
  Globe2,
  LayoutList,
  Lightbulb,
  Menu,
  MessageSquareText,
  Newspaper,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages";

const groups: { labelKey: MessageKey; items: { href: string; labelKey: MessageKey; icon: typeof Sparkles }[] }[] = [
  {
    labelKey: "nav.content",
    items: [
      { href: "/", labelKey: "nav.featured", icon: Sparkles },
      { href: "/all", labelKey: "nav.feed", icon: LayoutList },
      { href: "/ranking", labelKey: "nav.ranking", icon: Flame },
      { href: "/hot", labelKey: "nav.hot", icon: Globe2 },
      { href: "/github", labelKey: "nav.github", icon: FolderGit2 },
      { href: "/github-hot", labelKey: "nav.githubHot", icon: TrendingUp },
      { href: "/briefs", labelKey: "nav.briefs", icon: Newspaper },
    ],
  },
  {
    labelKey: "nav.insight",
    items: [{ href: "/opportunities", labelKey: "nav.opportunities", icon: Lightbulb }],
  },
  {
    labelKey: "nav.models",
    items: [{ href: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy }],
  },
  {
    labelKey: "nav.more",
    items: [{ href: "/ask", labelKey: "nav.ask", icon: MessageSquareText }],
  },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ fetchedAt }: { fetchedAt: string | null }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const nav = (
    <nav className="flex flex-col gap-6 text-sm">
      {groups.map((g) => (
        <div key={g.labelKey} className="space-y-1">
          <p className="px-3 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{t(g.labelKey)}</p>
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
                {t(it.labelKey)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[var(--line)] bg-[var(--ink)] px-4 py-3 gap-3">
        <BrandMark size={28} />
        <div className="flex items-center gap-2">
          <LangToggle compact />
          <button type="button" className="p-1 text-[var(--muted)]" onClick={() => setOpen((v) => !v)} aria-label="菜单">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {open ? <div className="lg:hidden border-b border-[var(--line)] bg-[var(--ink)] px-3 py-4">{nav}</div> : null}
      <aside className="sidebar">
        <div className="px-3">
          <BrandMark size={30} />
        </div>
        {nav}
        <div className="mt-auto px-3 space-y-3">
          <LangToggle />
          <AutoRefresh fetchedAt={fetchedAt} />
        </div>
      </aside>
    </>
  );
}
