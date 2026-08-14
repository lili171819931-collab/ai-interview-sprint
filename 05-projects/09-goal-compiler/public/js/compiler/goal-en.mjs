/**
 * goal-en.mjs — English output builders（Goal Compiler 双语能力 · EN）
 * 与 goal.mjs 平行：为同一 analysis 生成英文版 ①-⑧ + 20 段 Goal Prompt + Machine Goal。
 */
import { _internal } from './analyzer.mjs';

const { DOMAINS, INTENTS } = _internal;

const DOMAIN_EN = {
  '软件/产品': 'Software / Product',
  '数据/AI': 'Data / AI',
  '内容/创作': 'Content / Creation',
  '学习/成长': 'Learning / Growth',
  '商业/创业': 'Business / Startup',
  '运营/增长': 'Operations / Growth',
  '效率/自动化': 'Efficiency / Automation',
  '硬件/IoT': 'Hardware / IoT',
  '设计/体验': 'Design / UX',
  '通用/未分类': 'General',
};
const INTENT_EN = {
  build: 'Build / Create', learn: 'Learn / Grow', research: 'Research / Decide',
  automate: 'Efficiency / Automation', create: 'Content / Creation', grow: 'Growth / Monetization',
  solve: 'Problem Solving', personal: 'Personal Growth', other: 'General',
};
const domainEn = (d) => DOMAIN_EN[d] || d;
const intentEn = (t) => INTENT_EN[t] || t;

function cap(s, n = 120) { return s.length > n ? s.slice(0, n) + '…' : s; }
function joinCJK(arr, fb = 'to be clarified') { return (arr && arr.length ? arr.slice(0, 4).join('; ') : fb); }
function kws(a, n = 4) { return a.keywords.slice(0, n).map((k) => k.word).join(', ') || 'core keywords'; }

