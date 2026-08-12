"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink, MessageSquareText, Sparkles } from "lucide-react";

type AskResponse = {
  ok: boolean;
  question: string;
  intent: string;
  answer: string;
  bullets: string[];
  toolsUsed: { tool: string; ok: boolean }[];
  sources: { title: string; url: string; platform: string; eventId?: string }[];
  generatedAt: string;
  mode: string;
  error?: string;
};

const SUGGESTIONS = [
  "今天全球AI发生了什么？",
  "今天有哪些值得关注的AI创业机会？",
  "对比中国和美国AI热点",
  "找出过去24小时增长最快的10个AI话题",
  "台风白海豚",
  "今天全球热点简报",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ask(q: string) {
    const text = q.trim();
    if (!text) return;
    setQuestion(text);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        });
        const data = (await res.json()) as AskResponse;
        if (!res.ok) {
          setError(data.error || `HTTP ${res.status}`);
          setResult(null);
          return;
        }
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setResult(null);
      }
    });
  }

  return (
    <div className="container py-10 space-y-8 max-w-3xl">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.45)] bg-[var(--ai-accent-dim)] px-3 py-1 text-xs text-[#d7ccff]">
          <MessageSquareText size={14} aria-hidden />
          Trend Intelligence Agent
        </div>
        <h1 className="display text-3xl font-semibold">问问今日趋势</h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Agent 会调用本地工具（search / trending / compare / report），答案绑定真实来源链接，不编造
          URL。可选配置 <code className="text-[var(--text)]">INTEL_LLM_URL</code> 润色表述。
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="例如：今天全球 AI 发生了什么？"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-3 text-sm outline-none focus:border-[var(--signal)]"
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "分析中…" : "提问"}
          </button>
          <Link href="/" className="btn btn-ghost">
            今日热点
          </Link>
          <Link href="/trends" className="btn btn-ghost">
            趋势雷达
          </Link>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="tag hover:border-[var(--signal)]" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {result ? (
        <section className="space-y-4 surface p-5">
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="tag">intent: {result.intent}</span>
            <span className="tag">mode: {result.mode}</span>
            <span className="tag">{result.generatedAt}</span>
            {result.toolsUsed.map((t) => (
              <span key={t.tool} className="tag">
                {t.tool}
                {t.ok ? "" : "!"}
              </span>
            ))}
          </div>
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="mt-1 text-[var(--signal)]" aria-hidden />
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          </div>
          {result.bullets?.length ? (
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              {result.bullets.map((b) => (
                <li key={b} className="leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
          {result.sources?.length ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-[var(--signal)]">Sources</h2>
              <ul className="space-y-2">
                {result.sources.map((s) => (
                  <li key={`${s.url}-${s.title}`} className="text-sm">
                    <span className="tag mr-2">{s.platform}</span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--signal)] hover:underline inline-flex items-center gap-1"
                    >
                      {s.title} <ExternalLink size={12} aria-hidden />
                    </a>
                    {s.eventId ? (
                      <Link href={`/events/${s.eventId}`} className="ml-2 text-xs text-[var(--muted)] hover:underline">
                        事件
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
