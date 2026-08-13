import type { GlobalHotItem, GlobalHotPlatformGroup, GlobalHotRegion } from "@/lib/global-hot-types";
import type { HotStatus } from "@/lib/intel/aihot-types";
import { titleSimilarity } from "@/lib/intel/cluster";
import { displayHeat, hotStatus } from "@/lib/intel/hot-rank";

function topicId(parts: string[]): string {
  let h = 0;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0");
}

export type MergedHotTopic = {
  id: string;
  rank: number;
  title: string;
  href: string;
  platforms: string[];
  /** 来源平台标注，如「微博热搜 · 抖音热榜」 */
  sourceLabel: string;
  latestAt: string;
  heat: number;
  status: HotStatus;
  itemCount: number;
};

function parseHeat(h: string | number | null | undefined): number | null {
  if (h == null || h === "") return null;
  if (typeof h === "number" && Number.isFinite(h)) return h;
  const n = Number(String(h).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function autoHref(title: string, url?: string | null): string {
  if (url && /^https?:\/\//i.test(url)) return url;
  return `https://www.google.com/search?q=${encodeURIComponent(title.slice(0, 80))}`;
}

function flattenRegion(platforms: GlobalHotPlatformGroup[], region: GlobalHotRegion): GlobalHotItem[] {
  const out: GlobalHotItem[] = [];
  for (const p of platforms) {
    if (p.region !== region) continue;
    for (const it of p.items) {
      out.push({
        ...it,
        platform: it.platform || p.name,
        region,
      });
    }
  }
  return out;
}

type Cluster = {
  items: GlobalHotItem[];
  titles: string[];
};

/**
 * 同区域内合并相同／高度相似热点：标题 Jaccard ≥ 阈值即归并。
 * 跨平台同题（如微博+抖音同热搜）会合成一条，并标注全部来源平台。
 */
export function mergeRegionalHotTopics(
  platforms: GlobalHotPlatformGroup[],
  region: GlobalHotRegion,
  opts?: { titleSimilarity?: number; limit?: number },
): MergedHotTopic[] {
  const threshold = opts?.titleSimilarity ?? 0.72;
  const limit = opts?.limit ?? 40;
  const flat = flattenRegion(platforms, region);
  const clusters: Cluster[] = [];

  for (const item of flat) {
    let matched: Cluster | null = null;
    for (const c of clusters) {
      const refs = c.titles.slice(0, 3);
      const sim = Math.max(...refs.map((t) => titleSimilarity(item.title, t)));
      if (sim >= threshold) {
        matched = c;
        break;
      }
    }
    if (matched) {
      matched.items.push(item);
      matched.titles.push(item.title);
    } else {
      clusters.push({ items: [item], titles: [item.title] });
    }
  }

  const now = Date.now();
  const scored = clusters.map((c) => {
    const items = [...c.items].sort((a, b) => a.rank - b.rank || b.title.length - a.title.length);
    const best = items[0];
    const platformsUnique = [...new Set(items.map((i) => i.platform).filter(Boolean))];
    const latestAt = [...items.map((i) => i.fetched_at).filter(Boolean)].sort().at(-1) || best.fetched_at;
    const heatNums = items.map((i) => parseHeat(i.heat)).filter((n): n is number => n != null);
    const maxReported = heatNums.length ? Math.max(...heatNums) : 0;
    const sourceCount = Math.max(1, platformsUnique.length);
    const signalCount = items.length;
    const derived = displayHeat(sourceCount, signalCount, latestAt, now);
    // 平台原始热度常为千万级；合并榜用同源口径小数字，超大值只做对数加成
    let heat = derived;
    if (maxReported > 0 && maxReported < 500) heat = Math.max(heat, Math.round(maxReported));
    else if (maxReported >= 500) heat = Math.max(heat, Math.round(Math.log10(maxReported) * 18));
    const withUrl = items.find((i) => i.url && /^https?:\/\//i.test(i.url)) || best;
    const id = topicId([region, ...platformsUnique.sort(), best.title]);

    return {
      id,
      title: best.title,
      href: autoHref(best.title, withUrl.url),
      platforms: platformsUnique,
      sourceLabel:
        platformsUnique.length <= 3
          ? platformsUnique.join(" · ")
          : `${platformsUnique.slice(0, 2).join(" · ")} 等 ${platformsUnique.length} 源`,
      latestAt,
      heat: Math.max(1, heat),
      status: hotStatus(sourceCount, signalCount, latestAt, now),
      itemCount: items.length,
      _sort: sourceCount * 1000 + signalCount * 40 - best.rank + heat * 0.01,
    };
  });

  scored.sort((a, b) => b.heat - a.heat || b._sort - a._sort);

  return scored.slice(0, limit).map(({ _sort: _, ...rest }, i) => ({
    ...rest,
    rank: i + 1,
  }));
}

/** Reddit / Twitter 等失败源的白话诊断（对齐页脚 status 表）。 */
export function analyzeFailedSources(
  sources: { label: string; region: string; ok: boolean; error?: string; hits: number }[],
): { label: string; region: string; diagnosis: string; error?: string }[] {
  return sources
    .filter((s) => !s.ok)
    .map((s) => {
      const err = s.error || "";
      let diagnosis = "抓取失败，本轮未计入合并榜。";
      if (/no items parsed/i.test(err)) {
        diagnosis = "解析结果为空（页面结构变更、反爬或登录墙），本轮 0 条入榜。";
      } else if (/ClientTransaction|twitter_cli|NoneType/i.test(err)) {
        diagnosis = "客户端初始化失败（会话／交易签名失效），需更新 Twitter CLI 或凭证后重试。";
      } else if (/timeout|ETIMEDOUT|aborted/i.test(err)) {
        diagnosis = "请求超时，网络或目标站限流。";
      }
      return { label: s.label, region: s.region, diagnosis, error: s.error };
    });
}