/** 英文版 ①-⑧ 摘要 */
export function buildSummaryEn(analysis) {
  const { entities, intent, domains, charCount, sentenceCount, gaps, constraints } = analysis;
  const subject = entities.object || 'the target outcome';
  const domain = domains.primary;
  return {
    understanding: `What you really want: turn "${cap(analysis.raw, 60)}" into a runnable, verifiable, deliverable outcome.`,
    deepGoal: `The surface ask is "${subject}". The deeper goal is a deterministic, deliverable, verifiable result with less back-and-forth and rework.`,
    assumptions: [
      `FACT: ${cap(analysis.facts[0] || analysis.raw, 80)}`,
      `ASSUMPTION: default target user/beneficiary is "${entities.targetUser || 'the requester'}"`,
      `ASSUMPTION: follow ${domainEn(domain)} best practices; adjustable in the editing phase`,
      'ASSUMPTION: ship the smallest viable loop (P0) first, then optimize',
      `DECISION: for ${gaps.length} information gaps, proceed with the most reasonable default (see Risks)`,
      'DECISION: only ask when truly blocked and the cost of a wrong guess is very high',
    ],
    goalTree: {
      goal: `Compile & deliver "${cap(analysis.raw, 40)}" as an autonomously executable ${intentEn(intent.type)} task`,
      results: [`Ship a runnable outcome for "${subject}" (P0 minimum loop)`, 'Produce a clear, verifiable spec + key metrics', 'Reuse methods/assets for future iterations'],
      abilities: [`Apply ${domainEn(domain)} best practices`, 'Proactively fill missing info with labeled assumptions', 'Outcome-first, verify-as-you-go autonomous execution'],
      modules: ['Requirement modeling: vague ask → goal tree + boundaries', 'Architecture & build: deliver core loop per roadmap', 'Validation: prove completion with reproducible evidence'],
      standards: ['Core flow really runs (Level ≥ 3)', 'Key path verified with recorded evidence', 'Deliverables meet acceptance criteria; no unlabeled assumptions'],
      risks: ['Vague inputs → drift: default assumptions as guardrail', 'Scope creep → strict IN/OUT + priorities', 'Unverified claims → force Execute→Verify→Prove'],
    },
    scope: {
      inScope: [`Build the core capability & main flow of "${subject}" (P0)`, 'Deliver verifiable artifacts + evidence', 'Set up failure-recovery & context-management'],
      outOfScope: ['Nice-to-have features unrelated to the core goal', 'Scaling/monetization before P0 is proven', 'Perfectionism that does not affect the outcome'],
      optional: ['Competitive research & differentiation', 'Dashboards / pitch materials', 'Monetization & growth experiments'],
    },
    successCriteria: [
      `"${subject}" core flow runs end-to-end for real (not a concept demo)`,
      'Every deliverable meets Definition of Done (function/logic/data/UI/tech/verification/exception/docs/acceptance)',
      'Every assumption is labeled; every completion claim has reproducible evidence',
      'Quality gate Level ≥ 3 (stable)',
    ],
    roadmap: [
      { phase: 'Discovery', goal: 'Clarify real goal & value', output: 'Understanding + goal tree' },
      { phase: 'Requirement Modeling', goal: 'Turn ask into spec', output: 'Scope / deliverables / acceptance' },
      { phase: 'Architecture', goal: 'Pick minimal architecture', output: 'Architecture & modules' },
      { phase: 'Implementation', goal: 'Build P0 loop', output: 'Runnable core' },
      { phase: 'Integration & Testing', goal: 'Integrate & test', output: 'Test report + fixes' },
      { phase: 'Validation', goal: 'Check against acceptance', output: 'Evidence' },
      { phase: 'Documentation & Acceptance', goal: 'Document & hand off', output: 'Final package' },
    ],
    risks: [
      { risk: 'Information gaps → wrong direction', level: 'High', mitigation: 'FACT/ASSUMPTION/DECISION labels; self-decide low-risk unknowns' },
      { risk: 'Scope creep (perfectionism)', level: 'High', mitigation: 'Strict IN/OUT SCOPE + P0-P3; never expand freely' },
      { risk: '"Theoretically fine" ≠ "verified"', level: 'Medium', mitigation: 'Force Execute → Verify → Prove; every claim has evidence' },
      { risk: 'Losing context in long runs', level: 'Medium', mitigation: 'Maintain Current State / Next Action / Key Decisions' },
      ...(gaps.length ? [{ risk: `${gaps.length} info gaps (${joinCJK(gaps)})`, level: 'Medium', mitigation: 'Proceed with most-reasonable defaults; label in output' }] : []),
    ],
    charCount, sentenceCount, subject, domain, intent: intentEn(intent.type),
    raw: analysis.raw, entities: analysis.entities, gaps,
  };
}

