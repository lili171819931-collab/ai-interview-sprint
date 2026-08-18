import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { allCategories, discoverProjects, languages } from "@/lib/store";
import { computeScores } from "@/lib/engines";
import { ProjectCard } from "@/components/ProjectCard";
import { LangSelect } from "@/components/ClientBits";
import { categoryOf } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-static";

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

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; lang?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const category = (sp.category ?? "all") as CategoryId | "all";
  const lang = sp.lang ?? "";
  const sort = (sp.sort ?? "opportunity") as SortId;

  let projects = discoverProjects({ q, category, lang, minStars: undefined, maxStars: undefined });
  const scored = projects.map((p) => ({ p, s: computeScores(p) }));
  scored.sort((a, b) => {
    switch (sort) {
      case "stars": return b.p.stars - a.p.stars;
      case "growth": return b.p.growth30d - a.p.growth30d;
      case "money": return b.s.money - a.s.money;
      case "sidehustle": return b.s.sideHustle - a.s.sideHustle;
      case "skills": return b.s.skill - a.s.skill;
      case "resume": return b.s.resume - a.s.resume;
      case "new": return Date.parse(b.p.createdAt) - Date.parse(a.p.createdAt);
      default: return b.s.opportunity - a.s.opportunity;
    }
  });
  projects = scored.map((x) => x.p);

  const qs = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category !== "all") params.set("category", category);
    if (lang) params.set("lang", lang);
    if (sort !== "opportunity") params.set("sort", sort);
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

      <div className="flex flex-wrap gap-1.5">
        <Link href={qs({ category: "all" })} className={`chip ${category === "all" ? "chip-accent" : ""}`}>全部</Link>
        {allCategories().map((c) => (
          <Link key={c.id} href={qs({ category: c.id })} className={`chip ${category === c.id ? "chip-accent" : ""}`}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal size={14} className="text-[#5b6885]" />
        {SORTS.map((s) => (
          <Link key={s.id} href={qs({ sort: s.id })} className={`chip ${sort === s.id ? "chip-accent" : ""}`}>{s.label}</Link>
        ))}
        <span className="ml-auto text-[12px] text-[#5b6885] num">{projects.length} 个项目</span>
      </div>

      {category !== "all" && (
        <div className="panel px-4 py-3 text-[12.5px] text-[#aab6cd]">
          {categoryOf(category as CategoryId).emoji} 正在浏览 <b className="text-white">{categoryOf(category as CategoryId).name}</b> · {categoryOf(category as CategoryId).nameZh} 分类下的 {projects.length} 个项目
        </div>
      )}

      {projects.length === 0 ? (
        <div className="panel p-12 text-center text-[#5b6885]">没有匹配的项目，换个关键词试试</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
