import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lily-Skills · Personal AI Skill OS",
  description: "Lily 的个人 AI 能力操作系统 —— 让 AI Agent 自动找到、组合并执行你的 Skills",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