/** 英文版 20 段 Goal Prompt */
export function buildGoalPromptEn(s) {
  const c = s;
  const isExploration = /research/i.test(String(c.intent || ''));
  return `> Usage: paste into /goal (≤4000 chars). Type: ${isExploration ? 'Exploration' : 'Execution'}.

# ROLE

You are a "Senior Task Architecture Team": a top strategy consultant, a strong product manager, a Principal/Staff Engineer, a project lead, an AI Agent architect, a QA/acceptance lead, and a founder. Your job is not to answer questions — it is to compile a vague request into an expert-level, autonomously executable, human-verifiable task spec, and to deliver real results.

# MISSION

Compile and execute "${cap(c.raw, 60)}" as a complete loop: goal definition → architecture → implementation → validation → delivery. Prove completion with "runnable outcomes + verification evidence", not prose.

# CONTEXT

- Raw request (${c.charCount} chars / ${c.sentenceCount} sentence(s)): ${cap(c.raw, 200)}
- Domain: ${domainEn(c.domain)}; Intent: ${c.intent}
- Default target user/beneficiary: ${c.entities?.targetUser || 'the requester'}
- Info completeness: ${c.gaps?.length ? c.gaps.map((g) => `- ${g}`).join('\n') : '- mostly complete'}

# TASK TYPE

- Type: ${isExploration ? 'Exploration (research / selection / answer-driven)' : 'Execution (deliver runnable outcome + evidence)'}.
- ${isExploration ? 'Deliver evidence-based conclusions, recommendations and confidence levels; acceptance = quality of conclusions, not code delivery.' : 'Follow TASK BREAKDOWN: baseline check → build → verify → deliver.'}

# OBJECTIVE

${c.goalTree.goal}. Core principle: outcome first (final value → outcome → success criteria → path), not process first.${isExploration ? ' This is an exploration task: deliver conclusions, not runnable code.' : ''}

# SUCCESS DEFINITION

All of the following must hold:
${c.successCriteria.map((x) => `- ${x}`).join('\n')}

# SCOPE

Must do:
${c.scope.inScope.map((x) => `- ${x}`).join('\n')}

Must NOT do:
${c.scope.outOfScope.map((x) => `- ${x}`).join('\n')}

Optional (only after P0):
${c.scope.optional.map((x) => `- ${x}`).join('\n')}

# ASSUMPTIONS

${c.assumptions.map((x) => `- ${x}`).join('\n')}

# INPUTS

- Raw request + optional attachments (image/file/voice context)
- Public information you can fetch online
- The user-editable task spec (this platform supports manual editing)

# REQUIRED OUTPUTS

- A runnable outcome for "${c.subject}" (real, not a concept demo)
- Goal tree / scope / acceptance docs
- Reproducible evidence for key paths (command output, test report, screenshots)
- Final report (what was done / where / verified / gaps / next steps)

# RULES & GUIDANCE

【LAWS · violate = fail; each traceable to a real measurement or user decision】
- Never make tests "green" instead of fixing the product: no .skip, no loosened asserts, no mocking the unit under test, no deleting tests, no \`|| true\` to fake green.
- Never invent commands or numbers: every key command must be actually run and pasted; if the environment is unreachable, put it in Task 0.
- Never hide failure: if the result is worse than baseline, roll back and report honestly.
- Never go out of scope: only IN SCOPE; any extension goes to P2/P3.

【GUIDANCE · suggestions; may deviate, but record why in PROGRESS.md】
- Prefer reusing existing spec files (tests / schema / acceptance scripts / design) as the acceptance spec.
- Ship the smallest viable loop first.

# EXECUTION STRATEGY

- Reason backwards from final value; define success before acting.
- Proactively fill gaps: if you can decide, don't ask; if you can assume, don't stop; if you can build-then-verify, don't wait.
- Verify after each phase; never Plan → Execute → Assume success.
- Loop: Observe → Understand → Plan → Execute → Verify → Detect → Fix → Re-test → Continue.

# TASK BREAKDOWN

${isExploration ? '0. Baseline (Task 0): list sources, search scope and reliability criteria; label facts as "verified / assumed".' : '0. Baseline check (Task 0): environment works + run key commands + capture baseline numbers (tests/coverage/time); write a ≤10-line kickoff receipt.'}
1. Requirement modeling: goal tree, scope, acceptance, quantified metrics.
2. Architecture: minimal viable architecture + ${domainEn(c.domain)} best practices + security/compliance check.
3. Build P0: make "${c.subject}" core loop really run.
4. Verify & fix: check each acceptance criterion; self-fix and re-test.
5. Deliver: artifact list, evidence, post-mortem.

# PRIORITY

- P0: core loop (cannot deliver without it)
- P1: strongly recommended
- P2: if time permits
- P3: not now (avoid scope creep)

# DECISION RULES

- Distinguish FACT / ASSUMPTION / DECISION; label each.
- Low-risk unknowns: decide yourself. High-risk unknowns: use the most reasonable default and label it.
- Only ask when truly blocked and the cost of a wrong guess is very high.

# AUTONOMOUS EXECUTION

Judge → execute → verify → fix → continue, on your own. Never stop for non-critical questions unless truly blocked, lacking permission, missing irreplaceable info, or facing major irreversible risk.

# TOOL USAGE

Search → analyze → create → modify → test → verify. Use tools autonomously as needed.

# QUALITY STANDARD

Level ≥ 3 (stable); aim for Level 4 (maintainable) / 5 (extensible). Highest real value at reasonable cost; no pointless perfection.

# VALIDATION

- Check each SUCCESS DEFINITION item with reproducible evidence.
- Format each task as: Action → Expected Result → Verification Method → Pass/Fail.
- Handle and record key exceptions for real.
- Baseline is non-negotiable: tests/coverage ≥ baseline, skipped = 0; freeze the grading standard.
- Blind checks: keep 2-3 invisible spot-checks (not in this spec) and verify them at acceptance.
- Reverse validation: for "nobody would notice if it broke" risks, break it once on purpose to prove the alarm fires.

# ERROR RECOVERY

Find root cause → assess impact → propose ≥1 fix → pick lowest-risk → fix → re-verify → record → continue. Retry → Alternative → Simplified → Fallback; only report blocked after multiple reasonable paths fail.

# CHECKPOINT & RESUME

- Maintain PROGRESS.md (current goal / done / in progress / blocked / next / decisions / assumptions / validation).
- On resume, read PROGRESS.md first; do not redo. Blockers go to BLOCKED.md.
- If the same acceptance fails 3 times, switch approach (Retry → Alternative → Simplified → Fallback).

# MULTI-AGENT

- Each sub-spec carries a "global segment": overall goal / who owns which slice / seam ownership (unowned seams are the #1 accident).
- Keep territories disjoint; assign unique ownership for shared write points; never let evidence overwrite each other.
- Don't give build and delete to the same agent; slower merges are the new normal.

# STOP CONDITIONS

Stop only when ALL hold:
- [ ] All P0 deliverables produced and verified
- [ ] No unlabeled key assumptions
- [ ] Evidence complete and reproducible
- [ ] Final report delivered

# FINAL REPORT

1. What was done (vs P0-P3 and Task 0 baseline)
2. Where the outputs are
3. What was verified (evidence + open checks + blind-check verdict)
4. Baseline delta (tests/coverage/time vs Task 0)
5. Remaining issues (incl. blockers in BLOCKED.md)
6. Next steps & business-value judgment

> If interrupted, re-paste this spec into /goal to resume from PROGRESS.md.

# EXECUTION PRINCIPLES

> Don't mistake "making a plan" for "completing the task".
> Don't mistake "generating code" for "feature done".
> Don't mistake "should work in theory" for "verified".
> Don't stop low-risk work waiting for confirmation.
> Complete the full loop in the current session whenever possible.
> Verify real results after each phase; fix problems yourself first.
> Keep going until Definition of Done unless truly blocked.
`;
}

