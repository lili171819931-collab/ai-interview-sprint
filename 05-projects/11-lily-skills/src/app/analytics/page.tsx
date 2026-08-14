"use client";

import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, StatCard, SectionTitle, EmptyState } from "@/components/ui";
import { api } from "@/lib/client";

interface Analytics {
  totalSkills: number; activeSkills: number; totalExecutions: number; completedExecutions: number;
  failedExecutions: number; awaitingApproval: number; successRate: number; avgDurationMs: number | null;
  totalWorkflows: number; workflowRuns: number; workflowCompletionRate: number;
  recommendationCount: number; recommendationAcceptanceRate: number; totalSessions: number;
  dailyUsage: { date: string; count: number }[];
  topSkills: { id: string; name: string; usage_count: number; success_rate: number; icon: string | null }[];
  categoryDistribution: { category: string; count: number }[];
}

function AnalyticsContent() {
  const [a, setA] = useState<Analytics | null>(null);

  useEffect(() => {
    api<{ analytics: Analytics }>("/api/analytics").then((d) => setA(d.analytics)).catch(() => {});
  }, []);

  if (!a) return <div className="p-10 text-center text-sm text-muted">加载中…</div>;
  const maxDaily = Math.max(1, ...a.dailyUsage.map((d) => d.count));
  const maxCat = Math.max(1, ...a.categoryDistribution.map((c) => c.count));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-xs text-subtle">Skill 使用数据与平台健康度</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Skills" value={a.totalSkills} sub={`${a.activeSkills} 启用`} icon="🧩" />
        <StatCard label="成功率" value={`${a.successRate}%`} sub={`${a.completedExecutions}/${a.totalExecutions}`} icon="🎯" />
        <StatCard label="平均耗时" value={a.avgDurationMs ? `${(a.avgDurationMs / 1000).toFixed(1)}s` : "—"} icon="⏱️" />
        <StatCard label="工作流完成率" value={`${a.workflowCompletionRate}%`} sub={`${a.workflowRuns} 次运行`} icon="🔁" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="失败执行" value={a.failedExecutions} sub={`${a.awaitingApproval} 待审批`} icon="❌" />
        <StatCard label="AI 推荐" value={a.recommendationCount} sub={`采纳率 ${a.recommendationAcceptanceRate}%`} icon="🧠" />
        <StatCard label="Agent 会话" value={a.totalSessions} icon="💬" />
        <StatCard label="待审批" value={a.awaitingApproval} icon="🛡️" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle>近 14 天执行量</SectionTitle>
          <div className="flex h-40 items-end gap-1">
            {a.dailyUsage.map((d) => (
              <div key={d.date} className="group relative flex-1">
                <div className="rounded-t bg-accent/70 transition-colors hover:bg-accent" style={{ height: `${Math.max(4, (d.count / maxDaily) * 100)}%` }} />
                <div className="mt-1 truncate text-center text-[9px] text-subtle">{d.date.slice(5)}</div>
                <div className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-fg opacity-0 group-hover:opacity-100">{d.count}</div>
              </div>
            ))}
            {a.dailyUsage.length === 0 && <div className="py-14 text-center text-xs text-subtle">暂无数据</div>}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle>分类分布</SectionTitle>
          <div className="space-y-2">
            {a.categoryDistribution.map((c) => (
              <div key={c.category} className="flex items-center gap-2 text-xs">
                <span className="w-32 truncate text-muted">{c.category}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent2/70" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-subtle">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>最常用 Skills</SectionTitle>
        {a.topSkills.length === 0 ? (
          <EmptyState title="暂无使用数据" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {a.topSkills.map((s, i) => (
              <Card key={s.id} className="card-hover p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.icon ?? "🧩"}</span>
                  <span className="text-xs font-medium">#{i + 1} {s.name}</span>
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-xl font-semibold">{s.usage_count}</span>
                  <span className="text-[11px] text-subtle">次 · 成功率 {s.success_rate}%</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-muted">加载中…</div>}>
        <AnalyticsContent />
      </Suspense>
    </AppShell>
  );
}
