/**
 * Unified category-board row builder.
 * 每个分类榜单（机会 / 收藏 / 收藏增长最快）**只展示本分类且属于 2026 年**的项目：
 * - 分类相关：seed 项目 categories 包含该分类；实时项目按仓库特征归类
 * - 2026 年：创建或最近更新在 2026 年（剔除 2026 前已停更的旧仓库）
 * 不做跨分类补齐 —— 相关性优先，小分类数量以实际为准。
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
  /**
   * 实时仓库是否已按分类查询拉取（loadLive(id) 用分类查询），
   * true 时视为本分类相关（默认 false 表示需按仓库特征猜测）。
   */
  liveTrusted?: boolean;
}

export interface BuildBoardRowsResult {
  rows: BoardRow[];
  catCount: number;
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
  liveTrusted = false,
}: BuildBoardRowsInput): BuildBoardRowsResult {
  // 统一行池：快照 + 实时 + 手动添加（按 fullName 去重）
  const pool = new Map<string, BoardRow>();
  for (const p of projects) pool.set(p.fullName.toLowerCase(), { kind: "seed", p });
  for (const r of liveRepos) pool.set(r.fullName.toLowerCase(), { kind: "live", r });
  for (const r of addedRepos) pool.set(r.fullName.toLowerCase(), { kind: "live", r });
  const all = [...pool.values()];

  const isCat = (row: BoardRow) =>
    row.kind === "seed" ? row.p.categories.includes(categoryId) : liveTrusted || guessCategoryFromRepo(row.r) === categoryId;
  const metric = (row: BoardRow, t: BoardTab): number => {
    if (t === "opportunity") return row.kind === "seed" ? computeScores(row.p).opportunity : liveOpportunityScore(row.r);
    if (t === "stars") return row.kind === "seed" ? row.p.stars : row.r.stars;
    return row.kind === "seed" ? (row.p.growth90d ?? 0) / 90 : starsPerDay(row.r);
  };

  // 2026 年窗口：创建或最近更新在 2026 年（剔除 2026 前已停更的旧仓库）
  const year = (d?: string) => parseInt((d ?? "").slice(0, 4), 10);
  const in2026 = (row: BoardRow): boolean =>
    row.kind === "seed"
      ? year(row.p.createdAt) >= 2026 || year(row.p.updatedAt) >= 2026
      : year(row.r.createdAt) >= 2026 || year(row.r.updatedAt) >= 2026;

  // 只保留：本分类相关 且 2026 年项目 —— 不做跨分类补齐
  const rows = all
    .filter((row) => isCat(row) && in2026(row))
    .sort((a, b) => metric(b, tab) - metric(a, tab))
    .slice(0, limit);
  return {
    rows,
    catCount: rows.length,
    liveCount: rows.filter((r) => r.kind === "live").length,
  };
}
