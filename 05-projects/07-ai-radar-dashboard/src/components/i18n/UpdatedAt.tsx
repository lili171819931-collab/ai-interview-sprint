"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { formatUpdatedAt } from "@/lib/intel/time";

export function UpdatedAt({ iso }: { iso?: string | null }) {
  const { locale, t } = useLocale();
  return <span>{t("time.updated", { stamp: formatUpdatedAt(iso, locale) })}</span>;
}
