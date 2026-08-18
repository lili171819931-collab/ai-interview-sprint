"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Compass, Sparkles, Scale, Radar, Menu, X, FolderKanban,
  GraduationCap, UserRound, MessagesSquare, GitFork,
} from "lucide-react";
import { GithubIcon } from "@/components/icons";

const NAV = [
  { section: "总览", items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Discover",
    items: [
      { href: "/discover", label: "Explore 全部项目", icon: Compass },
      { href: "/insights", label: "AI Insights 智能洞察", icon: Sparkles },
    ],
  },
  {
    section: "Rankings",
    items: [
      { href: "/rankings/categories", label: "分类 TOP 榜", icon: FolderKanban },
    ],
  },
  {
    section: "Analysis",
    items: [
      { href: "/compare", label: "Compare 对比", icon: Scale },
      { href: "/watchlist", label: "My AI Radar", icon: Radar },
    ],
  },
  {
    section: "My GitHub",
    items: [{ href: "/my-github", label: "My GitHub 收藏雷达", icon: GitFork }],
  },
  {
    section: "AI PM Learning OS",
    items: [
      { href: "/learn", label: "AI PM 学习中心", icon: GraduationCap },
      { href: "/interview", label: "Interview 面试模式", icon: MessagesSquare },
      { href: "/portfolio", label: "My AI PM Portfolio", icon: UserRound },
    ],
  },
  {
    section: "AI Analyst",
    items: [{ href: "/ask", label: "Ask AI 智能分析师", icon: Sparkles }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const body = (
    <div className="flex flex-col h-full">
      <Link href="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-[#141e33] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f8cff] to-[#7c5cff] flex items-center justify-center shadow-[0_0_18px_rgba(79,140,255,0.45)]">
          <GithubIcon size={17} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-[15px] leading-tight">AI OSS Intel</div>
          <div className="text-[10px] text-[#5b6885] tracking-wide">OPEN SOURCE INTELLIGENCE</div>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#4d5a75]">{group.section}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                      active
                        ? "bg-[#16233d] text-[#cfe0ff] border border-[#26395e]"
                        : "text-[#8b98b3] hover:bg-[#101a2e] hover:text-[#dbe6ff] border border-transparent"
                    }`}
                  >
                    <Icon size={15} className={active ? "text-[#4f8cff]" : "text-[#5b6885]"} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-[#141e33] text-[11px] text-[#5b6885]">
        <div className="flex items-center gap-1.5"><FolderKanban size={13} /> 160 个项目 · 30 类 · 实时雷达</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-[248px] shrink-0 h-screen sticky top-0 border-r border-[#141e33] bg-[#080d18]">
        {body}
      </aside>
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[270px] bg-[#080d18] border-r border-[#141e33]">{body}</aside>
        </div>
      )}
      <button
        className="fixed bottom-5 right-5 z-40 lg:hidden w-12 h-12 rounded-full bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center shadow-xl"
        onClick={() => setOpen((v) => !v)}
        aria-label="菜单"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </>
  );
}
