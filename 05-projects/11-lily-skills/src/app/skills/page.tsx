"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Star, Play, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Badge, Select, EmptyState, StatusLabel } from "@/components/ui";
import { api, fmtTime } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

interface SkillLite {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category: { id: string; name: string } | null;
  tags: string[];
  status: string;
  usage_count: number;
  success_count: number;
  failure_count: number;
  last_used_at: string | null;
  execution_type: string;
}

interface Category { id: string; name: string; icon: string | null }

function SkillsContent() {
  const params = useSearchParams();
  const { t } = useI18n();
  const [skills, setSkills] = useState<SkillLite[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ categories: Category[] }>("/api/categories").then((d) => setCategories(d.categories)).catch(() => {});
    api<{ skills: SkillLite[] }>("/api/skills?favorite=true").then((d) => setFavs(new Set(d.skills.map((s) => s.id)))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("categoryId", category);
    if (sort) query.set("sort", sort);
    api<{ skills: SkillLite[] }>(`/api/skills?${query.toString()}`)
      .then((d) => setSkills(d.skills))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, [q, category, sort]);

  const toggleFav = async (id: string) => {
    const d = await api<{ favorite: boolean }>("/api/favorites", { method: "POST", body: JSON.stringify({ skillId: id }) });
    setFavs((prev) => {
      const next = new Set(prev);
      if (d.favorite) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Skills</h1>
          <p className="text-xs text-subtle">{skills.length} {t("skills.subtitle")}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("skills.search_ph")} className="h-9 w-56 rounded-lg border border-border2 bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-subtle focus:border-accent/60" />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t("skills.all_categories")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon ?? ""} {c.name}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="relevance">{t("skills.sort_relevance")}</option>
            <option value="usage">{t("skills.sort_usage")}</option>
            <option value="newest">{t("skills.sort_newest")}</option>
            <option value="success">{t("skills.sort_success")}</option>
          </Select>
          <div className="flex overflow-hidden rounded-lg border border-border2">
            {(["grid", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1.5 text-xs ${view === v ? "bg-surface2 text-fg" : "text-subtle hover:text-fg"}`}>
                {v === "grid" ? "▦" : "☰"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {loading && <Card className="p-10 text-center text-sm text-subtle">{t("common.loading")}</Card>}
        {!loading && skills.length === 0 && <EmptyState title={t("skills.empty")} hint={t("skills.empty_hint")} />}
        {view === "grid" ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((s) => (
              <Card key={s.id} className="card-hover flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface2 text-xl">{s.icon ?? "🧩"}</div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/skills/${s.id}`} className="block truncate text-sm font-medium hover:text-accent">{s.name}</Link>
                    <div className="mt-0.5 line-clamp-2 text-xs text-subtle">{s.description}</div>
                  </div>
                  <button onClick={() => toggleFav(s.id)} className="shrink-0 text-subtle hover:text-warn">
                    <Star className={`h-4 w-4 ${favs.has(s.id) ? "fill-warn text-warn" : ""}`} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="accent">{s.category?.name ?? t("dash.uncategorized")}</Badge>
                  {s.tags.slice(0, 2).map((t) => <Badge key={t}>{t}</Badge>)}
                  <StatusLabel status={s.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-subtle">
                  <span>{s.usage_count} {t("common.usage")} · {t("common.success_rate")} {s.usage_count ? Math.round((s.success_count / s.usage_count) * 100) : 0}%</span>
                  <Link href={`/skills/${s.id}?run=1`} className="inline-flex items-center gap-1 text-accent hover:text-[#b3a6ff]">
                    <Play className="h-3 w-3" /> {t("common.run")}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="divide-y divide-border">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface2">
                <div className="text-xl">{s.icon ?? "🧩"}</div>
                <Link href={`/skills/${s.id}`} className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-subtle">{s.description}</div>
                </Link>
                <Badge tone="accent">{s.category?.name ?? t("dash.uncategorized")}</Badge>
                <StatusLabel status={s.status} />
                <span className="w-20 text-right text-[11px] text-subtle">{s.usage_count} {t("common.usage")}</span>
                <span className="w-24 text-right text-[11px] text-subtle">{fmtTime(s.last_used_at)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-subtle">{t("common.loading")}</div>}>
        <SkillsContent />
      </Suspense>
    </AppShell>
  );
}
