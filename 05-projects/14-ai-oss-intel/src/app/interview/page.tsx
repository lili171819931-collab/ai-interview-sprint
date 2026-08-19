"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessagesSquare, BookOpenCheck, ChevronDown, ChevronUp } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { buildInterviewQuestions } from "@/lib/learning";
import { recordInterview, getInterviews, subscribe } from "@/lib/learningStore";
import type { InterviewQuestion, Project } from "@/lib/types";

const CATEGORIES = ["Product Sense", "User Research", "AI Product", "Metrics", "Growth", "Business", "Technical", "Strategy"] as const;

export default function InterviewPage() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  const interviews = getInterviews();

  const [slug, setSlug] = useState("dify");
  const project = PROJECTS.find((p) => p.slug === slug)!;
  const questions = useMemo(() => buildInterviewQuestions(project), [project]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<null | { scores: Record<string, number>; overall: number; feedback: string }>(null);
  const [bank, setBank] = useState(false);
  const [bankCat, setBankCat] = useState<(typeof CATEGORIES)[number] | "all">("all");

  const q = questions[Math.min(idx, questions.length - 1)];

  const submit = () => {
    const len = answer.trim().length;
    const hasKeywords = /用户|需求|痛点|增长|商业|指标|留存|转化|场景|验证/i.test(answer);
    const base = Math.min(88, 52 + Math.min(len / 12, 20) + (hasKeywords ? 14 : 2));
    const scores = {
      "Product Thinking": Math.min(95, base + 6),
      "AI Understanding": Math.min(95, base - 2),
      "Business Thinking": Math.min(95, base + 2),
      Communication: Math.min(95, base + 5),
    };
    const overall = Math.round((scores["Product Thinking"] + scores["AI Understanding"] + scores["Business Thinking"] + scores.Communication) / 4);
    recordInterview({ slug: project.slug, projectName: project.name, score: overall, at: new Date().toISOString() });
    setResult({ scores, overall, feedback: len < 20 ? "回答太短。结构化公式：用户 → 场景 → Job → 指标 → 验证。" : "不错！建议每次结尾加一句「我会通过 XX 验证这个判断」。", });
  };

  const bankQuestions = useMemo(() => {
    const all = PROJECTS.flatMap((p) => buildInterviewQuestions(p).map((qq) => ({ ...qq, projectName: p.name, slug: p.slug })));
    return bankCat === "all" ? all : all.filter((x) => x.category === bankCat);
  }, [bankCat]);

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-2"><MessagesSquare size={18} className="text-[#60a5fa]" /><h1 className="text-xl font-bold text-white">AI PM Interview Mode · 面试模式</h1></div>
        <p className="text-[13px] text-[#8b98b3]">AI 扮演 Product Director / AI Product Lead / Hiring Manager，用真实项目训练你的面试回答。</p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[12px] text-[#5b6885]">选择项目：</span>
          <select value={slug} onChange={(e) => { setSlug(e.target.value); setIdx(0); setAnswer(""); setResult(null); }} className="h-9 px-2.5 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[12.5px] text-[#aab6cd] focus:outline-none">
            {PROJECTS.slice(0, 40).map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
          <button onClick={() => setBank(!bank)} className="chip cursor-pointer ml-auto"><BookOpenCheck size={12} /> {bank ? "关闭题库" : "AI PM Interview Case Bank"}</button>
        </div>
        <div className="mt-2 text-[11.5px] text-[#5b6885]">已完成 {interviews.length} 次面试练习 · 最近成绩 {interviews.length > 0 ? `${interviews[interviews.length - 1].score}/100` : "—"}</div>
      </div>

      {bank ? (
        <div className="panel p-5">
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button onClick={() => setBankCat("all")} className={`chip cursor-pointer ${bankCat === "all" ? "chip-accent" : ""}`}>全部（{PROJECTS.length * 8} 题）</button>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setBankCat(c)} className={`chip cursor-pointer ${bankCat === c ? "chip-accent" : ""}`}>{c}</button>
            ))}
          </div>
          <div className="space-y-2">
            {bankQuestions.slice(0, 40).map((x) => (
              <QuestionRow key={x.id + x.slug} q={x} />
            ))}
          </div>
          <div className="mt-3 text-[11.5px] text-[#5b6885]">共 {bankQuestions.length} 题（截取前 40 题展示）· 全部题目可在项目页「求职 Portfolio 模式」逐题练习</div>
        </div>
      ) : (
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-white">面试官 · {project.name} · {q.category}</span>
            <span className="text-[11.5px] text-[#5b6885]">Q{idx + 1}/{questions.length}</span>
          </div>
          {!result ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4 text-[15px] font-semibold text-white leading-relaxed">“{q.question}”</div>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="用「用户 → 场景 → Job → 指标 → 验证」结构回答…" className="w-full min-h-[140px] px-3.5 py-3 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[13px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]" />
              <div className="flex gap-2">
                <button onClick={submit} className="h-10 px-5 rounded-lg bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-[13px] text-white font-semibold">提交 · AI 评分</button>
                <button onClick={() => setAnswer("")} className="h-10 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white">清空</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#101a2e] border border-[#16213a] p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {Object.entries(result.scores).map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
                      <div className="text-[11px] text-[#8b98b3]">{k}</div>
                      <div className="text-lg font-bold num text-[#7dd3fc]">{Math.round(v)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center"><span className="text-2xl font-extrabold num text-white">{result.overall}<span className="text-sm text-[#5b6885]">/100</span></span></div>
                <div className="mt-1 text-[12.5px] text-[#fbbf24]">{result.feedback}</div>
              </div>
              <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
                <div className="text-[11.5px] font-semibold text-[#7dd3fc] mb-1.5">参考回答（AI PM）</div>
                <div className="text-[12.5px] text-[#aab6cd] leading-relaxed">{q.modelAnswer}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setIdx((i) => (i + 1) % questions.length); setAnswer(""); setResult(null); }} className="h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white">下一题</button>
                <button onClick={() => setResult(null)} className="h-9 px-4 rounded-lg bg-transparent border border-[#1c2942] text-[12.5px] text-[#aab6cd]">重答此题</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionRow({ q }: { q: InterviewQuestion & { projectName: string; slug: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#16213a]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left">
        <span className="chip shrink-0">{q.category}</span>
        <span className="flex-1 text-[12.5px] text-[#cfe0ff]">{q.question}</span>
        <span className="text-[10.5px] text-[#5b6885] shrink-0">{q.projectName}</span>
        {open ? <ChevronUp size={14} className="text-[#5b6885]" /> : <ChevronDown size={14} className="text-[#5b6885]" />}
      </button>
      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="text-[12px] text-[#8b98b3] leading-relaxed"><b className="text-[#7dd3fc]">AI 参考：</b>{q.modelAnswer}</div>
          <Link href={`/projects/${q.slug}#portfolio`} className="chip chip-accent mt-2 inline-block">去该项目的面试模式练习</Link>
        </div>
      )}
    </div>
  );
}
