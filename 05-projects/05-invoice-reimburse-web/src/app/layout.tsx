import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "票易报 · 发票报销平台",
  description: "自动识别、自动归类、自动找风险的发票报销 Web MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={plex.variable} style={{ fontFamily: "var(--font-plex), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
