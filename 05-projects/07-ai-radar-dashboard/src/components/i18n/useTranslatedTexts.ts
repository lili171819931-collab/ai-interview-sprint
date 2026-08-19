"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { needsTranslation } from "@/lib/i18n/script";

const mem = new Map<string, string>();
const STORE = "zhiheng-tx-v1";

function cacheKey(locale: string, text: string) {
  return `${locale}::${text}`;
}

function readStore() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORE);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && !mem.has(k)) mem.set(k, v);
    }
  } catch {
    /* ignore */
  }
}

function writeStore() {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, string> = {};
    let n = 0;
    for (const [k, v] of mem) {
      obj[k] = v;
      n += 1;
      if (n >= 800) break;
    }
    window.sessionStorage.setItem(STORE, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

async function translateChunk(texts: string[], target: "zh" | "en"): Promise<{ src: string; dst: string }[]> {
  const res = await fetch("/api/v1/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, texts }),
  });
  if (!res.ok) return texts.map((src) => ({ src, dst: src }));
  const json = (await res.json()) as { items?: { src: string; dst: string }[] };
  return json.items || [];
}

export function useTranslatedTexts(texts: string[]): Map<string, string> {
  const { locale } = useLocale();
  const uniq = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of texts) {
      const s = (t || "").trim();
      if (!s || seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
    return out;
  }, [texts]);

  const fingerprint = uniq.join("\u0001");
  const [map, setMap] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    readStore();
    const pending: string[] = [];
    const next = new Map<string, string>();
    for (const src of uniq) {
      const k = cacheKey(locale, src);
      const hit = mem.get(k);
      if (hit) next.set(src, hit);
      else if (!needsTranslation(src, locale)) {
        mem.set(k, src);
        next.set(src, src);
      } else pending.push(src);
    }
    setMap(next);
    if (!pending.length) return;

    let cancelled = false;
    (async () => {
      const merged = new Map(next);
      const size = 16;
      for (let i = 0; i < pending.length; i += size) {
        if (cancelled) return;
        const chunk = pending.slice(i, i + size);
        try {
          const items = await translateChunk(chunk, locale);
          for (const it of items) {
            const dst = it.dst || it.src;
            mem.set(cacheKey(locale, it.src), dst);
            merged.set(it.src, dst);
          }
          if (!cancelled) setMap(new Map(merged));
        } catch {
          /* keep originals */
        }
        if (i + size < pending.length) {
          await new Promise((r) => setTimeout(r, 80));
        }
      }
      writeStore();
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, fingerprint]);

  return map;
}

export function tr(map: Map<string, string>, text: string): string {
  const s = (text || "").trim();
  if (!s) return text;
  return map.get(s) || text;
}

export function collectStrings(...groups: Array<string | null | undefined | string[]>): string[] {
  const out: string[] = [];
  for (const g of groups) {
    if (!g) continue;
    if (Array.isArray(g)) out.push(...g);
    else out.push(g);
  }
  return out;
}
