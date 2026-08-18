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
import { buildProductDna, buildFiveLayers, buildHiddenNeeds, buildJTBD, buildEvidence, buildAiNative, buildPmVsUser, buildChallenges, buildInterviewQuestions, buildOpinionFrame, buildContentPack, buildVideoScript, buildPrd, buildCaseStudy, abilityGapRecommendation, emptyAbilities, buildPmDeepAnalysis, buildWhyAi, buildAiNativeTest, buildBuildPlan } from "../src/lib/learning";
import { timeStatusOf, scenariosOf } from "../src/lib/scenarios";

const sample = PROJECTS.find((p) => p.slug === "dify")!;

assert(buildProductDna(sample).length === 14, "DNA chain 14 nodes");
assert(buildFiveLayers(sample).userProblem.includes("Layer 01"), "five layers L1");
assert(Object.keys(buildHiddenNeeds(sample)).length === 6, "hidden needs 6 levels");
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

assert(buildPmDeepAnalysis(sample).length === 15, "PM deep analysis 15 dims");
assert(Object.keys(buildWhyAi(sample)).length === 5, "why ai 5 answers");
assert(buildAiNativeTest(sample).native.includes("AI Native"), "ai native test");
const plan = buildBuildPlan(sample);
assert(plan.architectureLayers.length === 5 && plan.steps.length === 3, "build plan layers+steps");
assert(plan.checklist.length >= 5 && plan.techStack.length >= 3, "build plan checklist");
assert(["2026NEW", "2026RISING", "2026ACTIVE", "2026RELEVANT"].includes(timeStatusOf(sample)), "time status");
assert(scenariosOf(sample).length >= 1, "scenarios");
assert(buildChallenges(sample, "beginner").every((c) => c.projectFacts && c.bestPractice && c.expertReview.good), "challenge enrichment");

/* ── Reverse Engineering OS tests ─────────────────────────────────────── */
import { buildReverseEngineering, buildIntelligenceReport, buildMyProjectReport } from "../src/lib/reverse";
import { secondaryScenariosOf } from "../src/lib/scenarios";

const re = buildReverseEngineering(sample);
assert(re.productDnaFlow.length >= 12, "reverse: product DNA flow");
assert(re.userJourney.length === 15, "reverse: user journey 15 steps");
assert(re.implementationPath.length >= 12, "reverse: impl path steps");
assert(re.implementationPath.every((x) => ["Confirmed", "Inferred", "Hypothesis", "Unknown"].includes(x.evidence)), "reverse: evidence mode");
assert(re.sourceArchitecture.coreModules.length >= 4, "reverse: core modules");
assert(re.featureToCode.length >= 4, "reverse: feature→code map");
assert(re.techStackExplained.length >= 5, "reverse: tech choices explained");
assert(re.productToTech.feature.length > 0, "reverse: product→tech map");
assert(re.ifWerePm.keep.length >= 2 && re.ifWerePm.notDo.length >= 1, "reverse: if were pm");
assert(re.mvpReverse.mvp.length >= 3 && re.mvpReverse.scale.length >= 1, "reverse: mvp reverse");
assert(re.productDecisions.length >= 4, "reverse: decisions");
assert(re.businessOpportunities.length === 10, "reverse: 10 opportunities");
assert(re.industries.length === 10, "reverse: 10 industries");
assert(re.competitors.length === 4, "reverse: 4 competitor types");
assert(re.valueScores.length === 10, "reverse: 10 value scores");
assert(re.aiArchitecture.length >= 12, "reverse: ai architecture components");
assert(re.learningValue.length >= 5, "reverse: learning value");
assert(re.mediaValue.title.length > 0, "reverse: media value");

const report = buildIntelligenceReport(sample);
assert(report.length === 40, "reverse: 40-section report");
assert(report[0].title === "Executive Summary" && report[39].title === "Final Score", "reverse: report 01 & 40");

const my = buildMyProjectReport(sample);
assert(my.whyStarred.length > 0 && my.focusLearn.length >= 3, "reverse: my project report");
assert(secondaryScenariosOf(sample).length >= 1, "reverse: secondary scenarios");

/* ── Live data layer tests (pure helpers) ─────────────────────────────── */
import { liveStatus, starsPerDay, categoryQueries, type LiveRepo } from "../src/lib/live";

const liveRepo = (created: string, updated: string, stars: number): LiveRepo => ({
  fullName: "a/b", name: "b", owner: "a", stars, forks: 0, openIssues: 0, language: "Python",
  description: "d", topics: [], createdAt: created, updatedAt: updated, homepage: null, license: null,
});
assert(liveStatus(liveRepo("2026-01-01", "2026-08-01", 100)) === "2026NEW", "live: 2026 created → New");
assert(liveStatus(liveRepo("2024-01-01", "2026-08-01", 100)) === "2026ACTIVE", "live: updated 2026 → Active");
assert(liveStatus(liveRepo("2024-01-01", "2024-05-01", 100)) === "2026RELEVANT", "live: stale → Relevant");
const spd = starsPerDay(liveRepo("2025-08-18", "2026-08-18", 365));
assert(spd > 0.9 && spd < 1.1, "live: stars per day ~1 (365 stars in ~365 days)");
assert(categoryQueries("agent").length >= 1 && categoryQueries("agent")[0].includes("topic:ai-agent"), "live: category queries");
assert(categoryQueries("bogus" as any).length >= 1, "live: fallback query");

