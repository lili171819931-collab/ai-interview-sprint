/**
 * Engine unit tests — run with `npm test`.
 */
import { PROJECTS } from "../src/data/projects";
import { computeScores, growthRate, rankProjects, formatStars } from "../src/lib/engines";
import { parseQuery, answerQuery } from "../src/lib/query";
import { generateReport } from "../src/lib/reports";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error(`✖ ${msg}`); process.exitCode = 1; }
  else console.log(`✔ ${msg}`);
}

// 1. Every project gets valid scores in [0,100]
for (const p of PROJECTS) {
  const s = computeScores(p);
  for (const [k, v] of Object.entries(s)) {
    assert(Number.isFinite(v) && v >= 0 && v <= 100, `${p.slug}.${k}=${v} in range`);
  }
}

// 2. Growth rate is sane
const hot = PROJECTS.find((p) => p.slug === "dify")!;
assert(growthRate(hot, 30) > 0, "dify 30d growth rate > 0");
assert(Math.abs(growthRate(hot, 30) - (hot.growth30d / (hot.stars - hot.growth30d)) * 100) < 0.001, "growthRate formula");

// 3. Rankings are ordered and unique
for (const kind of ["stars", "growth", "opportunity", "money", "sidehustle", "skills", "resume", "content"] as const) {
  const r = rankProjects(PROJECTS, kind, 50);
  assert(r.length === Math.min(50, PROJECTS.length), `${kind} rank length`);
  assert(new Set(r.map((x) => x.project.slug)).size === r.length, `${kind} unique`);
  for (let i = 1; i < r.length; i++) {
    const key = (x: (typeof r)[0]): number => {
      switch (kind) {
        case "stars": return x.project.stars;
        case "growth": return x.project.growth30d;
        case "skills": return x.scores.skill;
        case "sidehustle": return x.scores.sideHustle;
        default: return x.scores[kind];
      }
    };
    assert(key(r[i - 1]) >= key(r[i]), `${kind} sorted at ${i}`);
  }
}

// 4. Star formatting
assert(formatStars(32100) === "32.1K", "formatStars K");

// 5. NL query parsing
const q1 = parseQuery("找出最近30天增长最快适合做副业的AI项目");
assert(q1.kind === "growth" && q1.days === 30 && q1.goal === "副业", "query1 intent");
const q2 = parseQuery("哪些项目适合做Skill");
assert(q2.kind === "skills", "query2 skills");
const q3 = parseQuery("给我找适合AI PM做Portfolio的项目");
assert(q3.kind === "resume", "query3 resume");
const q4 = parseQuery("如果我只有一个人，最适合做哪个？3个");
assert(q4.limit === 3, "query4 limit 3");

// 6. Answer produces recommendations
const a = answerQuery("找出最近30天增长最快、适合个人开发者、可以做副业、最好能SaaS化的AI项目");
assert(a.projects.length > 0, "answer has projects");
assert(a.recommendations.length === a.projects.length, "answer recs match");

// 7. Report generator completeness
const r = generateReport(hot);
assert(r.sections.length === 25, "report has 25 sections");
assert(r.verdict.length === 10, "verdict has 10 items");
assert(r.opportunities.length >= 5, "5+ opportunities");
assert(r.copyPath.length >= 4 && r.dna.length >= 4, "copy path & dna");

console.log(process.exitCode ? "\nSOME TESTS FAILED ❌" : "\nALL TESTS PASSED ✅");

/* ── AI PM Learning OS tests ─────────────────────────────────────────── */
import { buildProductDna, buildFiveLayers, buildHiddenNeeds, buildJTBD, buildEvidence, buildAiNative, buildPmVsUser, buildChallenges, buildInterviewQuestions, buildOpinionFrame, buildContentPack, buildVideoScript, buildPrd, buildCaseStudy, abilityGapRecommendation, emptyAbilities } from "../src/lib/learning";

const sample = PROJECTS.find((p) => p.slug === "dify")!;

assert(buildProductDna(sample).length === 11, "DNA chain 11 nodes");
assert(buildFiveLayers(sample).userProblem.includes("Layer 01"), "five layers L1");
assert(Object.keys(buildHiddenNeeds(sample)).length === 4, "hidden needs 4 levels");
assert(buildJTBD(sample).when.startsWith("When"), "JTBD when");
assert(buildEvidence(sample).length === 4, "evidence 4 items");
assert(buildAiNative(sample).before.includes("AI Before"), "AI before");
assert(buildPmVsUser(sample).pmView.includes("产品经理"), "PM view");
for (const level of ["beginner", "intermediate", "advanced", "expert"] as const) {
  assert(buildChallenges(sample, level).length === 4, `${level} has 4 challenges`);
  assert(buildChallenges(sample, level).every((c) => c.options.length === 4), `${level} options 4`);
}
assert(buildInterviewQuestions(sample).length === 8, "interview 8 questions");
assert(buildOpinionFrame(sample).ifPmSteps.length >= 3, "opinion steps");
const pack = buildContentPack(sample);
assert(pack.platforms.length === 8, "content 8 platforms");
assert(pack.score.total > 0 && pack.score.total <= 100, "content score range");
assert(buildVideoScript(sample).segments.length >= 8, "video script segments");
assert(buildPrd(sample).features.length >= 3, "prd features");
assert(buildCaseStudy(sample).projectId === "dify", "case study");
const gap = abilityGapRecommendation(emptyAbilities());
assert(gap.recommended.length >= 1, "gap recommendation");
