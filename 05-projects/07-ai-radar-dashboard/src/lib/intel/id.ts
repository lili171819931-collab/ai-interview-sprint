import { createHash } from "crypto";
import type { IntelItem } from "./types";

/** Stable id from platform + url (or title fallback). */
export function makeItemId(platform: string, url: string, title: string): string {
  const key = `${platform}|${canonicalizeUrl(url) || title.trim().toLowerCase()}`;
  return createHash("sha1").update(key).digest("hex");
}

export function canonicalizeUrl(url: string): string {
  if (!url?.trim()) return "";
  try {
    const u = new URL(url.trim());
    u.hash = "";
    // strip common trackers
    const drop = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "spm",
      "from",
      "ref",
    ]);
    [...u.searchParams.keys()].forEach((k) => {
      if (drop.has(k.toLowerCase()) || k.toLowerCase().startsWith("utm_")) {
        u.searchParams.delete(k);
      }
    });
    return u.toString();
  } catch {
    return url.trim();
  }
}

export function shanghaiDay(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Intra-batch dedupe by id (keep first). */
export function dedupeItems(items: IntelItem[]): IntelItem[] {
  const seen = new Set<string>();
  const out: IntelItem[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

export function guessLanguage(title: string): string {
  return /[\u4e00-\u9fff]/.test(title) ? "zh" : "en";
}

export function guessCountry(platform: string, regionHint?: string): string {
  if (regionHint === "海外" || /reddit|hn|hacker|github|techcrunch|reuters|bloomberg/i.test(platform)) {
    return "US";
  }
  if (regionHint === "国内" || /weibo|zhihu|bilibili|baidu|toutiao|douyin|cls|thepaper|ifeng|tieba/i.test(platform)) {
    return "CN";
  }
  return "UN";
}
