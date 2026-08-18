"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Compass, Target, BookOpenCheck, MessageSquareText, ScrollText, PenLine, Megaphone, Briefcase, TrendingUp, ArrowRight } from "lucide-react";
import { averageAbility, abilityLabel, abilityGapRecommendation } from "@/lib/learning";
import { computeAbilities } from "@/lib/learningStore";
import {
  getProgress, getChallengeAnswers, getDecisions, getOpinions, getInterviews,
  getPortfolioCases, getPublishedContent, getJourney, subscribe, getProjectCompletion,
} from "@/lib/learningStore";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatStars } from "@/lib/engines";
import type { AbilityScores } from "@/lib/types";

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  "productThinking", "aiUnderstanding", "userResearch", "requirementAnalysis", "featureDesign",
  "aiAgent", "businessModel", "growth", "dataAnalysis", "communication",
];

const WEEK_PLAN = [
  { week: "Week 01", title: "Understand AI Products", focus: "每天分析 3 个项目 · 用户 / 痛点 / 场景 / 功能", link: "/rankings/stars" },
  { week: "Week 02", title: "Understand AI", focus: "LLM / RAG / Agent / MCP / Workflow / Tool Calling", link: "/discover?category=agent" },
  { week: "Week 03", title: "Product Design", focus: "PRD / User Flow / MVP / Feature Prioritization / UX", link: "/rankings/opportunity" },
  { week: "Week 04", title: "Business", focus: "SaaS / Monetization / Growth / GTM / Competitive Analysis", link: "/rankings/money" },
];

