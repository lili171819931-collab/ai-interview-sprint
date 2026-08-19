"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { shanghaiDay } from "@/lib/intel/time";

export function FeaturedDateLine({ iso }: { iso?: string | null }) {
  const { locale, t } = useLocale();
  const ymd = shanghaiDay(iso || new Date().toISOString());
  const date =
    locale === "en"
      ? new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Shanghai",
        }).format(new Date(`${ymd}T12:00:00+08:00`))
      : (() => {
          const weekday = new Intl.DateTimeFormat("zh-CN", {
            weekday: "long",
            timeZone: "Asia/Shanghai",
          }).format(new Date(`${ymd}T12:00:00+08:00`));
          const [y, m, d] = ymd.split("-");
          return `${y}年${Number(m)}月${Number(d)}日${weekday}`;
        })();
  return <>{t("feed.sub.featured", { date })}</>;
}
