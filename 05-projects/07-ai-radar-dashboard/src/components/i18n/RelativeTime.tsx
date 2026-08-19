"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { formatRelativeZh } from "@/lib/intel/time";

export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const { locale } = useLocale();
  return (
    <time dateTime={iso} className={className}>
      {formatRelativeZh(iso, Date.now(), locale)}
    </time>
  );
}
