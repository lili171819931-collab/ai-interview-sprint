import type {
  EventScoreBreakdown,
  IntelEvent,
  IntelItem,
  TrendStatus,
  UserInterests,
} from "./types";
import { buildEventShell } from "./cluster";

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function asHotNumber(hot: number | string | null | undefined): number | null {
  if (hot == null) return null;
  if (typeof hot === "number" && Number.isFinite(hot)) return hot;
  const s = String(hot).trim();
  const m = s.match(/([\d.]+)\s*([万亿wkwm]?)/i);
  if (!m) return null;
  let n = Number(m[1]);
  const unit = (m[2] || "").toLowerCase();
  if (unit === "万" || unit === "w") n *= 1e4;
  if (unit === "亿") n *= 1e8;
  if (unit === "k") n *= 1e3;
  if (unit === "m") n *= 1e6;
  return Number.isFinite(n) ? n : null;
}

/** Rank 1 → ~1.0, rank 50 → ~0.2 */
function heatFromRank(rank: number | null | undefined): number {
  if (rank == null || rank <= 0) return 0.25;
  return clamp01(1.05 - Math.log10(rank + 1) / 2);
}

function heatFromItems(items: IntelItem[]): number {
  let best = 0;
  for (const it of items) {
    const hot = asHotNumber(it.engagement?.hot);
    let h = heatFromRank(it.rank);
    if (hot != null) {
      // log scale up to ~1e7
      h = Math.max(h, clamp01(Math.log10(hot + 10) / 7));
    }
    best = Math.max(best, h);
  }
  // multi-source boost lightly
  const boost = 1 + Math.min(0.25, (items.length - 1) * 0.03);
  return clamp01(best * boost);
}

function velocityProxy(items: IntelItem[], platformCount: number): number {
  // Without history: proxy by multi-platform + AI/tech category + top ranks
  const topRanks = items.filter((i) => (i.rank ?? 99) <= 10).length;
  const catBoost = items.some((i) => /^(ai|tech|agent)$/i.test(i.category)) ? 0.15 : 0;
  const cross = clamp01(Math.log2(platformCount + 1) / 3);
  return clamp01(0.35 * cross + 0.1 * Math.min(1, topRanks / 3) + catBoost + (items.length > 3 ? 0.1 : 0));
}

function crossPlatformFactor(platformCount: number): number {
  return clamp01(0.45 + Math.log2(platformCount + 1) / 4);
}

function authorityFactor(items: IntelItem[]): number {
  if (!items.length) return 0.5;
  const avg = items.reduce((s, i) => s + (i.source_reliability || 0.5), 0) / items.length;
  const hasAuthorityPlatform = items.some((i) =>
    /reuters|bloomberg|nature|science|openai|anthropic|github|cls|thepaper|华尔街/i.test(i.platform + i.source),
  );
  return clamp01(avg * 0.85 + (hasAuthorityPlatform ? 0.15 : 0));
}

function recencyFactor(items: IntelItem[], now = new Date()): number {
  // Prefer ISO timestamps; fallback mid score for TrendRadar "HH-mm" clocks
  let bestHours = 48;
  for (const it of items) {
    const raw = it.fetched_at || it.published_at;
    const t = Date.parse(raw);
    if (Number.isNaN(t)) {
      bestHours = Math.min(bestHours, 12);
      continue;
    }
    bestHours = Math.min(bestHours, (now.getTime() - t) / 36e5);
  }
  if (bestHours <= 3) return 1;
  if (bestHours <= 12) return 0.85;
  if (bestHours <= 24) return 0.7;
  if (bestHours <= 48) return 0.5;
  return 0.3;
}

export function userRelevanceScore(items: IntelItem[], interests?: UserInterests | null): number {
  if (!interests) return 0.5;
  const cats = new Set((interests.categories || []).map((c) => c.toLowerCase()));
  const kws = (interests.keywords || []).map((k) => k.toLowerCase()).filter(Boolean);
  let score = 0.35;
  for (const it of items) {
    if (cats.has((it.category || "").toLowerCase())) score += 0.12;
    const blob = `${it.title} ${it.keywords.join(" ")}`.toLowerCase();
    for (const kw of kws) {
      if (kw && blob.includes(kw.toLowerCase())) {
        score += 0.08;
        break;
      }
    }
  }
  return clamp01(score);
}

export function classifyTrendStatus(heat: number, velocity: number, platformCount: number): TrendStatus {
  if (heat < 0.35 && velocity >= 0.55) return "emerging";
  if (velocity >= 0.6 && heat >= 0.4) return "rising";
  if (heat >= 0.7 && platformCount >= 2) return "hot";
  if (heat >= 0.55) return "stable";
  if (velocity < 0.25 && heat < 0.45) return "fading";
  if (velocity < 0.35) return "cooling";
  return "stable";
}

export function scoreEvent(
  items: IntelItem[],
  interests?: UserInterests | null,
  now = new Date(),
): IntelEvent {
  const shell = buildEventShell(items);
  const heat = heatFromItems(items);
  const velocity = velocityProxy(items, shell.platform_count);
  const crossPlatform = crossPlatformFactor(shell.platform_count);
  const sourceAuthority = authorityFactor(items);
  const recency = recencyFactor(items, now);
  const userRelevance = userRelevanceScore(items, interests);

  const breakdown: EventScoreBreakdown = {
    heat: round3(heat),
    velocity: round3(velocity),
    crossPlatform: round3(crossPlatform),
    sourceAuthority: round3(sourceAuthority),
    recency: round3(recency),
    userRelevance: round3(userRelevance),
  };

  // Geometric-ish product then scale to 0–100
  const raw =
    heat *
    (0.55 + 0.45 * velocity) *
    (0.6 + 0.4 * crossPlatform) *
    (0.65 + 0.35 * sourceAuthority) *
    (0.7 + 0.3 * recency) *
    (0.55 + 0.45 * userRelevance);

  const heat_score = Math.round(clamp01(raw) * 1000) / 10; // one decimal 0–100

  return {
    ...shell,
    heat_score,
    velocity: round3(velocity),
    trend_status: classifyTrendStatus(heat, velocity, shell.platform_count),
    score_breakdown: breakdown,
    user_relevance: round3(userRelevance),
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function scoreClusters(
  clusters: IntelItem[][],
  interests?: UserInterests | null,
  now = new Date(),
): IntelEvent[] {
  return clusters
    .filter((c) => c.length > 0)
    .map((c) => scoreEvent(c, interests, now))
    .sort((a, b) => b.heat_score - a.heat_score || b.platform_count - a.platform_count);
}