/* ── Master Reverse Engineering tests ─────────────────────────────────── */
import { buildMasterReport, buildFactSheet, buildKillerFeature, buildBeforeAfter, buildAiValueMap, buildFeatureDependency, buildTechChallenges, buildProductChallenges, buildProduct2, buildCloningPlan, buildThreeConclusions, buildPanorama, buildDirectorView } from "../src/lib/master";

const master = buildMasterReport(sample);
assert(master.length === 40, "master: 40-section report");
assert(master[0].title.includes("FACT SHEET") && master[39].title.includes("Final"), "master: first/last sections");
assert(buildFactSheet(sample).length >= 10, "master: fact sheet");
assert(buildKillerFeature(sample).feature.length > 0, "master: killer feature");
assert(Object.keys(buildBeforeAfter(sample)).length === 6, "master: before/after");
assert(buildAiValueMap(sample).length === 4, "master: AI value map 4 tiers");
assert(buildFeatureDependency(sample).length === 4, "master: dependency paths");
assert(buildTechChallenges(sample).length >= 5, "master: tech challenges");
assert(buildProductChallenges(sample).length >= 4, "master: product challenges");
assert(buildProduct2(sample).newProduct.length > 0, "master: product 2.0");
assert(buildCloningPlan(sample).timeline.includes("天"), "master: cloning plan");
assert(Object.keys(buildThreeConclusions(sample)).length === 3, "master: three conclusions");
assert(buildPanorama(sample).length >= 14, "master: panorama nodes");
const dv = buildDirectorView(sample);
assert(dv.boundary.inScope.length >= 2 && dv.boundary.outScope.length >= 1, "master: director boundary");
assert(dv.pain.deep.length > 0, "master: director pain");
assert(dv.cases.length >= 3, "master: director cases");

/* ── Source-code intelligence tests (pure parts) ──────────────────────── */
import { buildSourceIntel } from "../src/lib/source";
import { buildSourceMasterReport, buildSourcePanorama, buildSourceDirectorView } from "../src/lib/sourceMaster";

const fakeRepo = { fullName: "acme/awesome-ai", owner: "acme", name: "awesome-ai", description: "AI 助手", language: "TypeScript", topics: ["ai", "llm"], stars: 1234, forks: 56, openIssues: 7, createdAt: "2026-01-15", updatedAt: "2026-08-01", homepage: null, license: "MIT" };
const fakeReadme = `# Awesome AI\n\n一个 AI 助手工具\n\n## Features\n- 智能问答\n- RAG 检索\n- Agent 规划\n`;
const fakeManifest = { file: "package.json", text: '{"dependencies":{"openai":"^1.0.0","langchain":"^0.2","chromadb":"^1.0"}}' };
const fakeTree = ["src/app/page.tsx", "src/components/Chat.tsx", "api/route.ts", "agents/planner.ts", "retrieval/rag.ts", "data/db.ts", "tests/chat.test.ts"];

const srcIntel = buildSourceIntel(fakeRepo, { readme: fakeReadme, manifest: fakeManifest, tree: fakeTree });
assert(srcIntel.tagline.includes("Awesome AI"), "source: tagline from README");
assert(srcIntel.features.length >= 2, "source: features from README");
assert(srcIntel.techStack.includes("TypeScript"), "source: language in stack");
assert(srcIntel.aiComponents.some((a) => /LLM|Agent|向量/.test(a)), "source: AI components detected");
assert(srcIntel.moduleMap.length >= 3, "source: module map");
assert(srcIntel.featureToCode.length >= 2, "source: feature→code");
assert(srcIntel.treeSource === "tree", "source: tree source");

const srcMaster = buildSourceMasterReport(fakeRepo, srcIntel);
assert(srcMaster.length === 40, "source: 40-section master report");
assert(srcMaster[20].title.includes("Feature → Code"), "source: feature→code section");
assert(buildSourcePanorama(fakeRepo, srcIntel).length >= 14, "source: panorama");
const srcDir = buildSourceDirectorView(fakeRepo, srcIntel);
assert(srcDir.boundary.inScope.length >= 2 && srcDir.cases.length >= 3, "source: director view");

/* ── Open-source license policy tests ─────────────────────────────────── */
import { isOpenSourceLicense } from "../src/lib/licenses";
assert(isOpenSourceLicense("MIT") && isOpenSourceLicense("Apache-2.0") && isOpenSourceLicense("AGPL-3.0"), "license: open ok");
assert(isOpenSourceLicense("mit") && isOpenSourceLicense("apache-2.0"), "license: lowercase ok");
assert(!isOpenSourceLicense("Proprietary") && !isOpenSourceLicense("Meta Community") && !isOpenSourceLicense("Fair Code") && !isOpenSourceLicense("Stability AI Community"), "license: closed excluded");
assert(!isOpenSourceLicense(undefined) && !isOpenSourceLicense(""), "license: unknown excluded");
