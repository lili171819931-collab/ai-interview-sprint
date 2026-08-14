import type { Db } from "../db/connection";
import type { SkillDetail } from "./types";
import { listSkills } from "./skill-registry";

export interface SearchResult {
  skill: SkillDetail;
  score: number;
  matchedTerms: string[];
}

/**
 * Hybrid search:
 *   1. keyword filter via SQL (name/description/tags/category)
 *   2. semantic ranking via TF-IDF + cosine similarity over the skill corpus
 *   3. metadata & usage boosts
 */
export function searchSkills(
  db: Db,
  query: string,
  opts: { limit?: number; categoryId?: string | null; tag?: string | null; executionType?: string | null } = {},
): SearchResult[] {
  const q = query.trim();
  const limit = opts.limit ?? 12;
  // Semantic path uses the full active corpus; SQL keyword pre-filter would
  // kill the pool for natural-language queries that don't substring-match.
  const pool = listSkills(db, {
    categoryId: opts.categoryId ?? undefined,
    tag: opts.tag ?? undefined,
    executionType: opts.executionType ?? undefined,
    status: "active",
    limit: 200,
  });
  if (!q) {
    return pool.slice(0, limit).map((skill, i) => ({ skill, score: Math.max(0, 1 - i * 0.05), matchedTerms: [] }));
  }

  const tokens = tokenize(q);
  const index = buildIndex(pool);
  const scores = new Map<string, { score: number; matched: Set<string> }>();
  for (const skill of pool) {
    const doc = documentText(skill);
    const vec = tfidfVector(doc, tokens, index);
    const queryVec = tfidfVector(q, tokens, index);
    const sim = cosine(vec, queryVec);
    if (sim <= 0) continue;
    const matched = new Set<string>();
    for (const t of tokens) if (doc.includes(t)) matched.add(t);
    // usage / recency / success boosts
    const usageBoost = Math.min(0.15, Math.log10(skill.usage_count + 1) * 0.05);
    const successRate = skill.usage_count > 0 ? skill.success_count / skill.usage_count : 0.5;
    const successBoost = successRate * 0.05;
    const recencyBoost = skill.last_used_at ? 0.02 : 0;
    scores.set(skill.id, { score: sim + usageBoost + successBoost + recencyBoost, matched });
  }

  return [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([id, v]) => {
      const skill = pool.find((s) => s.id === id)!;
      return { skill, score: v.score, matchedTerms: [...v.matched] };
    });
}

interface Corpus {
  df: Map<string, number>;
  docCount: number;
}

function buildIndex(skills: SkillDetail[]): Corpus {
  const df = new Map<string, number>();
  for (const skill of skills) {
    const terms = new Set(tokenize(documentText(skill)));
    for (const t of terms) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return { df, docCount: skills.length };
}

function tfidfVector(text: string, tokens: string[], corpus: Corpus): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokenize(text)) {
    if (!tokens.includes(t)) continue;
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  const vec = new Map<string, number>();
  for (const [t, count] of tf) {
    const idf = Math.log((corpus.docCount + 1) / ((corpus.df.get(t) ?? 0) + 1)) + 1;
    vec.set(t, count * idf);
  }
  return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  for (const [k, v] of a) if (b.has(k)) dot += v * b.get(k)!;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function documentText(skill: SkillDetail): string {
  return [
    skill.name,
    skill.description,
    skill.ai_description ?? "",
    skill.category?.name ?? "",
    skill.tags.join(" "),
    ...(Array.isArray(skill.use_cases) ? skill.use_cases : []),
  ].join(" ");
}

/** Tokenizer: English words + Chinese character bigrams. */
export function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const english = lower.match(/[a-z0-9]+/g) ?? [];
  const chinese = lower.match(/[\u4e00-\u9fa5]+/g) ?? [];
  const bigrams: string[] = [];
  for (const chunk of chinese) {
    if (chunk.length === 1) bigrams.push(chunk);
    for (let i = 0; i < chunk.length - 1; i++) bigrams.push(chunk.slice(i, i + 2));
  }
  return [...english, ...bigrams];
}
