"use client";

import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Badge, Select, StatusLabel, EmptyState, SectionTitle } from "@/components/ui";
import { api, fmtDuration, fmtTime } from "@/lib/client";

interface Execution {
  id: string;
  skill_id: string;
  skill_name: string;
  skill_icon: string | null;
  status: string;
  trigger: string;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  output: Record<string, unknown> | null;
  logs: { level: string; message: string; at: string }[];
}

function ExecutionsContent() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const q = status ? `?status=${status}` : "";
    api<{ executions: Execution[] }>(`/api/executions${q}`).then((d) => setExecutions(d.executions)).catch(() => setExecutions([]));
  }, [status]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Execution Center</h1>
          <p className="text-xs text-subtle">所有 Skill 执行的统一记录与审计</p>
        </div>
        <div className="ml-auto">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="completed">已完成</option>
            <option value="running">执行中</option>
            <option value="queued">排队中</option>
            <option value="awaiting_approval">待审批</option>
            <option value="failed">失败</option>
            <option value="cancelled">已取消</option>
          </Select>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {executions.length === 0 && <EmptyState title="暂无执行记录" hint="运行一个 Skill 或让 Agent 执行任务后，这里会出现记录" />}
        {executions.map((e) => (
          <Card key={e.id} className="overflow-hidden">
            <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2">
              <span className="text-xl">{e.skill_icon ?? "🧩"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {e.skill_name}
                  <Badge tone="neutral">{e.trigger}</Badge>
                  <span className="code text-[10px] text-subtle">{e.id.slice(0, 14)}</span>
                </div>
              </div>
              <StatusLabel status={e.status} />
              <span className="w-16 text-right text-[11px] text-subtle">{fmtDuration(e.duration_ms)}</span>
              <span className="w-24 text-right text-[11px] text-subtle">{fmtTime(e.created_at)}</span>
            </button>
            {expanded === e.id && (
              <div className="space-y-3 border-t border-border p-4">
                <SectionTitle>输入</SectionTitle>
                <pre className="code max-h-40 overflow-auto rounded-lg bg-bg p-3 text-[11px]">{JSON.stringify(e.output ?? e.error ?? "无输出", null, 2)}</pre>
                <SectionTitle>日志</SectionTitle>
                <div className="space-y-1">
                  {e.logs.map((l, i) => (
                    <div key={i} className="flex gap-2 text-[11px]">
                      <span className={`code ${l.level === "error" ? "text-danger" : l.level === "warn" ? "text-warn" : "text-subtle"}`}>[{l.level}]</span>
                      <span className="text-muted">{l.message}</span>
                    </div>
                  ))}
                  {e.logs.length === 0 && <span className="text-xs text-subtle">无结构化日志</span>}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ExecutionsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-muted">加载中…</div>}>
        <ExecutionsContent />
      </Suspense>
    </AppShell>
  );
}
