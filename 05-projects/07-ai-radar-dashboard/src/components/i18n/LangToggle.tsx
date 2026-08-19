"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className={compact ? "lang-switch lang-switch-compact" : "lang-switch"} role="group" aria-label={t("lang.switch")}>
      <button
        type="button"
        className={locale === "zh" ? "lang-switch-btn lang-switch-on" : "lang-switch-btn"}
        onClick={() => setLocale("zh")}
      >
        {t("lang.zh")}
      </button>
      <button
        type="button"
        className={locale === "en" ? "lang-switch-btn lang-switch-on" : "lang-switch-btn"}
        onClick={() => setLocale("en")}
      >
        {t("lang.en")}
      </button>
    </div>
  );
}
