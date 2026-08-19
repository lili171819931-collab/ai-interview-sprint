"use client";
import { useCallback, useState } from "react";
import { Check, Circle, GraduationCap, Lightbulb, MessageCircleQuestion, Target, GitBranch, Eye, BrainCircuit, ListTree } from "lucide-react";
import { LEARNING_STEPS, type Challenge, type Project, type RequirementNode } from "@/lib/types";
import { buildChallenges, buildFiveLayers, buildHiddenNeeds, buildJTBD, buildRequirementTree, buildEvidence, buildAiNative, buildPmVsUser } from "@/lib/learning";
import { getProjectCompletion, getProjectProgress, recordChallenge, setStep } from "@/lib/learningStore";

export function LearningMode({ project }: { project: Project }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const progress = getProjectProgress(project.slug);
  const completion = getProjectCompletion(project.slug);

  const needs = buildHiddenNeeds(project);
  const jtbd = buildJTBD(project);
  const evidence = buildEvidence(project);
  const aiNative = buildAiNative(project);
  const pmVsUser = buildPmVsUser(project);
  const tree = buildRequirementTree(project);
  const layers = buildFiveLayers(project);

  return (
    <div className="space-y-6">
      {/* Learning completion */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <GraduationCap size={17} className="text-[#7dd3fc]" />
          <span className="text-[14px] font-bold text-white">学习而不是收藏 · 完成度</span>
          <span className="chip chip-accent ml-auto num">{completion}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#141e33] overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-[#4f8cff] to-[#34d399]" style={{ width: `${completion}%` }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {LEARNING_STEPS.map((s) => {
            const done = !!progress[s.id];
            return (
              <button
                key={s.id}
                onClick={() => { setStep(project.slug, s.id, !done); refresh(); }}
                className={`chip cursor-pointer ${done ? "!text-emerald-300 !border-emerald-400/40 !bg-emerald-400/10" : ""}`}
              >
                {done ? <Check size={12} /> : <Circle size={12} />} {s.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-[11.5px] text-[#5b6885]">每完成一个步骤，都会提升你的能力评分（见「我的 AI PM 能力」）。收藏 ≠ 学习完成。</div>
      </div>

      {/* Socratic Challenge */}
      <ChallengeBoard project={project} />

      {/* Hidden needs */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><Target size={16} className="text-[#fbbf24]" /><span className="text-[14px] font-bold text-white">Hidden Needs Detector · 需求挖掘训练</span></div>
        <div className="space-y-2.5">
          {[
            ["surface", "表层需求", "#8b98b3"],
            ["functional", "功能需求", "#7dd3fc"],
            ["scenario", "场景需求", "#34d399"],
            ["core", "核心需求", "#fbbf24"],
            ["deep", "深层需求", "#f472b6"],
            ["latent", "潜在需求", "#c084fc"],
          ].map(([k, label, color]) => (
            <div key={k} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
              <div className="text-[11.5px] font-semibold mb-1" style={{ color }}>{label}</div>
              <div className="text-[13px] text-[#aab6cd]">{needs[k as keyof typeof needs]}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[12px] text-[#5b6885]">提示：这个产品真正解决的可能不是它表面宣传的问题，而是「{needs.core.split("：")[1] ?? ""}」。</div>
      </div>

      {/* Requirement tree */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><ListTree size={16} className="text-[#34d399]" /><span className="text-[14px] font-bold text-white">需求树 · 从 Feature 到 Job</span></div>
        <RequirementTree nodes={tree} depth={0} />
        <div className="mt-3 text-[12px] text-[#5b6885]">训练目标：不断追问「为什么」，最终找到用户的 Job，而不是停留在功能。</div>
      </div>

      {/* JTBD */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><GitBranch size={16} className="text-[#a78bfa]" /><span className="text-[14px] font-bold text-white">JTBD · Jobs To Be Done</span></div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { k: "When", v: jtbd.when },
            { k: "I want", v: jtbd.want },
            { k: "So that", v: jtbd.soThat },
          ].map((x) => (
            <div key={x.k} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
              <div className="text-[11.5px] font-bold text-[#a78bfa] mb-1">{x.k}</div>
              <div className="text-[12.5px] text-[#aab6cd]">{x.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 text-[12.5px] text-[#8b98b3]">
          <div>{jtbd.functional}</div>
          <div>{jtbd.emotional}</div>
          <div>{jtbd.social}</div>
        </div>
      </div>

      {/* Evidence */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><Eye size={16} className="text-[#f87171]" /><span className="text-[14px] font-bold text-white">用户需求证据 · Evidence-Based PM</span></div>
        <div className="space-y-2">
          {evidence.map((e, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
              <span className={`chip shrink-0 ${e.type === "Evidence" ? "!text-emerald-300 !border-emerald-400/40" : e.type === "Inference" ? "!text-amber-300 !border-amber-400/40" : "!text-rose-300 !border-rose-400/40"}`}>{e.type}</span>
              <div>
                <div className="text-[12px] text-[#7dd3fc]">{e.source}</div>
                <div className="text-[12.5px] text-[#aab6cd] mt-0.5">{e.claim}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[12px] text-[#5b6885]">学会区分 Evidence / Inference / Hypothesis，做一个「证据驱动」的产品经理。</div>
      </div>

      {/* AI Native */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><BrainCircuit size={16} className="text-[#2dd4bf]" /><span className="text-[14px] font-bold text-white">AI Native Product Analysis · AI 如何改变产品</span></div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { k: "AI Before", v: aiNative.before, c: "#8b98b3" },
            { k: "AI After", v: aiNative.after, c: "#7dd3fc" },
            { k: "AI Native", v: aiNative.native, c: "#34d399" },
          ].map((x) => (
            <div key={x.k} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
              <div className="text-[11.5px] font-bold mb-1" style={{ color: x.c }}>{x.k}</div>
              <div className="text-[12.5px] text-[#aab6cd]">{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PM vs User */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><MessageCircleQuestion size={16} className="text-[#60a5fa]" /><span className="text-[14px] font-bold text-white">PM 视角 vs 普通用户视角</span></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
            <div className="text-[11.5px] font-bold text-[#8b98b3] mb-1">普通用户</div>
            <div className="text-[12.5px] text-[#aab6cd]">{pmVsUser.userView}</div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
            <div className="text-[11.5px] font-bold text-[#7dd3fc] mb-1">产品经理</div>
            <div className="text-[12.5px] text-[#cfe0ff]">{pmVsUser.pmView}</div>
          </div>
        </div>
      </div>

      {/* Five layers */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-[#c084fc]" /><span className="text-[14px] font-bold text-white">AI 产品五层拆解模型</span></div>
        <div className="space-y-2">
          {Object.values(layers).map((l, i) => (
            <div key={i} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5 text-[12.5px] text-[#aab6cd]">{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChallengeBoard({ project }: { project: Project }) {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "expert">("beginner");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [tick, setTick] = useState(0);

  const challenges: Challenge[] = buildChallenges(project, level);
  const c = challenges[Math.min(idx, challenges.length - 1)];

  const choose = (optId: string) => {
    setPicked(optId);
    const opt = c.options.find((o) => o.id === optId);
    recordChallenge({ slug: project.slug, challengeId: c.id, correct: !!opt?.best, level, skill: c.skill, at: new Date().toISOString() });
    setRevealed(true);
    setTick((t) => t + 1);
  };

  const next = () => {
    setPicked(null);
    setRevealed(false);
    setIdx((i) => (i + 1) % challenges.length);
  };

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <MessageCircleQuestion size={16} className="text-[#7dd3fc]" />
        <span className="text-[14px] font-bold text-white">AI PM Challenge · Socratic Product Learning</span>
        <span className="ml-auto text-[11.5px] text-[#5b6885]">先思考，再看答案 — 共 {challenges.length} 题</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(["beginner", "intermediate", "advanced", "expert"] as const).map((l) => (
          <button key={l} onClick={() => { setLevel(l); setIdx(0); setPicked(null); setRevealed(false); }} className={`chip cursor-pointer ${level === l ? "chip-accent" : ""}`}>
            {l === "beginner" ? "Beginner" : l === "intermediate" ? "Intermediate" : l === "advanced" ? "Advanced" : "Expert"}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="chip">训练：{c.skill}</span>
          <span className="text-[11px] text-[#5b6885]">Q{idx + 1}/{challenges.length}</span>
        </div>
        <div className="text-[14.5px] font-semibold text-white leading-relaxed">{c.question}</div>
        <div className="text-[12px] text-[#5b6885] mt-1.5">💡 {c.hint}</div>

        <div className="grid gap-2 mt-4">
          {c.options.map((o) => {
            const isPicked = picked === o.id;
            const showResult = revealed;
            const cls = !showResult
              ? "border-[#1c2942] hover:border-[#2c4370] hover:bg-[#16233d]"
              : o.best
                ? "border-emerald-400/60 bg-emerald-400/10"
                : isPicked
                  ? "border-rose-400/60 bg-rose-400/10"
                  : "border-[#1c2942] opacity-60";
            return (
              <button key={o.id} disabled={revealed} onClick={() => choose(o.id)} className={`text-left px-4 py-3 rounded-xl border bg-[#0e1626] text-[13px] text-[#cfe0ff] transition-colors ${cls}`}>
                {showResult && o.best ? "✅ " : showResult && isPicked ? "❌ " : ""}{o.text}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-4 rounded-xl bg-[#101a2e] border border-[#16213a] p-4 space-y-3">
            <div className="text-[12px] font-semibold text-[#7dd3fc]">AI 对比分析 · 你的答案 vs 项目事实 vs AI PM Expert vs 行业最佳实践</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#8b98b3]"><b className="text-[#34d399]">项目事实：</b>{c.projectFacts}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#8b98b3]"><b className="text-[#a78bfa]">行业最佳实践：</b>{c.bestPractice}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#34d399]"><b>Good：</b>{c.expertReview.good}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#fbbf24]"><b>Missing：</b>{c.expertReview.missing}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#f87171]"><b>Wrong：</b>{c.expertReview.wrong}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#7dd3fc]"><b>Deeper Insight：</b>{c.expertReview.deeper}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-[12.5px] text-[#cfe0ff]">✓ AI PM Expert：{c.expertReview.bestAnswer}</div>
            <div className="text-[12.5px] text-[#5b6885]">为什么：{c.expertReview.why} · Key Insight：{c.expertReview.keyInsight}</div>
            <button onClick={next} className="mt-1 h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white hover:bg-[#1f3158]">下一题</button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequirementTree({ nodes, depth }: { nodes: RequirementNode[]; depth: number }) {
  return (
    <div className={`space-y-2 ${depth > 0 ? "ml-6 border-l-2 border-[#1c2942] pl-4" : ""}`}>
      {nodes.map((n, i) => (
        <div key={i} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
          <div className="text-[11.5px] font-bold text-[#34d399]">{n.question}</div>
          <div className="text-[12.5px] text-[#cfe0ff] mt-0.5">{n.answer}</div>
          {n.children.length > 0 && <RequirementTree nodes={n.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}