export default function LearnPage() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const abilities = computeAbilities();
  const avg = averageAbility(abilities);
  const gap = abilityGapRecommendation(abilities);
  const journey = getJourney();
  const progress = getProgress();
  const challenges = getChallengeAnswers();
  const decisions = getDecisions();
  const opinions = getOpinions();
  const interviews = getInterviews();
  const cases = getPortfolioCases();
  const content = getPublishedContent();

  const projectsStudied = Object.keys(progress).filter((slug) => {
  const steps = progress[slug];
  return steps ? Object.values(steps).some(Boolean) : false;
}).length;
  const started = Object.values(abilities).some((v) => v > 0);
  const week = Math.min(4, Math.ceil(journey.day / 7));
  const dayInWeek = journey.day % 7 === 0 ? 7 : journey.day % 7;

  const mission = [
    { n: 1, text: `分析 1 个 ${week >= 3 ? "SaaS/商业" : week === 2 ? "Agent" : "AI"} 项目`, link: `/rankings/${week >= 3 ? "money" : week === 2 ? "skills" : "opportunity"}` },
    { n: 2, text: "找出 3 个用户痛点", link: "/projects/ollama" },
    { n: 3, text: "找出 5 个核心功能", link: "/discover" },
    { n: 4, text: "判断为什么需要 AI", link: "/insights" },
    { n: 5, text: "找出一个商业化机会", link: "/rankings/opportunity" },
    { n: 6, text: "写出你的 PM 判断", link: "/portfolio" },
  ];

  const learningRank = PROJECTS.map((p) => ({ p, done: getProjectCompletion(p.slug) }))
    .filter((x) => x.done > 0)
    .sort((a, b) => b.done - a.done)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-2"><GraduationCap size={18} className="text-[#7dd3fc]" /><h1 className="text-xl font-bold text-white">My AI PM Journey · AI PM 学习中心</h1></div>
        <p className="text-[13px] text-[#8b98b3]">每天拆解一个优秀 AI 产品，用 GitHub 训练产品思维，30 天建立 AI 产品经理能力。</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <StatChip icon={Compass} label="已分析项目" value={projectsStudied} />
          <StatChip icon={Target} label="完成 Challenge" value={challenges.length} />
          <StatChip icon={ScrollText} label="决策记录" value={decisions.length} />
          <StatChip icon={PenLine} label="我的观点" value={opinions.length} />
          <StatChip icon={MessageSquareText} label="面试练习" value={interviews.length} />
          <StatChip icon={Briefcase} label="Portfolio 案例" value={cases.length} />
          <StatChip icon={Megaphone} label="发布内容" value={content.length} />
        </div>
      </div>

      {/* Ability radar */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-bold text-white">我的 AI PM 能力</span>
            <span className="text-[11.5px] text-[#5b6885]">Day {journey.day}</span>
          </div>
          {!started ? (
            <div className="text-center py-10 text-[13px] text-[#5b6885]">
              还没有学习记录。去任意项目页进入「AI PM 学习模式」，完成 Challenge 与拆解，能力雷达就会开始生长。
              <div className="mt-3"><Link href="/rankings/opportunity" className="chip chip-accent">开始第一个 Challenge →</Link></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-20 h-20 rounded-full bg-[#0c1322] border-2 border-[#2c4370] flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold num glow-text">{avg}</span>
                  <span className="text-[9px] text-[#5b6885]">AI PM SCORE</span>
                </div>
                <div className="space-y-1 flex-1">
                  {ABILITY_KEYS.slice(0, 5).map((k) => (
                    <AbilityRow key={k} label={abilityLabel(k)} value={abilities[k]} />
                  ))}
                </div>
                <div className="space-y-1 flex-1">
                  {ABILITY_KEYS.slice(5).map((k) => (
                    <AbilityRow key={k} label={abilityLabel(k)} value={abilities[k]} />
                  ))}
                </div>
              </div>
              <AbilityRadar abilities={abilities} />
            </>
          )}
        </div>

        <div className="space-y-4">
          {/* Gap recommendation */}
          <div className="panel p-6">
            <div className="text-[14px] font-bold text-white mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-[#34d399]" /> 能力缺口 → 项目推荐</div>
            {!started ? (
              <div className="text-[12.5px] text-[#5b6885]">完成学习任务后，这里会告诉你下一阶段最该补什么、去学哪些项目。</div>
            ) : (
              <>
                <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5 text-[13px]">
                  你最弱的维度是 <b className="text-[#f87171]">{gap.weakness}（{gap.score}/100）</b>，建议不要再泛泛地看 AI 工具，而是：
                </div>
                <div className="space-y-2 mt-3">
                  {gap.recommended.map((r) => (
                    <Link key={r.title} href={`/rankings/${r.kind}`} className="flex items-center justify-between rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5 hover:border-[#2c4370]">
                      <div>
                        <div className="text-[13px] font-semibold text-[#cfe0ff]">{r.title}</div>
                        <div className="text-[11.5px] text-[#5b6885]">{r.reason}</div>
                      </div>
                      <ArrowRight size={14} className="text-[#7dd3fc]" />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 学习而不是收藏 */}
          <div className="panel p-6">
            <div className="text-[14px] font-bold text-white mb-3 flex items-center gap-2"><BookOpenCheck size={15} className="text-[#fbbf24]" /> 学习而不是收藏</div>
            <div className="text-[12.5px] text-[#8b98b3] leading-relaxed">收藏 ≠ 学习完成。每个项目要走完：Saved → Study → Analyze → Challenge → Opinion → Publish → Portfolio。</div>
            <div className="mt-3">
              {learningRank.length === 0 ? (
                <div className="text-[12px] text-[#5b6885]">还没有完成过任何项目的学习步骤。</div>
              ) : (
                <div className="space-y-1.5">
                  {learningRank.map(({ p, done }) => (
                    <Link key={p.slug} href={`/projects/${p.slug}#pm-learning`} className="flex items-center gap-2 text-[12.5px]">
                      <span className="w-36 truncate text-[#cfe0ff]">{p.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#141e33] overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${done}%` }} /></div>
                      <span className="num text-[#5b6885] w-9 text-right">{done}%</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 30 Days Challenge */}
      <div className="panel p-6">
        <div className="text-[14px] font-bold text-white mb-3 flex items-center gap-2"><Target size={15} className="text-[#f472b6]" /> 30 Days AI PM Challenge · 当前第 {journey.day} 天</div>
        <div className="grid gap-3 md:grid-cols-4 mb-5">
          {WEEK_PLAN.map((w, i) => (
            <Link key={w.week} href={w.link} className={`rounded-xl border p-3.5 ${i + 1 === week ? "border-[#2c4370] bg-[#101a2e]" : "border-[#16213a] bg-[#0c1322]"}`}>
              <div className="text-[11px] font-bold text-[#7dd3fc]">{w.week}{i + 1 === week && " · 进行中"}</div>
              <div className="text-[13px] font-semibold text-white mt-0.5">{w.title}</div>
              <div className="text-[11px] text-[#5b6885] mt-1">{w.focus}</div>
            </Link>
          ))}
        </div>
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-semibold text-[#f472b6] mb-3">Today's Mission · Day {journey.day}（{WEEK_PLAN[week - 1].title} · 第 {dayInWeek} 天）</div>
          <div className="grid gap-2 md:grid-cols-2">
            {mission.map((m) => (
              <Link key={m.n} href={m.link} className="flex items-center gap-2.5 text-[13px] text-[#cfe0ff] hover:text-[#7dd3fc]">
                <span className="w-6 h-6 rounded-lg bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-[11px] font-bold num text-[#7dd3fc]">{m.n}</span>
                {m.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="chip !py-2">
      <Icon size={13} className="text-[#7dd3fc]" /> {label} <b className="num text-white">{value}</b>
    </div>
  );
}

function AbilityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[#8b98b3] w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#141e33] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#4f8cff] to-[#7c5cff]" style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] num text-[#aab6cd] w-7 text-right">{value}</span>
    </div>
  );
}

function AbilityRadar({ abilities }: { abilities: AbilityScores }) {
  const size = 300;
  const cx = size / 2, cy = size / 2, r = 110;
  const n = ABILITY_KEYS.length;
  const pt = (i: number, val: number) => {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (r * val) / 100;
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  };
  const poly = ABILITY_KEYS.map((k, i) => pt(i, abilities[k]).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[340px] mx-auto">
      {[25, 50, 75, 100].map((pct) => (
        <polygon key={pct} points={ABILITY_KEYS.map((_, i) => pt(i, pct).join(",")).join(" ")} fill="none" stroke="#1c2942" strokeWidth="1" />
      ))}
      {ABILITY_KEYS.map((k, i) => {
        const [x, y] = pt(i, 108);
        return <text key={k} x={x} y={y} textAnchor="middle" fontSize="9" fill="#8b98b3">{abilityLabel(k)}</text>;
      })}
      <polygon points={poly} fill="rgba(79,140,255,0.18)" stroke="#4f8cff" strokeWidth="2" />
      {ABILITY_KEYS.map((k, i) => {
        const [x, y] = pt(i, abilities[k]);
        return <circle key={k} cx={x} cy={y} r="3" fill="#7dd3fc" />;
      })}
    </svg>
  );
}