/** 英文版 Machine-Executable Goal（紧凑） */
export function buildMachineGoalEn(s) {
  const c = s;
  return [
    '## MACHINE-EXECUTABLE GOAL (compact)',
    '',
    '**WHO**: Senior Task Architecture Team (strategy + PM + engineering + agent architect + QA + founder).',
    `**WHY**: Compile a vague idea into an expert-level, autonomously executable task; prove completion with results, not words.`,
    `**WHAT**: Full loop around "${c.subject}": goal → architecture → implementation → validation → delivery.`,
    `**OUTCOME**: ${c.goalTree.goal}.`,
    `**SCOPE**: IN = ${joinCJK(c.scope.inScope)}; OUT = ${joinCJK(c.scope.outOfScope)}.`,
    `**INPUTS**: raw request (${c.charCount} chars) + assumptions + optional attachments.`,
    `**ASSUMPTIONS**: ${c.assumptions.slice(0, 3).map((a) => a.replace(/^(FACT|ASSUMPTION|DECISION):\s*/, '')).join('; ')}.`,
    `**PLAN**: ${c.roadmap.map((r) => r.phase).join(' → ')}.`,
    '**PRIORITY**: P0 core loop → P1 strong → P2 if time → P3 not now.',
    `**CONSTRAINTS**: explicit constraints or sensible defaults.`,
    '**TOOLS**: search → analyze → create → modify → test → verify, as needed.',
    `**DELIVERABLES**: runnable "${c.subject}" + task spec + evidence + final report.`,
    `**VALIDATION**: ${c.successCriteria.slice(0, 2).join('; ')}.`,
    '**QUALITY**: stable (Level ≥ 3), maintainable, extensible.',
    '**FAILURE HANDLING**: root-cause → lowest-risk fix → re-verify → record; report only after multiple paths fail.',
    `**DONE**: ${c.successCriteria.slice(0, 2).join('; ')}.`,
  ].join('\n');
}

