"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, Send, Bot, RefreshCw } from "lucide-react";
import { answerQuery, type QueryAnswer } from "@/lib/query";
import { formatPct, formatSigned, formatStars } from "@/lib/engines";
import { CategoryChips } from "@/components/ui";

const EXAMPLES = [
  "找出最近30天增长最快、适合个人开发者、可以做副业、最好能SaaS化的AI项目",
  "最近有哪些值得做副业的AI项目？",
  "有哪些项目适合做Skill？",
  "给我找适合AI PM做Portfolio的项目",
  "哪些GitHub项目可以改造成SaaS？",
  "如果我只有一个人，最适合做哪个？",
];

export default function AskPage() {
  return (
    <Suspense fallback={<div className="panel p-12 text-center text-[#5b6885]">加载中…</div>}>
      <AskInner />
    </Suspense>
  );
}

function AskInner() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<QueryAnswer | null>(null);
  const [thinking, setThinking] = useState(false);
  const ranRef = useRef(false);

  const run = (text: string) => {
    setThinking(true);
    // Simulated agent latency so the "multi-agent consensus" feels real.
    setTimeout(() => {
      setAnswer(answerQuery(text));
      setThinking(false);
    }, 450);
  };

  useEffect(() => {
    const initial = params.get("q");
    if (initial && !ranRef.current) {
      ranRef.current = true;
      setQ(initial);
      run(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) run(q.trim());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 chip chip-accent mb-3"><Bot size={13} /> AI OPEN SOURCE ANALYST</div>
        <h1 className="text-2xl font-extrabold text-white">Ask AI · 智能分析师</h1>
        <p className="text-[13px] text-[#8b98b3] mt-1.5">不是普通聊天 — 查询平台数据 + 项目数据库 + 分析报告，给出可行动的推荐</p>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="用自然语言描述你的目标，例如：最近30天增长最快适合做副业的AI项目"
          className="flex-1 h-12 px-4 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[13.5px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
        />
        <button className="h-12 px-5 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-white font-semibold text-[13.5px] flex items-center gap-2 hover:opacity-90">
          <Send size={15} /> 分析
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => { setQ(ex); run(ex); }} className="chip hover:!text-[#7dd3fc] hover:!border-[#2c4370] text-left">{ex}</button>
        ))}
      </div>

      {thinking && (
        <div className="panel p-8 flex items-center justify-center gap-3 text-[#8b98b3]">
          <RefreshCw size={16} className="animate-spin text-[#4f8cff]" />
          正在执行 10-Agent 共识分析：Discovery → Classification → Repo → Product → Business → Growth → Startup → Content → Portfolio → Chief…
        </div>
      )}

      {answer && !thinking && (
        <div className="space-y-5">
          <div className="panel p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-[#7dd3fc]" />
              <span className="text-[12px] text-[#5b6885]">分析结果 · {answer.filtersNote}</span>
            </div>
            <p className="text-[14px] text-[#cfe0ff] leading-relaxed">{answer.summary}</p>
            <div className="mt-3 rounded-xl bg-[#101a2e] border border-[#2c4370] p-3 text-[12.5px] text-[#cfe0ff] leading-relaxed">{answer.directorSummary}</div>
            <div className="mt-4 space-y-4">
              {answer.recommendations.map((rec, i) => (
                <div key={i} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
                  <div className="whitespace-pre-line text-[13.5px] text-[#e7ecf5] leading-relaxed">{renderBold(rec)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-semibold text-white mb-3">Top 项目卡片</div>
            <div className="grid gap-3 md:grid-cols-2">
              {answer.projects.map(({ project, director }) => (
                <Link key={project.slug} href={`/projects/${project.slug}`} className="panel card-hover p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[14px] text-white truncate">{project.name}</span>
                    <span className="text-[12px] text-[#8b98b3] num">⭐{formatStars(project.stars)}</span>
                  </div>
                  <div className="text-[12px] text-[#5b6885] mt-0.5 line-clamp-2 min-h-[32px]">{project.tagline}</div>
                  <div className="mt-2 flex items-center gap-3 text-[11.5px] num">
                    <span className="text-emerald-300">↗ {formatSigned(project.growth30d)} ({formatPct((project.growth30d / (project.stars - project.growth30d)) * 100)})</span>
                    <span className="text-[#7dd3fc]">Opp {answer.projects.find((x) => x.project.slug === project.slug)!.scores.opportunity}</span>
                  </div>
                  <div className="mt-2"><CategoryChips project={project} limit={2} /></div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <VerdictChip verdict={director.verdict} />
                    <span className="chip">Score {director.overall}</span>
                    <span className="chip">押注 {director.bet}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 总监视角详情 */}
          <div className="panel p-5">
            <div className="text-[13px] font-bold text-white mb-3 flex items-center gap-2"><span className="text-[15px]">👔</span> AI 产品总监视角 · 逐项目判定</div>
            <div className="space-y-2.5">
              {answer.projects.map(({ project, director }) => (
                <div key={project.slug} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/projects/${project.slug}`} className="font-semibold text-white text-[13px] hover:text-[#7dd3fc]">{project.name}</Link>
                    <VerdictChip verdict={director.verdict} />
                    <span className="chip">Score {director.overall}/100</span>
                    <span className="chip">押注 {director.bet}</span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[12px] text-[#aab6cd]">
                    <div><b className="text-[#34d399]">Why It Wins：</b>{director.whyWins}</div>
                    <div><b className="text-[#f87171]">Why It Fails：</b>{director.whyFails}</div>
                    <div><b className="text-[#a78bfa]">Real Moat：</b>{director.realMoat}</div>
                    <div><b className="text-[#fbbf24]">Bet Why：</b>{director.betWhy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!answer && !thinking && (
        <div className="panel p-8 text-center text-[13px] text-[#5b6885]">
          输入一个问题，AI 会基于平台 72 个项目 × 30 分类 × 9 大榜单 × 25 节报告为你推荐。
        </div>
      )}
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-white">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}


function VerdictChip({ verdict }: { verdict: string }) {
  const color = verdict === "Strong Buy" || verdict === "Invest" ? "#34d399" : verdict === "Watch" ? "#fbbf24" : verdict === "Pivot" ? "#fb923c" : "#f87171";
  return <span className="chip !text-[10px]" style={{ color, borderColor: color + "66", background: color + "14" }}>👔 {verdict}</span>;
}
