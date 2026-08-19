"use client";
import { useState } from "react";
import { Briefcase, FileText, MessagesSquare, Hammer, UserRound, BookMarked, Check, Sparkles } from "lucide-react";
import type { Project } from "@/lib/types";
import { buildCaseStudy, buildInterviewQuestions, buildPrd, buildOpinionFrame } from "@/lib/learning";
import { addPortfolioCase, addDecision, recordInterview, getDecisions, getPortfolioCases } from "@/lib/learningStore";

export function PortfolioMode({ project }: { project: Project }) {
  const [tab, setTab] = useState<"case" | "interview" | "prd" | "ifpm" | "journal">("case");
  const caseStudy = buildCaseStudy(project);
  const questions = buildInterviewQuestions(project);
  const prd = buildPrd(project);
  const frame = buildOpinionFrame(project);
  const [added, setAdded] = useState(false);
  const [savedJournal, setSavedJournal] = useState(false);

  const tabs = [
    { id: "case", label: "Portfolio Case", icon: Briefcase },
    { id: "interview", label: "Interview Me", icon: MessagesSquare },
    { id: "prd", label: "Rebuild → PRD", icon: Hammer },
    { id: "ifpm", label: "If I Were The PM", icon: UserRound },
    { id: "journal", label: "决策记录", icon: BookMarked },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`chip cursor-pointer ${tab === t.id ? "chip-accent" : ""}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "case" && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3"><Briefcase size={16} className="text-[#7dd3fc]" /><span className="text-[14px] font-bold text-white">AI PM Case · {caseStudy.category}</span></div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4 space-y-2.5 text-[13px] text-[#aab6cd]">
            <div><b className="text-[#7dd3fc]">Problem：</b>{caseStudy.problem}</div>
            <div><b className="text-[#7dd3fc]">User：</b>{caseStudy.user}</div>
            <div><b className="text-[#7dd3fc]">Product Logic：</b>{caseStudy.productLogic}</div>
            <div><b className="text-[#7dd3fc]">AI Architecture：</b>{caseStudy.aiArchitecture}</div>
            <div><b className="text-[#7dd3fc]">Business Model：</b>{caseStudy.businessModel}</div>
            <div><b className="text-[#7dd3fc]">My Decision：</b>{caseStudy.myDecision}</div>
            <div><b className="text-[#7dd3fc]">Improvement：</b>{caseStudy.improvement}</div>
          </div>
          <button
            onClick={() => {
              addPortfolioCase({ id: caseStudy.id, projectId: project.slug, projectName: project.name, category: caseStudy.category, title: caseStudy.title, at: new Date().toISOString() });
              setAdded(true);
            }}
            className="mt-3 h-9 px-4 rounded-lg bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-[12.5px] text-white font-semibold"
          >
            {added ? "✓ 已加入 Portfolio" : "加入 My AI PM Portfolio"}
          </button>
          <div className="mt-2 text-[11.5px] text-[#5b6885]">已存 {getPortfolioCases().length} 个案例 · 目标 60-90 个</div>
        </div>
      )}

      {tab === "interview" && <InterviewMe project={project} questions={questions} />}

      {tab === "prd" && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3"><Hammer size={16} className="text-[#fbbf24]" /><span className="text-[14px] font-bold text-white">Rebuild This Product · 从项目到 PRD</span></div>
          <div className="space-y-2.5 text-[13px] text-[#aab6cd]">
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#7dd3fc]">Product Brief：</b>{prd.productBrief}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#7dd3fc]">Problem：</b>{prd.problem}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#7dd3fc]">Users：</b>{prd.users}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
              <b className="text-[#7dd3fc]">User Flow：</b>
              <div className="mt-1 space-y-1">{prd.userFlow.map((f, i) => <div key={i}>{i + 1}. {f}</div>)}</div>
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
              <b className="text-[#7dd3fc]">Feature List：</b>
              <div className="mt-1 flex flex-wrap gap-1.5">{prd.features.map((f) => <span key={f} className="chip">{f}</span>)}</div>
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#34d399]">MVP：</b>{prd.mvp}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#34d399]">AI Architecture：</b>{prd.aiArchitecture}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#34d399]">Data Architecture：</b>{prd.dataArchitecture}</div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
              <b className="text-[#34d399]">Metrics：</b>
              <div className="mt-1 flex flex-wrap gap-1.5">{prd.metrics.map((m) => <span key={m} className="chip chip-accent">{m}</span>)}</div>
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5"><b className="text-[#34d399]">GTM：</b>{prd.gtm}</div>
          </div>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-[12px] text-[#8b98b3] bg-[#0c1322] border border-[#16213a] rounded-xl p-4">{prd.prd}</pre>
        </div>
      )}

      {tab === "ifpm" && <IfIWerePm project={project} frame={frame} />}

      {tab === "journal" && (
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3"><BookMarked size={16} className="text-[#34d399]" /><span className="text-[14px] font-bold text-white">Product Decision Journal · 产品决策记录</span></div>
          <DecisionForm project={project} onSaved={() => setSavedJournal(true)} />
          {savedJournal && <div className="mt-2 text-[12px] text-emerald-300">✓ 已记录，将沉淀进你的决策日志与能力评估</div>}
          <div className="mt-3 text-[11.5px] text-[#5b6885]">已记录 {getDecisions().length} 条决策 · 长期积累形成「认知成长曲线」</div>
        </div>
      )}
    </div>
  );
}

function InterviewMe({ project, questions }: { project: Project; questions: ReturnType<typeof buildInterviewQuestions> }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<null | { scores: Record<string, number>; overall: number; feedback: string }>(null);
  const q = questions[Math.min(idx, questions.length - 1)];

  const submit = () => {
    const len = answer.trim().length;
    const hasKeywords = /用户|需求|痛点|增长|商业|指标|留存|转化|用户场景/i.test(answer);
    const base = Math.min(88, 55 + Math.min(len / 12, 20) + (hasKeywords ? 12 : 2));
    const scores = {
      "Product Thinking": Math.min(95, base + 5),
      "AI Understanding": Math.min(95, base - 3),
      "Business Thinking": Math.min(95, base + 2),
      Communication: Math.min(95, base + 4),
    };
    const overall = Math.round((scores["Product Thinking"] + scores["AI Understanding"] + scores["Business Thinking"] + scores.Communication) / 4);
    recordInterview({ slug: project.slug, projectName: project.name, score: overall, at: new Date().toISOString() });
    setResult({ scores, overall, feedback: len < 20 ? "回答太短，建议用「用户→场景→Job→指标」的结构。" : "结构不错。建议补一句「我会如何验证这个判断」，体现证据驱动。" });
  };

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-3"><MessagesSquare size={16} className="text-[#60a5fa]" /><span className="text-[14px] font-bold text-white">Interview Me · AI 面试官（{q.category}）</span></div>
      {!result ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[14px] font-semibold text-white">“{q.question}”</div>
            <div className="text-[11.5px] text-[#5b6885] mt-1">Q{idx + 1}/{questions.length} · 类别：{q.category}</div>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="用「用户 → 场景 → Job → 指标 → 验证」的结构回答…"
            className="w-full min-h-[120px] px-3.5 py-3 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[13px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
          />
          <div className="flex gap-2">
            <button onClick={submit} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-[12.5px] text-white font-semibold">提交回答 · AI 评分</button>
            <button onClick={() => { setAnswer(""); }} className="h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white">重写</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#101a2e] border border-[#16213a] p-4">
            <div className="text-[13px] text-[#8b98b3] mb-2">AI 面试官评分</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {Object.entries(result.scores).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
                  <div className="text-[11px] text-[#8b98b3]">{k}</div>
                  <div className="text-lg font-bold num text-[#7dd3fc]">{Math.round(v)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center"><span className="text-[11px] text-[#5b6885]">Overall</span> <span className="text-2xl font-extrabold num text-white">{result.overall}<span className="text-sm text-[#5b6885]">/100</span></span></div>
            <div className="mt-2 text-[12.5px] text-[#fbbf24]">{result.feedback}</div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[11.5px] font-semibold text-[#7dd3fc] mb-1.5">参考回答（AI PM）</div>
            <div className="text-[12.5px] text-[#aab6cd]">{q.modelAnswer}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setIdx((i) => (i + 1) % questions.length); setAnswer(""); setResult(null); }} className="h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white">下一题</button>
            <button onClick={() => setResult(null)} className="h-9 px-4 rounded-lg bg-transparent border border-[#1c2942] text-[12.5px] text-[#aab6cd]">重答此题</button>
          </div>
        </div>
      )}
      <div className="mt-4">
        <div className="text-[11.5px] font-semibold text-[#5b6885] mb-2">本题库 · 8 类问题（AI PM Interview Case Bank）</div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => { setIdx(i); setAnswer(""); setResult(null); }} className={`chip cursor-pointer ${i === idx ? "chip-accent" : ""}`}>{qq.category}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function IfIWerePm({ project, frame }: { project: Project; frame: ReturnType<typeof buildOpinionFrame> }) {
  const [my, setMy] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-3"><UserRound size={16} className="text-[#c084fc]" /><span className="text-[14px] font-bold text-white">If I Were The PM · 先写你的判断，再看 AI PM 的判断</span></div>
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4 mb-3">
        <div className="text-[13px] font-semibold text-white mb-1">如果你是「{project.name}」的 PM：</div>
        <div className="text-[12.5px] text-[#8b98b3]">① 当前产品判断 ② 最大机会 ③ 最大问题 ④ 下一版本做什么 ⑤ 未来战略</div>
      </div>
      <textarea
        value={my}
        onChange={(e) => setMy(e.target.value)}
        placeholder="写下你的 PM 判断（至少 3 点）…"
        className="w-full min-h-[110px] px-3.5 py-3 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[13px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={() => setRevealed(true)} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-[12.5px] text-white font-semibold">对比 AI PM 判断</button>
      </div>
      {revealed && (
        <div className="mt-4 rounded-xl bg-[#101a2e] border border-[#16213a] p-4 space-y-2.5 text-[13px]">
          <div className="flex items-center gap-2 text-[#7dd3fc] font-semibold"><Sparkles size={14} /> AI PM 的判断</div>
          <div><b className="text-[#7dd3fc]">最大创新：</b>{frame.biggestInnovation}</div>
          <div><b className="text-[#f87171]">最大问题：</b>{frame.biggestFlaw}</div>
          <div><b className="text-[#34d399]">下一版本：</b>{frame.ifPmSteps.join("；")}</div>
          <div><b className="text-[#fbbf24]">未来战略：</b>{frame.futureOpportunity}</div>
          <div className="border-t border-[#1c2942] pt-2 text-[12px] text-[#5b6885]">对比你的答案与 AI PM 的答案，找到遗漏的维度（用户 / 商业 / 增长 / 风险）。</div>
        </div>
      )}
    </div>
  );
}

function DecisionForm({ project, onSaved }: { project: Project; onSaved: () => void }) {
  const [myDecision, setMyDecision] = useState("");
  const [reason, setReason] = useState("");
  const [aiOpinion, setAiOpinion] = useState("");
  const [final, setFinal] = useState("");
  return (
    <div className="space-y-2.5">
      <textarea value={myDecision} onChange={(e) => setMyDecision(e.target.value)} placeholder="我认为：这个产品最应该…" className="w-full min-h-[52px] px-3.5 py-2.5 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[12.5px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]" />
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="我的理由：…" className="w-full min-h-[52px] px-3.5 py-2.5 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[12.5px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]" />
      <textarea value={aiOpinion} onChange={(e) => setAiOpinion(e.target.value)} placeholder="AI Expert Opinion：…" className="w-full min-h-[52px] px-3.5 py-2.5 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[12.5px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]" />
      <textarea value={final} onChange={(e) => setFinal(e.target.value)} placeholder="最终判断：…" className="w-full min-h-[52px] px-3.5 py-2.5 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[12.5px] text-[#cfe0ff] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]" />
      <button
        onClick={() => {
          addDecision({ slug: project.slug, projectName: project.name, myDecision, reason, aiOpinion, final, at: new Date().toISOString() });
          setMyDecision(""); setReason(""); setAiOpinion(""); setFinal(""); onSaved();
        }}
        disabled={!myDecision.trim()}
        className="h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white disabled:opacity-40"
      >
        <Check size={13} className="inline mr-1" /> 记录决策
      </button>
    </div>
  );
}
