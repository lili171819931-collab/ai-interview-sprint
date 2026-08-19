import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { Sidebar } from "@/components/Sidebar";
import { SiteFooter } from "@/components/SiteFooter";
import { getRadarStatus } from "@/lib/intel/status";
import { LOCALE_KEY } from "@/lib/i18n/messages";
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
  title: {
    default: "智衡 · AI动态",
    template: "%s · 智衡",
  },
  description: "AI动态、国内外全域热点、GitHub- Lily、GitHub热点、日报、模型共识榜与机会点报告",
  icons: {
    icon: [{ url: "/zhiheng-mark.svg", type: "image/svg+xml" }, { url: "/zhiheng-mark.png" }],
    apple: "/zhiheng-mark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const status = getRadarStatus();
  return (
    <html lang="zh-CN" data-locale="zh" suppressHydrationWarning>
      <body className={`${plex.variable} ${space.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem("${LOCALE_KEY}");var en=l==="en";document.documentElement.lang=en?"en":"zh-CN";document.documentElement.setAttribute("data-locale",en?"en":"zh")}catch(e){}`,
          }}
        />
        <LocaleProvider>
          <div className="app-shell">
            <Sidebar fetchedAt={status.fetchedAt} />
            <div className="app-content">
              <main>{children}</main>
              <SiteFooter />
            </div>
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
