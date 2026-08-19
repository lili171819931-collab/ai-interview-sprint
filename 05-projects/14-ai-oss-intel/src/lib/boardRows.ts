/**
 * Unified category-board row builder.
 * 每个分类榜单（机会 / 收藏 / 收藏增长最快）都必须 ≥ LIMIT 个项目：
 * 本分类（快照 + 实时 + 手动添加）优先按指标排名，再用「全局池」补齐，
 * 保证未认证限流 / 小分类（如 robotics=1）也能凑满 100。
 * 纯函数，可单测。
 */
import type { CategoryId, Project } from "@/lib/types";
import { computeScores } from "@/lib/engines";
import { liveOpportunityScore, starsPerDay, type LiveRepo } from "@/lib/live";
import { guessCategoryFromRepo } from "@/lib/categorize";

export type BoardTab = "opportunity" | "stars" | "growth";
export type BoardRow = { kind: "seed"; p: Project } | { kind: "live"; r: LiveRepo };

export interface BuildBoardRowsInput {
  projects: Project[];
  liveRepos: LiveRepo[];
  addedRepos: LiveRepo[];
  categoryId: CategoryId;
  tab: BoardTab;
  limit?: number;
}

export interface BuildBoardRowsResult {
  rows: BoardRow[];
  catCount: number;
  padCount: number;
  liveCount: number;
}

const DEFAULT_LIMIT = 100;

export function buildBoardRows({
  projects,
  liveRepos,
  addedRepos,
  categoryId,
  tab,
  limit = DEFAULT_LIMIT,
}: BuildBoardRowsInput): BuildBoardRowsResult {
  // 统一行池：快照 + 实时 + 手动添加（按 fullName 去重）
  const pool = new Map<string, BoardRow>();
  for (const p of projects) pool.set(p.fullName.toLowerCase(), { kind: "seed", p });
  for (const r of liveRepos) pool.set(r.fullName.toLowerCase(), { kind: "live", r });
  for (const r of addedRepos) pool.set(r.fullName.toLowerCase(), { kind: "live", r });
  const all = [...pool.values()];

  const isCat = (row: BoardRow) =>
    row.kind === "seed" ? row.p.categories.includes(categoryId) : guessCategoryFromRepo(row.r) === categoryId;
  const key = (row: BoardRow) => (row.kind === "seed" ? `seed:${row.p.slug}` : `live:${row.r.fullName}`);
  const metric = (row: BoardRow, t: BoardTab): number => {
    if (t === "opportunity") return row.kind === "seed" ? computeScores(row.p).opportunity : liveOpportunityScore(row.r);
    if (t === "stars") return row.kind === "seed" ? row.p.stars : row.r.stars;
    return row.kind === "seed" ? (row.p.growth90d ?? 0) / 90 : starsPerDay(row.r);
  };

  const cat = all.filter(isCat).sort((a, b) => metric(b, tab) - metric(a, tab));
  const used = new Set(cat.map(key));
  const rest = all.filter((row) => !used.has(key(row))).sort((a, b) => metric(b, tab) - metric(a, tab));
  const fill: BoardRow[] = [];
  for (const row of rest) {
    if (cat.length + fill.length >= limit) break;
    fill.push(row);
  }
  const rows = [...cat, ...fill].slice(0, limit);
  return {
    rows,
    catCount: cat.length,
    padCount: Math.max(0, rows.length - Math.min(cat.length, rows.length)),
    liveCount: rows.filter((r) => r.kind === "live").length,
  };
}
