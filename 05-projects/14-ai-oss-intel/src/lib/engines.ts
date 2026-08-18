/**
 * Ranking / Growth / Scoring engines.
 * Pure functions over the Project data model — deterministic and testable.
 */
import type { Project, ProjectScores, RankKind, RankedItem } from "./types";

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
const pct10 = (v: number) => clamp(v * 10);

/** Stars → 0-100 popularity (log scale, ~200k stars ≈ 100). */
export function popularityScore(stars: number): number {
  return clamp((Math.log10(stars + 1) / 5.3) * 100);
}

export function contributorsScore(contributors: number): number {
  return clamp((Math.log10(contributors + 1) / 2) * 100);
}

export function forksScore(forks: number): number {
  return clamp((Math.log10(forks + 1) / 3.5) * 100);
}

/** Growth rate for a window: gained / baseline * 100. */
export function growthRate(p: Project, days: 7 | 30 | 90): number {
  const gained = days === 7 ? p.growth7d : days === 30 ? p.growth30d : p.growth90d;
  const baseline = p.stars - gained;
  if (baseline <= 0) return days === 90 ? 100 : 40;
  return (gained / baseline) * 100;
}

/** 0-100 growth score from 30-day rate (rate 25%+ → 100). */
export function growthScore(p: Project): number {
  const rate = growthRate(p, 30);
  return clamp(rate * 4);
}

export function computeScores(p: Project): ProjectScores {
  const prof = p.profile;
  const pop = popularityScore(p.stars);
  const grow = growthScore(p);
  const innovation = pct10(prof.innovation);
  const product = pct10(prof.productValue);
  const demand = pct10(prof.userDemand);
  const commercial = pct10(prof.commercialPotential);
  const ecosystem = pct10(prof.ecosystem);
  const personalDev = pct10(prof.personalDevValue);
  const lowCompetition = pct10(10 - prof.competition);

  // AI Project Score — weights from spec §14
  const aiScore = clamp(
    pop * 0.1 +
      grow * 0.15 +
      innovation * 0.15 +
      product * 0.15 +
      demand * 0.1 +
      commercial * 0.15 +
      ecosystem * 0.1 +
      personalDev * 0.1
  );

  // Opportunity Score — weights from spec §8
  const opportunity = clamp(
    grow * 0.25 + demand * 0.2 + commercial * 0.2 + innovation * 0.15 + ecosystem * 0.1 + lowCompetition * 0.1
  );

  const technical = clamp(innovation * 0.5 + ecosystem * 0.3 + contributorsScore(p.contributors) * 0.2);
  const productScore = clamp(product * 0.5 + demand * 0.3 + commercial * 0.2);
  const commercialScore = clamp(commercial * 0.5 + pct10(prof.moneyFit) * 0.3 + pct10(prof.startupFit) * 0.2);
  const sideHustle = clamp(
    pct10(prof.sideHustleFit) * 0.4 + pct10(prof.moneyFit) * 0.2 + commercial * 0.2 + lowCompetition * 0.2
  );
  const skill = clamp(pct10(prof.skillFit) * 0.5 + ecosystem * 0.2 + personalDev * 0.3);
  const resume = clamp(pct10(prof.resumeFit) * 0.4 + personalDev * 0.3 + innovation * 0.3);
  const content = clamp(pct10(prof.contentFit) * 0.5 + demand * 0.3 + grow * 0.2);
  const startup = clamp(pct10(prof.startupFit) * 0.4 + commercial * 0.3 + lowCompetition * 0.3);
  const money = clamp(pct10(prof.moneyFit) * 0.4 + commercial * 0.4 + demand * 0.2);
  const health = clamp(
    contributorsScore(p.contributors) * 0.3 +
      grow * 0.3 +
      clamp(p.releases * 3) * 0.2 +
      forksScore(p.forks) * 0.2
  );

  return {
    aiScore: Math.round(aiScore),
    technical: Math.round(technical),
    product: Math.round(productScore),
    growth: Math.round(grow),
    commercial: Math.round(commercialScore),
    sideHustle: Math.round(sideHustle),
    skill: Math.round(skill),
    resume: Math.round(resume),
    content: Math.round(content),
    startup: Math.round(startup),
    opportunity: Math.round(opportunity),
    money: Math.round(money),
    health: Math.round(health),
  };
}

/** Deterministic pseudo-random from a string seed (for stable demo deltas). */
export function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function rankKey(p: Project, s: ProjectScores, kind: RankKind): number {
  switch (kind) {
    case "stars": return p.stars;
    case "growth": return p.growth30d;
    case "opportunity": return s.opportunity;
    case "money": return s.money;
    case "sidehustle": return s.sideHustle;
    case "skills": return s.skill;
    case "resume": return s.resume;
    case "content": return s.content;
    case "new": return Date.parse(p.createdAt);
  }
}

export function rankProjects(projects: Project[], kind: RankKind, limit = 50): RankedItem[] {
  const scored = projects.map((p) => ({ project: p, scores: computeScores(p) }));
  scored.sort((a, b) => rankKey(b.project, b.scores, kind) - rankKey(a.project, a.scores, kind));
  return scored.slice(0, limit).map(({ project, scores }, i) => {
    const rnd = seededRandom(project.id + kind);
    const delta = Math.round((rnd - 0.42) * 18); // -7 .. +10 movement
    return { project, scores, rank: i + 1, delta };
  });
}

export function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export function formatSigned(n: number): string {
  return (n >= 0 ? "+" : "") + n.toLocaleString("en-US");
}

export function formatPct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}
