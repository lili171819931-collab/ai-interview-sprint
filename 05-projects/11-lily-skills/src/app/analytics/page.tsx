"use client";

import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, StatCard, SectionTitle, EmptyState } from "@/components/ui";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [a, setA] = useState<Analytics | null>(null);

  useEffect(() => {
    api<{ analytics: Analytics }>("/api/analytics").then((d) => setA(d.analytics)).catch(() => {});
  }, []);

  if (!a) return <div className="p-10 text-center text-sm text-muted">{t("common.loading")}</div>;
  const maxDaily = Math.max(1, ...a.dailyUsage.map((d) => d.count));
  const maxCat = Math.max(1, ...a.categoryDistribution.map((c) => c.count));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("an.title")}</h1>
        <p className="text-xs text-subtle">{t("an.subtitle")}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t("dash.stat_skills")} value={a.totalSkills} sub={`${a.activeSkills} ${t("dash.stat_skills_sub")}`} icon="🧩" />
        <StatCard label={t("dash.stat_exec_sub")} value={`${a.successRate}%`} sub={`${a.completedExecutions}/${a.totalExecutions}`} icon="🎯" />
        <StatCard label={t("an.avg_duration")} value={a.avgDurationMs ? `${(a.avgDurationMs / 1000).toFixed(1)}s` : "—"} icon="⏱️" />
        <StatCard label={t("an.wf_completion")} value={`${a.workflowCompletionRate}%`} sub={`${a.workflowRuns} runs`} icon="🔁" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t("an.failed")} value={a.failedExecutions} sub={`${a.awaitingApproval} ${t("an.awaiting")}`} icon="❌" />
        <StatCard label={t("an.ai_recs")} value={a.recommendationCount} sub={`${t("an.accept_rate")} ${a.recommendationAcceptanceRate}%`} icon="🧠" />
        <StatCard label={t("an.sessions")} value={a.totalSessions} icon="💬" />
        <StatCard label={t("an.awaiting")} value={a.awaitingApproval} icon="🛡️" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle>{t("an.daily")}</SectionTitle>
          <div className="flex h-40 items-end gap-1">
            {a.dailyUsage.map((d) => (
              <div key={d.date} className="group relative flex-1">
                <div className="rounded-t bg-accent/70 transition-colors hover:bg-accent" style={{ height: `${Math.max(4, (d.count / maxDaily) * 100)}%` }} />
                <div className="mt-1 truncate text-center text-[9px] text-subtle">{d.date.slice(5)}</div>
                <div className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-fg opacity-0 group-hover:opacity-100">{d.count}</div>
              </div>
            ))}
            {a.dailyUsage.length === 0 && <div className="py-14 text-center text-xs text-subtle">{t("an.no_data")}</div>}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle>{t("an.categories")}</SectionTitle>
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
        <SectionTitle>{t("an.top_skills")}</SectionTitle>
        {a.topSkills.length === 0 ? (
          <EmptyState title={t("an.no_usage")} />
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
                  <span className="text-[11px] text-subtle">{t("common.usage")} · {t("common.success_rate")} {s.success_rate}%</span>
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
  const { t } = useI18n();
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-muted">{t("common.loading")}</div>}>
        <AnalyticsContent />
      </Suspense>
    </AppShell>
  );
}
