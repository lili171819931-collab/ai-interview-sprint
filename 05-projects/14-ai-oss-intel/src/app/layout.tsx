import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "AI OSS Intel · GitHub AI 开源情报平台",
  description: "AI Open Source Intelligence Platform — Discover. Analyze. Build. Monetize.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 px-4 md:px-8 py-6 max-w-[1440px] w-full mx-auto">{children}</main>
            <footer className="px-4 md:px-8 py-6 text-xs text-[#5b6885] border-t border-[#141e33]">
              AI Open Source Intelligence Platform · Discover. Analyze. Build. Monetize. · 数据为演示快照，可运行 <code className="text-[#8fa6cf]">npm run github:sync</code> 拉取 GitHub 实时数据
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
