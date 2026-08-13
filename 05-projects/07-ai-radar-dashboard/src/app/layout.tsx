import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { getRadarStatus } from "@/lib/intel/status";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "智衡 AI Radar",
  description: "精选、热点分析、日报、模型共识榜与机会点报告",
  icons: {
    icon: [{ url: "/zhiheng-mark.svg", type: "image/svg+xml" }, { url: "/zhiheng-mark.png" }],
    apple: "/zhiheng-mark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const status = getRadarStatus();
  return (
    <html lang="zh-CN">
      <body className={`${plex.variable} ${space.variable}`}>
        <div className="app-shell">
          <Sidebar fetchedAt={status.fetchedAt} />
          <div className="app-content">
            <main>{children}</main>
            <footer className="page-main pt-12 pb-8 text-xs text-[var(--muted)]">
              智衡 AI Radar · 每小时自动更新 ·{" "}
              <a href="https://aihot.virxact.com/terms" className="hover:text-[var(--text)]">
                数据使用规则
              </a>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
