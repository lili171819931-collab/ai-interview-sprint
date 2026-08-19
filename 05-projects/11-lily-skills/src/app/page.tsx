"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Puzzle, Workflow, Activity, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, StatCard, Badge, SectionTitle, StatusLabel } from "@/components/ui";
import { api, fmtTime } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

interface SkillLite {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category: { name: string } | null;
  tags: string[];
  status: string;
  usage_count: number;
  last_used_at: string | null;
  success_count: number;
  failure_count: number;
}

interface Analytics {
  totalSkills: number;
  activeSkills: number;
  totalExecutions: number;
  successRate: number;
  awaitingApproval: number;
  totalWorkflows: number;
  workflowRuns: number;
  recommendationAcceptanceRate: number;
  topSkills: { id: string; name: string; usage_count: number; success_rate: number; icon: string | null }[];
  recentExecutions: { id: string; skill_name: string; status: string; created_at: string; duration_ms: number | null }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommended, setRecommended] = useState<SkillLite[]>([]);
  const [favorites, setFavorites] = useState<SkillLite[]>([]);

  useEffect(() => {
    api<{ analytics: Analytics }>("/api/analytics").then((d) => setAnalytics(d.analytics)).catch(() => {});
    api<{ results: { skill: SkillLite }[] }>("/api/search?q=AI%20Agent%20热点&limit=4").then((d) => setRecommended(d.results.map((r) => r.skill))).catch(() => {});
    api<{ skills: SkillLite[] }>("/api/skills?favorite=true").then((d) => setFavorites(d.skills)).catch(() => {});
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    router.push(`/agent?prompt=${encodeURIComponent(prompt)}`);
  };

  const quickActions = [
    { label: t("dash.quick_ask"), icon: Sparkles, href: "/agent", desc: t("dash.quick_ask_desc") },
    { label: t("dash.quick_search"), icon: Puzzle, href: "/skills", desc: t("dash.quick_search_desc") },
    { label: t("dash.quick_wf"), icon: Workflow, href: "/workflows", desc: t("dash.quick_wf_desc") },
    { label: t("dash.quick_exec"), icon: Activity, href: "/executions", desc: t("dash.quick_exec_desc") },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero / Agent entry */}
        <Card className="glow p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-[#b3a6ff]">
            <Sparkles className="h-3.5 w-3.5" /> {t("dash.agent_ready")}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {t("dash.hero")} <span className="gradient-text">.</span>
          </h1>
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("dash.placeholder")}
              className="h-12 flex-1 rounded-xl border border-border2 bg-surface px-4 text-sm outline-none placeholder:text-subtle focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-white hover:bg-[#8c7df5]"
            >
              {t("dash.submit")} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {[t("dash.chip1"), t("dash.chip2"), t("dash.chip3"), t("dash.chip4")].map((s) => (
              <button key={s} onClick={() => setPrompt(s)} className="rounded-full border border-border2 px-3 py-1 text-xs text-muted hover:border-accent/50 hover:text-fg">
                {s}
              </button>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label={t("dash.stat_skills")} value={analytics?.totalSkills ?? "—"} sub={`${analytics?.activeSkills ?? 0} ${t("dash.stat_skills_sub")}`} icon="🧩" />
          <StatCard label={t("dash.stat_exec")} value={analytics?.totalExecutions ?? "—"} sub={`${t("dash.stat_exec_sub")} ${analytics?.successRate ?? 0}%`} icon="⚡" />
          <StatCard label={t("dash.stat_wf")} value={analytics?.totalWorkflows ?? "—"} sub={t("dash.stat_wf_sub", { n: analytics?.workflowRuns ?? 0 })} icon="🔁" />
          <StatCard label={t("dash.stat_rec")} value={`${analytics?.recommendationAcceptanceRate ?? 0}%`} sub={t("dash.stat_rec_sub")} icon="🧠" />
        </div>

        {/* Tutorial video */}
        <div className="mt-8">
          <SectionTitle sub={t("dash.tutorial_sub")}>{t("dash.tutorial")}</SectionTitle>
          <Card className="overflow-hidden">
            <video
              src="/tutorial.mp4"
              controls
              preload="metadata"
              playsInline
              className="aspect-video w-full bg-black"
            />
          </Card>
        </div>

        {/* Quick actions */}
        <div className="mt-8">
          <SectionTitle>{t("dash.quick")}</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {quickActions.map((a) => (
              <Link key={a.label} href={a.href} className="card card-hover p-4">
                <a.icon className="h-5 w-5 text-accent" />
                <div className="mt-2 text-sm font-medium">{a.label}</div>
                <div className="mt-0.5 text-xs text-subtle">{a.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* AI Recommendations */}
          <div className="lg:col-span-2">
            <SectionTitle sub={t("dash.recommended_sub")}>{t("dash.recommended")}</SectionTitle>
            <div className="space-y-2">
              {recommended.map((s, i) => (
                <Link key={s.id} href={`/skills/${s.id}`} className="card card-hover flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-lg">{s.icon ?? "🧩"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{s.name}</span>
                      <Badge tone="accent">#{i + 1} {t("dash.rec_badge")}</Badge>
                    </div>
                    <div className="truncate text-xs text-subtle">{s.description}</div>
                  </div>
                  <Badge tone="neutral">{s.category?.name ?? t("dash.uncategorized")}</Badge>
                </Link>
              ))}
              {recommended.length === 0 && <Card className="p-6 text-center text-sm text-subtle">{t("dash.rec_loading")}</Card>}
            </div>
          </div>

          {/* Recent activity + favorites */}
          <div className="space-y-6">
            <div>
              <SectionTitle>{t("dash.recent")}</SectionTitle>
              <Card className="divide-y divide-border p-1">
                {(analytics?.recentExecutions ?? []).slice(0, 6).map((e) => (
                  <Link key={e.id} href="/executions" className="flex items-center justify-between px-3 py-2.5 hover:bg-surface2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-subtle" />
                      <span className="text-xs">{e.skill_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusLabel status={e.status} />
                      <span className="text-[11px] text-subtle">{fmtTime(e.created_at)}</span>
                    </div>
                  </Link>
                ))}
                {!analytics?.recentExecutions?.length && <div className="px-3 py-6 text-center text-xs text-subtle">{t("dash.recent_empty")}</div>}
              </Card>
            </div>
            <div>
              <SectionTitle>{t("dash.favs")}</SectionTitle>
              <div className="space-y-2">
                {favorites.slice(0, 4).map((s) => (
                  <Link key={s.id} href={`/skills/${s.id}`} className="card card-hover flex items-center gap-2 p-3">
                    <Star className="h-4 w-4 text-warn" />
                    <span className="text-sm">{s.name}</span>
                    <span className="ml-auto text-xs text-subtle">{s.usage_count} {t("common.usage")}</span>
                  </Link>
                ))}
                {favorites.length === 0 && <Card className="p-4 text-center text-xs text-subtle">{t("dash.favs_empty")}</Card>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
