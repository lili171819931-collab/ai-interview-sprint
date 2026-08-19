/**
 * Read-side data access layer: filtering, search, categories, rankings.
 */
import { PROJECTS } from "@/data/projects";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { computeScores, rankProjects } from "@/lib/engines";
import type { CategoryId, Project, ProjectScores, RankKind } from "@/lib/types";

export const allProjects = () => PROJECTS;
export const allCategories = () => CATEGORIES;

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function projectScores(p: Project): ProjectScores {
  return computeScores(p);
}

export interface DiscoverFilter {
  q?: string;
  category?: CategoryId | "all";
  language?: string;
  lang?: string;
  minStars?: number;
  maxStars?: number;
}

export function discoverProjects(filter: DiscoverFilter = {}): Project[] {
  const q = (filter.q ?? "").trim().toLowerCase();
  const cat = filter.category ?? "all";
  return PROJECTS.filter((p) => {
    if (q) {
      const hay = `${p.name} ${p.owner} ${p.tagline} ${p.description} ${p.topics.join(" ")} ${p.fullName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (cat !== "all" && !p.categories.includes(cat)) return false;
    if ((filter.language || filter.lang) && p.language !== (filter.language || filter.lang)) return false;
    if (filter.minStars !== undefined && p.stars < filter.minStars) return false;
    if (filter.maxStars !== undefined && p.stars > filter.maxStars) return false;
    return true;
  });
}

export function topBy(kind: RankKind, limit = 50) {
  return rankProjects(PROJECTS, kind, limit);
}

export function categoryCounts(): { id: CategoryId; count: number }[] {
  const counts = new Map<CategoryId, number>();
  for (const p of PROJECTS) {
    for (const c of p.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

export function languages(): string[] {
  return [...new Set(PROJECTS.map((p) => p.language).filter(Boolean))].sort();
}

export function relatedProjects(p: Project, limit = 4): Project[] {
  const scored = PROJECTS.filter((x) => x.slug !== p.slug)
    .map((x) => {
      const overlap = x.categories.filter((c) => p.categories.includes(c)).length;
      const topicOverlap = x.topics.filter((t) => p.topics.includes(t)).length;
      return { x, score: overlap * 2 + topicOverlap };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.x);
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_MAP[id]?.name ?? id;
}