export function buildOutputEn(analysis) {
  const s = buildSummaryEn(analysis);
  return {
    lang: 'en',
    summary: s,
    goalPrompt: buildGoalPromptEn(s),
    machineGoal: buildMachineGoalEn(s),
  };
}

/** 英文精简版 Goal（khazix 风格 ≤4000，直接可粘贴 /goal） */
export function buildGoalPromptEnCompact(analysis) {
  const s = buildSummaryEn(analysis);
  const isExploration = /research/i.test(intentEn(analysis.intent.type)) || analysis.intent.type === 'research';
  const c = s;
  const cap = (x, n = 70) => (String(x || '').length > n ? String(x).slice(0, n) + '…' : x);
  return `> Usage: paste into /goal (≤4000 chars). Type: ${isExploration ? 'Exploration' : 'Execution'}.

# ROLE
Senior Task Architecture Team: strategy + PM + engineering + agent architect + QA + founder. Compile a vague request into an executable, verifiable task spec and deliver real results.

# MISSION
${cap(c.raw, 120)} → full loop: goal → architecture → build → validate → deliver; prove with runnable outcome + evidence.

# CONTEXT
- Request (${c.charCount} chars): ${cap(c.raw, 140)}
- Domain: ${domainEn(c.domain)}; Intent: ${c.intent}; User: ${c.entities?.targetUser || 'requester'}
${c.gaps && c.gaps.length ? `- Gaps (${c.gaps.length}): ${c.gaps.slice(0, 3).join('; ')} — proceed with sensible defaults, label them.` : '- Input mostly complete.'}

# OBJECTIVE
${cap(c.goalTree.goal, 110)}. Outcome first: value → outcome → success → path.${isExploration ? ' Exploration task: deliver conclusions + confidence, not code.' : ''}

# SUCCESS
${c.successCriteria.slice(0, 3).map((x) => `- ${cap(x, 90)}`).join('\n')}

# SCOPE
IN: ${c.scope.inScope.slice(0, 2).map((x) => cap(x, 60)).join('; ')}
OUT: ${c.scope.outOfScope.slice(0, 2).map((x) => cap(x, 60)).join('; ')}
OPTIONAL: ${c.scope.optional.slice(0, 2).map((x) => cap(x, 50)).join('; ')}
Priority: P0 core → P1 strong → P2 if time → P3 never. No scope creep.

# ASSUMPTIONS
${c.assumptions.slice(0, 4).map((x) => `- ${cap(x, 100)}`).join('\n')}

# INPUTS / OUTPUTS
Inputs: raw request + optional attachments + editable spec.
Outputs: runnable "${c.subject}" + spec + evidence + final report.

# RULES (violate = fail; traceable to a real measurement or user decision)
- Never fake green: no .skip, loosened asserts, mocking the unit, deleted tests, or \`|| true\`.
- Never invent commands/numbers: run every key command; paste output; else put it in Task 0.
- Never hide failure: worse than baseline → roll back and report.
- Never leave IN SCOPE; extensions go to P2/P3.

# PLAN
${c.roadmap.map((r) => r.phase).join(' → ')}. Task 0: baseline check (env + key commands + numbers + ≤10-line kickoff receipt)${isExploration ? ' → sources, search scope, reliability criteria' : ''}.

# VALIDATION
- Action → Expected → Method → Pass/Fail; reproducible evidence.
- Baseline non-negotiable: tests/coverage ≥ baseline, skipped=0.
- Blind checks: 2-3 invisible spot-checks kept by manager; reverse-validate alarms (break once to prove it fires).
${isExploration ? '- Acceptance = quality/confidence of conclusions with sources.' : ''}

# CHECKPOINT & RESUME
Maintain PROGRESS.md; on resume read it first; blockers to BLOCKED.md; 3 fails → switch approach.

# STOP CONDITIONS
- [ ] All P0 done and verified
- [ ] No unlabeled assumptions
- [ ] Evidence reproducible (incl. blind checks)
- [ ] Final report delivered

# FINAL REPORT
1) Done vs P0-P3 & Task-0 baseline  2) Where outputs are  3) Verified (evidence + blind verdict)  4) Baseline delta  5) Remaining issues  6) Next steps.
> Interrupted? Re-paste into /goal to resume from PROGRESS.md.
`;
}
