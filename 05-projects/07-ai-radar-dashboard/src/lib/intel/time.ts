import type { Locale } from "@/lib/i18n/messages";
import { interpolate, messages } from "@/lib/i18n/messages";

export function formatUpdatedAt(iso: string | null | undefined, locale: Locale = "zh"): string {
  if (!iso) return locale === "en" ? "Not synced" : "尚未同步";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return locale === "en" ? "Not synced" : "尚未同步";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(t));
}

/** Asia/Shanghai YYYY-MM-DD */
export function shanghaiDay(d: Date | string = new Date()): string {
  const iso = typeof d === "string" ? d : d.toISOString();
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

export function hoursAgo(iso: string, now = Date.now()): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (now - t) / 3_600_000);
}

/** 相对时间：8小时前 / 1天前 / 12分钟前 */
export function formatRelativeZh(iso: string, now = Date.now(), locale: Locale = "zh"): string {
  const t = Date.parse(iso);
  const table = messages[locale];
  if (Number.isNaN(t)) return table["time.justNow"];
  const hours = hoursAgo(iso, now);
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return interpolate(table["time.minutes"], { n: mins });
  }
  if (hours < 24) return interpolate(table["time.hours"], { n: Math.round(hours) });
  const days = Math.max(1, Math.round(hours / 24));
  return interpolate(table["time.days"], { n: days });
}

const CN_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function cnSmall(n: number): string {
  if (n <= 10) return n === 10 ? "十" : CN_DIGITS[n];
  if (n < 20) return `十${CN_DIGITS[n - 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${CN_DIGITS[tens]}十${ones ? CN_DIGITS[ones] : ""}`;
}

/** 二〇二六年八月十三日 星期四 */
export function formatLiteraryDateZh(ymd: string): { literary: string; weekday: string; vol: string } {
  const [ys, ms, ds] = ymd.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const literary = `${String(y)
    .split("")
    .map((c) => CN_DIGITS[Number(c)])
    .join("")}年${cnSmall(m)}月${cnSmall(d)}日`;
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    weekday: "long",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${ymd}T12:00:00+08:00`));
  return { literary, weekday, vol: `${ys}.${ms}.${ds}` };
}
