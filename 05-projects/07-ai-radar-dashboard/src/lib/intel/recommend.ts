import type { FeedCategory } from "./categories";
import { FEED_CATEGORY_LABELS } from "./categories";

/** 从摘要 / 品类生成推荐理由（无上游字段时的本地兜底） */
export function buildRecommendReason(input: {
  title: string;
  summary?: string | null;
  category?: FeedCategory | string | null;
  score?: number | null;
  selected?: boolean;
}): string {
  const summary = (input.summary || "").trim();
  if (summary.length >= 24) {
    const first = summary.split(/[。！？\n]/)[0]?.trim() || summary;
    if (first.length >= 18) {
      return first.endsWith("。") ? first : `${first.slice(0, 120)}${first.length > 120 ? "…" : ""}`;
    }
  }
  const cat = input.category ? FEED_CATEGORY_LABELS[(input.category as FeedCategory)] || String(input.category) : "AI";
  const scoreBit = input.score != null ? `，AI 评分 ${Math.round(input.score)}/100` : "";
  const pick = input.selected ? "入选精选池" : "值得跟踪";
  return `${cat}向信号突出${scoreBit}：${pick}，可跟进原文核对落地细节。`;
}

export function normalizeScore(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  const n = Math.round(raw);
  return Math.max(0, Math.min(100, n));
}
