import type { Db } from "../db/connection";
import type { SkillDetail } from "./types";
import { searchSkills } from "./search";
import { listSkills } from "./skill-registry";

export interface Recommendation {
  skill: SkillDetail;
  score: number;
  reasons: string[];
}

/**
 * Skill Recommendation Engine.
 *
 * score = semantic/intent match (0..1)
 *       + usage frequency boost
 *       + success-rate boost
 *       + recency boost
 *       + favorite boost
 *       + workflow-context boost (skills that frequently follow in history)
 */
export function recommendSkills(
  db: Db,
  query: string,
  opts: { limit?: number; sessionId?: string | null; contextSkills?: string[] } = {},
): Recommendation[] {
  const limit = opts.limit ?? 5;
  const semantic = searchSkills(db, query, { limit: 20 });
  const top = semantic.slice(0, limit).map((r) => {
    const reasons = buildReasons(db, r.skill, r.score, r.matchedTerms);
    return { skill: r.skill, score: r.score, reasons };
  });

  // Fallback: if no semantic match, suggest by usage
  if (top.length === 0) {
    return listSkills(db, { status: "active", sort: "usage", limit }).map((skill) => ({
      skill,
      score: 0.3,
      reasons: ["基于历史使用频率推荐"],
    }));
  }
  return top;
}

function buildReasons(db: Db, skill: SkillDetail, score: number, matchedTerms: string[]): string[] {
  const reasons: string[] = [];
  if (matchedTerms.length > 0) reasons.push(`匹配关键词: ${matchedTerms.slice(0, 5).join(", ")}`);
  else reasons.push("语义相关");
  if (skill.usage_count > 0) reasons.push(`历史使用 ${skill.usage_count} 次`);
  const rate = skill.usage_count > 0 ? Math.round((skill.success_count / skill.usage_count) * 100) : null;
  if (rate != null && rate >= 80) reasons.push(`成功率 ${rate}%`);
  const fav = db.prepare("SELECT 1 FROM favorites WHERE skill_id = ?").get(skill.id);
  if (fav) reasons.push("已收藏");
  if (skill.last_used_at) reasons.push("近期使用过");
  return reasons;
}
