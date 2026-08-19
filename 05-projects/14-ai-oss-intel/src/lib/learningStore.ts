/**
 * Client-side learning state (localStorage-backed).
 * Stores: progress, challenge answers, decisions, opinions, interviews,
 * portfolio cases, published content, journey start, user profile.
 */
"use client";

import { LEARNING_STEPS } from "@/lib/types";
import { emptyAbilities } from "@/lib/learning";
import type { AbilityScores } from "@/lib/types";

const K = {
  progress: "aioss.learn.progress",
  challenges: "aioss.learn.challenges",
  decisions: "aioss.learn.decisions",
  opinions: "aioss.learn.opinions",
  interviews: "aioss.learn.interviews",
  portfolio: "aioss.learn.portfolio",
  content: "aioss.learn.content",
  journey: "aioss.learn.journey",
  profile: "aioss.learn.profile",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("aioss.learn.change"));
  } catch {}
}

export type ProgressMap = Record<string, Record<string, boolean>>;

export function getProgress(): ProgressMap {
  return read<ProgressMap>(K.progress, {});
}
export function setStep(slug: string, step: string, done: boolean) {
  const all = getProgress();
  all[slug] = { ...(all[slug] ?? {}), [step]: done };
  write(K.progress, all);
}
export function getProjectProgress(slug: string): Record<string, boolean> {
  return getProgress()[slug] ?? {};
}
export function getProjectCompletion(slug: string): number {
  const p = getProjectProgress(slug);
  const done = LEARNING_STEPS.filter((s) => p[s.id]).length;
  return Math.round((done / LEARNING_STEPS.length) * 100);
}

export interface ChallengeAnswer { slug: string; challengeId: string; correct: boolean; level: string; skill: string; at: string }
export function getChallengeAnswers(): ChallengeAnswer[] { return read(K.challenges, []); }
export function recordChallenge(a: ChallengeAnswer) {
  const list = getChallengeAnswers();
  write(K.challenges, [...list, a]);
}

export interface DecisionEntry { slug: string; projectName: string; myDecision: string; reason: string; aiOpinion: string; final: string; at: string }
export function getDecisions(): DecisionEntry[] { return read(K.decisions, []); }
export function addDecision(d: DecisionEntry) {
  const list = getDecisions();
  write(K.decisions, [...list, d]);
}

export interface OpinionEntry { slug: string; projectName: string; opinion: string; at: string }
export function getOpinions(): OpinionEntry[] { return read(K.opinions, []); }
export function saveOpinion(o: OpinionEntry) {
  const list = getOpinions().filter((x) => x.slug !== o.slug);
  write(K.opinions, [...list, o]);
}
export function getOpinion(slug: string): string {
  return getOpinions().find((o) => o.slug === slug)?.opinion ?? "";
}

export interface InterviewRecord { slug: string; projectName: string; score: number; at: string }
export function getInterviews(): InterviewRecord[] { return read(K.interviews, []); }
export function recordInterview(r: InterviewRecord) {
  const list = getInterviews();
  write(K.interviews, [...list, r]);
}

export interface PortfolioCase { id: string; projectId: string; projectName: string; category: string; title: string; at: string }
export function getPortfolioCases(): PortfolioCase[] { return read(K.portfolio, []); }
export function addPortfolioCase(c: PortfolioCase) {
  const list = getPortfolioCases().filter((x) => x.projectId !== c.projectId);
  write(K.portfolio, [...list, c]);
}

export interface PublishedContent { slug: string; projectName: string; platform: string; title: string; score: number; at: string }
export function getPublishedContent(): PublishedContent[] { return read(K.content, []); }
export function publishContent(c: PublishedContent) {
  const list = getPublishedContent();
  write(K.content, [...list, c]);
}

export function getJourney(): { start: string; day: number } {
  const start = read<string | null>(K.journey, null);
  if (!start) {
    const now = new Date().toISOString().slice(0, 10);
    write(K.journey, now);
    return { start: now, day: 1 };
  }
  const day = Math.max(1, Math.floor((Date.now() - Date.parse(start)) / 86400000) + 1);
  return { start, day };
}

export interface UserProfile { name: string; title: string; bio: string }
export function getProfile(): UserProfile {
  return read(K.profile, { name: "你的名字", title: "AI 产品经理（转型中）", bio: "正在用 GitHub 训练产品思维，30 天拆解 90 个 AI 产品。" });
}
export function setProfile(p: UserProfile) { write(K.profile, p); }

/** Derive ability scores from actual learning records (0 = not started). */
export function computeAbilities(): AbilityScores {
  const progress = getProgress();
  const challenges = getChallengeAnswers();
  const interviews = getInterviews();
  const decisions = getDecisions();
  const opinions = getOpinions();

  const projectsStudied = Object.keys(progress).length;
  const base = emptyAbilities();
  if (projectsStudied === 0 && challenges.length === 0 && interviews.length === 0) return base;

  // Progress-based points per skill
  const add = (k: keyof AbilityScores, pts: number) => { base[k] = Math.min(100, base[k] + pts); };
  for (const [slug, steps] of Object.entries(progress)) {
    const done = Object.values(steps).filter(Boolean).length;
    if (done > 0) {
      add("productThinking", 3);
      add("requirementAnalysis", 2.5);
      add("ux", 2);
      if (steps.overview || steps.problem) add("requirementAnalysis", 2);
      if (steps.feature) add("ux", 2);
      if (steps.aiLogic) add("aiUnderstanding", 3);
      if (steps.architecture) add("agentUnderstanding", 2.5);
      if (steps.architecture) add("technical", 2);
      if (steps.business) add("businessModel", 2.5);
      if (steps.opinion) add("communication", 2);
    }
  }
  for (const c of challenges) {
    add("requirementAnalysis", c.correct ? 2 : 0.6);
    add("productThinking", c.correct ? 1.5 : 0.5);
    if (c.skill === "用户研究") add("ux", 2);
    if (c.skill === "Feature Prioritization" || c.skill === "产品设计" || c.skill === "MVP") add("ux", 2);
    if (c.skill === "AI 产品设计") add("aiUnderstanding", 2);
    if (c.skill === "Agent") add("agentUnderstanding", 2);
    if (c.skill === "商业分析") add("businessModel", 2);
    if (c.skill === "增长分析") add("growth", 2);
    if (c.skill === "留存") add("growth", 2);
    if (c.skill === "风险管理" || c.skill === "产品战略" || c.skill === "GTM / 市场进入") add("productThinking", 2);
    if (c.skill === "沟通表达") add("communication", 2);
  }
  for (const it of interviews) {
    add("communication", it.score / 20);
    add("productThinking", it.score / 25);
  }
  for (const d of decisions) {
    add("productThinking", 3);
    add("communication", 2);
    add("requirementAnalysis", 2);
  }
  for (const o of opinions) {
    add("communication", 3);
    add("productThinking", 2);
  }

  const out = {} as AbilityScores;
  for (const k of Object.keys(base) as (keyof AbilityScores)[]) {
    out[k] = Math.min(100, Math.max(0, Math.round(base[k])));
  }
  return out;
}

export function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("aioss.learn.change", cb);
  return () => window.removeEventListener("aioss.learn.change", cb);
}
