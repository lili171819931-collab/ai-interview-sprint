import Link from "next/link";

const links = [
  { href: "/", label: "今日热点" },
  { href: "/trends", label: "趋势雷达" },
  { href: "/briefs", label: "每日简报" },
  { href: "/ask", label: "问问 Agent" },
  { href: "/radar", label: "动态雷达" },
  { href: "/hot", label: "平台榜" },
  { href: "/history", label: "历史" },
  { href: "/pulse", label: "机会简报" },
  { href: "/tools", label: "工具目录" },
  { href: "/compare", label: "对比" },
  { href: "/sources", label: "来源" },
  { href: "/methodology", label: "口径" },
];

export function Nav() {
  return (
    <header className="border-b border-[var(--line)] sticky top-0 z-40 bg-[color-mix(in_srgb,var(--ink)_88%,transparent)] backdrop-blur-md">
      <div className="container flex items-center justify-between gap-4 py-3">
        <Link href="/" className="display text-lg font-semibold tracking-tight">
          智衡 <span className="text-[var(--signal)]">AI Radar</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm text-[var(--muted)]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-2.5 py-1.5 hover:text-[var(--text)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
