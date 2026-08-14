"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Bot, User, Sparkles, Play, CheckCircle2, ShieldAlert, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Button, Badge, Spinner, StatusLabel, EmptyState } from "@/components/ui";
import { api, fmtTime } from "@/lib/client";

interface RecSkill { id: string; name: string; icon?: string | null; score: number; reasons: string[] }
interface PlanStep {
  skillId: string;
  skillName: string;
  reason: string;
  status: string;
  output?: Record<string, unknown> | null;
  error?: string;
  executionId?: string;
}
interface Plan {
  id: string;
  task: string;
  intent: { category: string; actions: string[]; entities: string[] };
  recommendations: RecSkill[];
  steps: PlanStep[];
  status: string;
  sessionId: string;
}
interface Session { id: string; title: string; updated_at: string }
interface Msg { id: string; role: string; content: string; created_at: string }

function AgentContent() {
  const params = useSearchParams();
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [thinking, setThinking] = useState(false);
  const [executing, setExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ sessions: Session[] }>("/api/agent/sessions").then((d) => setSessions(d.sessions)).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentSession) {
      api<{ messages: Msg[] }>(`/api/agent/sessions/${currentSession}/messages`).then((d) => setMessages(d.messages)).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, plan, thinking]);

  const send = async (autoExecute = false) => {
    if (!prompt.trim() || thinking) return;
    setThinking(true);
    setPlan(null);
    try {
      const d = await api<{ sessionId: string; message: string; plan: Plan }>("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify({ sessionId: currentSession, message: prompt, autoExecute }),
      });
      setCurrentSession(d.sessionId);
      setPlan(d.plan);
      const d2 = await api<{ messages: Msg[] }>(`/api/agent/sessions/${d.sessionId}/messages`).then((r) => r.messages);
      setMessages(d2);
      setSessions(await api<{ sessions: Session[] }>("/api/agent/sessions").then((r) => r.sessions));
      if (!autoExecute) setPrompt("");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setThinking(false);
    }
  };

  const executePlan = async (resume = false) => {
    if (!plan || executing) return;
    setExecuting(true);
    try {
      const d = await api<{ plan: Plan }>(resume ? "/api/agent/resume" : "/api/agent/execute", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id }),
      });
      setPlan(d.plan);
      if (d.plan.sessionId) {
        const d2 = await api<{ messages: Msg[] }>(`/api/agent/sessions/${d.plan.sessionId}/messages`).then((r) => r.messages);
        setMessages(d2);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setExecuting(false);
    }
  };

  const newSession = () => {
    setCurrentSession(null);
    setMessages([]);
    setPlan(null);
  };

  const statusIcon = { pending: "○", running: "●", completed: "✅", failed: "❌", skipped: "⏭️", awaiting_approval: "⏸️" } as Record<string, string>;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-6xl gap-5 px-6 py-6">
        {/* Sessions sidebar */}
        <div className="hidden w-52 shrink-0 lg:block">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">会话</span>
            <Button size="sm" variant="ghost" onClick={newSession}>+ 新建</Button>
          </div>
          <div className="space-y-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { setCurrentSession(s.id); setPlan(null); }}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-xs ${currentSession === s.id ? "bg-surface2 text-fg" : "text-muted hover:bg-surface"}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Chat workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface">
            {/* Messages */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && !plan && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent glow"><Bot className="h-6 w-6" /></div>
                  <div>
                    <div className="text-sm font-medium">Lily AI Agent</div>
                    <div className="mt-1 max-w-sm text-xs text-subtle">告诉我你想完成什么，我会自动找到合适的 Skill、生成计划并执行。</div>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role !== "user" && <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent"><Bot className="h-4 w-4" /></div>}
                  <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-accent text-white" : "bg-surface2 text-fg"}`}>
                    {m.content}
                  </div>
                  {m.role === "user" && <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted"><User className="h-4 w-4" /></div>}
                </div>
              ))}

              {thinking && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent"><Bot className="h-4 w-4" /></div>
                  <Spinner /> Agent 正在理解你的需求…
                </div>
              )}

              {/* Plan panel */}
              {plan && !thinking && (
                <div className="rounded-2xl border border-accent/25 bg-bg/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#b3a6ff]">
                    <Sparkles className="h-3.5 w-3.5" /> AGENT 执行计划
                    <span className="ml-auto text-subtle">意图：{plan.intent.category} · {plan.intent.actions.join(" / ")}</span>
                  </div>
                  <div className="mt-2 text-sm">{plan.task}</div>

                  {plan.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[11px] font-medium text-subtle">推荐 Skills</div>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {plan.recommendations.map((r) => (
                          <div key={r.id} className="rounded-lg border border-border2 bg-surface px-2.5 py-1.5 text-xs">
                            <span className="font-medium">{r.icon ?? "🧩"} {r.name}</span>
                            <div className="mt-0.5 text-[10px] text-subtle">{r.reasons.join("；")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5">
                    {plan.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                        <span className="w-4 text-center">{statusIcon[s.status] ?? "○"}</span>
                        <span className="font-medium">{s.skillName}</span>
                        <span className="truncate text-subtle">— {s.reason}</span>
                        {s.status === "failed" && s.error && <span className="ml-auto truncate text-danger">{s.error}</span>}
                        {s.status === "completed" && s.output && (
                          <span className="ml-auto max-w-[40%] truncate code text-accent2">{JSON.stringify(s.output).slice(0, 80)}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {plan.status === "proposed" && (
                      <>
                        <Button size="sm" onClick={() => executePlan(false)} disabled={executing}>
                          {executing ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} 确认执行
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => executePlan(false)} disabled={executing}><RotateCcw className="h-3.5 w-3.5" /> 直接执行</Button>
                      </>
                    )}
                    {plan.status === "awaiting_approval" && (
                      <div className="flex items-center gap-2 text-xs text-warn">
                        <ShieldAlert className="h-4 w-4" /> 部分步骤需要审批
                        <Button size="sm" onClick={() => executePlan(true)} disabled={executing}>批准并继续</Button>
                      </div>
                    )}
                    {plan.status === "completed" && (
                      <div className="flex items-center gap-1.5 text-xs text-accent2"><CheckCircle2 className="h-4 w-4" /> 任务完成</div>
                    )}
                    {plan.status === "failed" && <StatusLabel status="failed" />}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(false); } }}
                  placeholder="描述你的目标… 例如：帮我分析 AI Agent 海外热点并生成内容选题"
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-border2 bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-subtle focus:border-accent/60"
                />
                <Button onClick={() => send(false)} disabled={thinking || !prompt.trim()} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-1.5 text-[10px] text-subtle">Agent 会先给出理解与计划，确认后再执行 · 高风险操作需审批</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AgentPage() {
  return (
    <Suspense fallback={<AppShell><div className="p-10 text-center text-sm text-muted">加载中…</div></AppShell>}>
      <AgentContent />
    </Suspense>
  );
}
