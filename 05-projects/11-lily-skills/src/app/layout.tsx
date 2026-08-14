import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Lily-Skills · Personal AI Skill OS",
  description: "Lily 的个人 AI 能力操作系统 —— 让 AI Agent 自动找到、组合并执行你的 Skills",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-bg text-fg antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
