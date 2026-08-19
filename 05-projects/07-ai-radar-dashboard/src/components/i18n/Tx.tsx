"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

export function Tx({
  k,
  values,
  as: Comp = "span",
  className,
}: {
  k: MessageKey;
  values?: Record<string, string | number>;
  as?: "span" | "p" | "h1" | "h2" | "div";
  className?: string;
}) {
  const { t } = useLocale();
  return <Comp className={className}>{t(k, values)}</Comp>;
}
