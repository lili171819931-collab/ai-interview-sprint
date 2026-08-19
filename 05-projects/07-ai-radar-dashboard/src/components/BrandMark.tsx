"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** 智衡 AI 品牌标记：聚焦雷达 + 锁定点 */
export function BrandMark({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  const { t } = useLocale();
  return (
    <Link href="/" className="brand-mark inline-flex items-center gap-2.5 min-w-0" aria-label={t("brand.home")}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brand-mark-icon shrink-0"
        aria-hidden
      >
        <rect width="64" height="64" rx="14" fill="#0b0f14" />
        <rect x="1" y="1" width="62" height="62" rx="13" stroke="rgba(232,238,245,0.12)" strokeWidth="1" />
        <circle cx="32" cy="32" r="22" stroke="rgba(46,201,179,0.18)" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="15" stroke="rgba(46,201,179,0.32)" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="8" stroke="rgba(46,201,179,0.55)" strokeWidth="1.5" />
        <path d="M32 10 A22 22 0 0 1 50.5 41" stroke="#2ec9b3" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M32 18 V22 M32 42 V46 M18 32 H22 M42 32 H46"
          stroke="#2ec9b3"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle cx="32" cy="32" r="3.2" fill="#2ec9b3" />
        <circle cx="32" cy="32" r="1.2" fill="#0b0f14" />
      </svg>
      {withWordmark ? (
        <span className="display text-lg font-semibold tracking-tight truncate">
          智衡 <span className="text-[var(--signal)]">{t("brand.product")}</span>
        </span>
      ) : null}
    </Link>
  );
}
