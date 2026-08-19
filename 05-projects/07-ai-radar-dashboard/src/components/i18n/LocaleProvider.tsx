"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { interpolate, messages, type Locale, type MessageKey, LOCALE_KEY } from "@/lib/i18n/messages";

type Ctx = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

function readStored(): Locale {
  if (typeof window === "undefined") return "zh";
  try {
    const v = window.localStorage.getItem(LOCALE_KEY);
    if (v === "en" || v === "zh") return v;
  } catch {
    /* ignore */
  }
  return "zh";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    setLocaleState(readStored());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.locale = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, values?: Record<string, string | number>) => {
      const table = messages[locale] || messages.zh;
      return interpolate(table[key] || messages.zh[key] || key, values);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
