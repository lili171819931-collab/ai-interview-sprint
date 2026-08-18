"use client";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Clock, ExternalLink } from "lucide-react";
import { allCategories, languages } from "@/lib/store";
import { computeScores } from "@/lib/engines";
import { categoryOf } from "@/lib/categories";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { liveStatus, starsPerDay } from "@/lib/live";
import { useDb, type MergedRow } from "@/lib/db";
import { PROJECTS } from "@/data/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { LangSelect } from "@/components/ClientBits";
import type { CategoryId, Project } from "@/lib/types";
import type { LiveRepo } from "@/lib/live";

const SORTS = [
  { id: "opportunity", label: "机会分" },
  { id: "stars", label: "Stars" },
  { id: "growth", label: "30天增长" },
  { id: "money", label: "赚钱" },
  { id: "sidehustle", label: "副业" },
  { id: "skills", label: "Skill" },
  { id: "resume", label: "简历" },
  { id: "new", label: "最新" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="panel p-12 text-center text-[#5b6885]">加载中…</div>}>
      <DiscoverInner />
    </Suspense>
  );
}

function DiscoverInner() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const category = (sp.get("category") ?? "all") as CategoryId | "all";
  const lang = sp.get("lang") ?? "";
  const sort = (sp.get("sort") ?? "opportunity") as SortId;
  const ts = (sp.get("ts") ?? "all") as string;

  const { state, syncing } = useDb();
  const liveBy = useMemo(() => new Map(state.repos.map((r) => [r.fullName.toLowerCase(), r])), [state.repos]);

  const rows: MergedRow[] = useMemo(() => {
    const out: MergedRow[] = [];
    for (const p of PROJECTS) out.push({ seed: p, live: liveBy.get(p.fullName.toLowerCase()) });
    for (const r of state.repos) {
      if (!PROJECTS.some((p) => p.fullName.toLowerCase() === r.fullName.toLowerCase())) out.push({ live: r });
    }
    return out;
  }, [liveBy, state.repos]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = rows.filter((row) => {
      const p = row.seed;
      const r = row.live;
      const hay = (p ? `${p.name} ${p.owner} ${p.tagline} ${p.description} ${p.topics.join(" ")} ${p.fullName}` : `${r!.name} ${r!.owner} ${r!.description ?? ""} ${r!.topics.join(" ")} ${r!.fullName}`).toLowerCase();
      if (query && !hay.includes(query)) return false;
      if (category !== "all") {
        if (p && !p.categories.includes(category)) return false;
        if (!p && r) {
          const catNames = `${r.topics.join(" ")} ${r.language ?? ""} ${r.description ?? ""}`.toLowerCase();
          if (!catNames.includes(categoryOf(category).name.toLowerCase()) && !catNames.includes(categoryOf(category).nameZh)) return false;
        }
      }
      if (lang && (p ? p.language !== lang : r!.language !== lang)) return false;
      if (ts !== "all") {
        const status = p ? timeStatusOf(p) : liveStatus(r!);
        if (status !== ts) return false;
      }
      return true;
    });
    const key = (row: MergedRow): number => {
      const p = row.seed; const r = row.live;
      switch (sort) {
        case "stars": return p ? p.stars : r!.stars;
        case "growth": return p ? p.growth30d : starsPerDay(r!) * 30;
        case "new": return Date.parse(p ? p.createdAt : r!.createdAt);
        case "money": case "sidehustle": case "skills": case "resume": case "opportunity":
          return p ? computeScores(p)[({ sidehustle: "sideHustle", skills: "skill", money: "money", resume: "resume", opportunity: "opportunity" } as const)[sort]] : r!.stars;
        default: return p ? computeScores(p).opportunity : r!.stars;
      }
    };
    list = [...list].sort((a, b) => key(b) - key(a));
    return list;
  }, [rows, q, category, lang, ts, sort]);

  const qs = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category !== "all") params.set("category", category);
    if (lang) params.set("lang", lang);
    if (sort !== "opportunity") params.set("sort", sort);
    if (ts !== "all") params.set("ts", ts);
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    return `/discover?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-white mr-2">Explore · 全部项目</h1>
        <form method="get" action="/discover" className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6885]" />
          <input name="q" defaultValue={q} placeholder="搜索项目 / 标签 / 描述" className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[13px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]" />
        </form>
        <LangSelect value={lang} languages={languages()} q={q} category={category} sort={sort} />
      </div>

      <div className="panel px-4 py-2.5 flex flex-wrap items-center gap-2 text-[12px] text-[#8b98b3]">
        <span>🔓 平台仅展示开源项目（License 校验）· 📂 全部项目已按 30 个分类接入「分类 TOP 榜」；平台数据库已关联实时 GitHub 数据（{state.repos.length} 个实时项目{syncing ? "，同步中…" : ""}）</span>
        <Link href="/rankings/categories" className="chip chip-accent ml-auto">去分类 TOP 榜 →</Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link href={qs({ category: "all" })} className={`chip ${category === "all" ? "chip-accent" : ""}`}>全部</Link>
        {allCategories().map((c) => (
          <Link key={c.id} href={qs({ category: c.id })} className={`chip ${category === c.id ? "chip-accent" : ""}`}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link href={qs({ ts: "all" })} className={`chip ${ts === "all" ? "chip-accent" : ""}`}>全部时间</Link>
        {(Object.keys(TIME_STATUS_META) as (keyof typeof TIME_STATUS_META)[]).map((t) => (
          <Link key={t} href={qs({ ts: t })} className={`chip ${ts === t ? "chip-accent" : ""}`} style={ts === t ? { color: TIME_STATUS_META[t].color, borderColor: TIME_STATUS_META[t].color + "66" } : undefined}>
            {TIME_STATUS_META[t].label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal size={14} className="text-[#5b6885]" />
        {SORTS.map((s) => (
          <Link key={s.id} href={qs({ sort: s.id })} className={`chip ${sort === s.id ? "chip-accent" : ""}`}>{s.label}</Link>
        ))}
        <span className="ml-auto text-[12px] text-[#5b6885] num">{filtered.length} 个项目</span>
      </div>

      {category !== "all" && (
        <div className="panel px-4 py-3 text-[12.5px] text-[#aab6cd]">
          {categoryOf(category).emoji} 正在浏览 <b className="text-white">{categoryOf(category).name}</b> · {categoryOf(category).nameZh} 分类下的 {filtered.length} 个项目
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="panel p-12 text-center text-[#5b6885]">没有匹配的项目，换个关键词试试</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) =>
            row.seed ? (
              <ProjectCard key={row.seed.slug} project={row.seed} />
            ) : (
              <LiveCard key={row.live!.fullName} repo={row.live!} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function LiveCard({ repo }: { repo: LiveRepo }) {
  const status = liveStatus(repo);
  const meta = TIME_STATUS_META[status];
  return (
    <div className="panel card-hover p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a href={`https://github.com/${repo.fullName}`} target="_blank" className="block">
            <div className="font-bold text-[15px] text-white hover:text-[#7dd3fc] truncate">{repo.name} <ExternalLink size={12} className="inline text-[#4d5a75]" /></div>
            <div className="text-[12px] text-[#8b98b3] line-clamp-2 mt-0.5">{repo.description ?? repo.fullName}</div>
          </a>
        </div>
        <span className="chip !text-[10px]" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "12" }}>{meta.label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#8b98b3] num">
        <span>⭐ {formatStars(repo.stars)}</span>
        <span>🍴 {formatStars(repo.forks)}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> 发布于 {repo.createdAt}</span>
        {repo.language && <span className="chip !text-[9.5px]">{repo.language}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[11px] text-[#5b6885]">📡 GitHub 实时</span>
        <a href={`https://github.com/${repo.fullName}`} target="_blank" className="chip chip-accent">GitHub</a>
      </div>
    </div>
  );
}

import { formatStars } from "@/lib/engines";
