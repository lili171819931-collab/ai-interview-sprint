import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { Nav } from "@/components/Nav";
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
  title: "智衡 AI Radar · AI 平台与工具看板",
  description: "日更数据、功能介绍与可追溯优劣势对比的 AI 工具雷达看板",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${plex.variable} ${space.variable}`}>
        <Nav />
        <main>{children}</main>
        <footer className="border-t border-[var(--line)] mt-16">
          <div className="container py-8 text-sm text-[var(--muted)] flex flex-wrap gap-3 justify-between">
            <span>智衡 AI Radar · 对比结论可追溯到字段与来源</span>
            <span>运行 `npm run data:refresh` 完成日更</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
