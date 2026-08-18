"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Scale, X, Plus, Sparkles, Check } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import type { Project } from "@/lib/types";

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="panel p-12 text-center text-[#5b6885]">加载中…</div>}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const params = useSearchParams();
  const initial = useMemo(() => {
    const a = params.get("a");
    const b = params.get("b");
    const ids = [a, b].filter(Boolean) as string[];
    return ids.slice(0, 4).map((id) => PROJECTS.find((p) => p.slug === id)).filter(Boolean) as Project[];
  }, [params]);

  const [selected, setSelected] = useState<Project[]>(initial);
  const [query, setQuery] = useState("");

  const add = (p: Project) => {
    if (selected.length >= 4) return;
    if (selected.some((x) => x.slug === p.slug)) return;
    setSelected((s) => [...s, p]);
    setQuery("");
  };
  const remove = (slug: string) => setSelected((s) => s.filter((x) => x.slug !== slug));

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter((p) => !selected.some((x) => x.slug === p.slug))
      .filter((p) => !q || `${p.name} ${p.tagline} ${p.owner}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, selected]);

  const rows: { label: string; value: (p: Project) => string | number; highlight?: (scores: ReturnType<typeof computeScores>) => boolean }[] = [
    { label: "Stars", value: (p) => formatStars(p.stars) },
    { label: "Forks", value: (p) => formatStars(p.forks) },
    { label: "Contributors", value: (p) => p.contributors.toLocaleString() },
    { label: "7D Growth", value: (p) => `${formatSigned(p.growth7d)} (${formatPct(growthRate(p, 7))})` },
    { label: "30D Growth", value: (p) => `${formatSigned(p.growth30d)} (${formatPct(growthRate(p, 30))})` },
    { label: "90D Growth", value: (p) => `${formatSigned(p.growth90d)} (${formatPct(growthRate(p, 90))})` },
    { label: "Technical", value: (p) => computeScores(p).technical, highlight: (s) => s.technical > 80 },
    { label: "Product", value: (p) => computeScores(p).product, highlight: (s) => s.product > 80 },
    { label: "Commercial", value: (p) => computeScores(p).commercial, highlight: (s) => s.commercial > 80 },
    { label: "Side Hustle", value: (p) => computeScores(p).sideHustle, highlight: (s) => s.sideHustle > 80 },
    { label: "Skill", value: (p) => computeScores(p).skill, highlight: (s) => s.skill > 80 },
    { label: "Resume", value: (p) => computeScores(p).resume, highlight: (s) => s.resume > 80 },
    { label: "Content", value: (p) => computeScores(p).content, highlight: (s) => s.content > 80 },
    { label: "Startup", value: (p) => computeScores(p).startup, highlight: (s) => s.startup > 80 },
    { label: "Opportunity", value: (p) => computeScores(p).opportunity, highlight: (s) => s.opportunity > 80 },
    { label: "Money", value: (p) => computeScores(p).money, highlight: (s) => s.money > 80 },
    { label: "Health", value: (p) => computeScores(p).health, highlight: (s) => s.health > 80 },
  ];

  const recommendation = useMemo(() => {
    if (selected.length < 2) return null;
    const scored = selected.map((p) => ({ p, s: computeScores(p) }));
    const best = (key: (s: { p: Project; s: ReturnType<typeof computeScores> }) => number) =>
      scored.reduce((a, b) => (key(a) >= key(b) ? a : b)).p.name;
    return [
      { goal: "赚钱 / 商业化", pick: best((x) => x.s.money), why: `Money Score 最高（${Math.max(...scored.map((x) => x.s.money))}）` },
      { goal: "学习 Agent / 技术", pick: best((x) => x.s.technical), why: `Technical Score 最高（${Math.max(...scored.map((x) => x.s.technical))}）` },
      { goal: "简历 / 求职", pick: best((x) => x.s.resume), why: `Resume Score 最高（${Math.max(...scored.map((x) => x.s.resume))}）` },
      { goal: "副业 / 一人创业", pick: best((x) => x.s.sideHustle), why: `Side Hustle Score 最高（${Math.max(...scored.map((x) => x.s.sideHustle))}）` },
    ];
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center"><Scale size={18} className="text-[#7dd3fc]" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">Compare · 项目对比</h1>
          <p className="text-[12.5px] text-[#8b98b3] mt-0.5">选择 2-4 个项目，系统自动生成指标对比与 AI 最终推荐</p>
        </div>
      </div>

      {/* Picker */}
      <div className="panel p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((p) => (
            <span key={p.slug} className="chip chip-accent !py-1.5 !pl-3">
              <Link href={`/projects/${p.slug}`} className="hover:underline">{p.name}</Link>
              <button onClick={() => remove(p.slug)} className="ml-1 text-[#8b98b3] hover:text-white"><X size={12} /></button>
            </span>
          ))}
          {selected.length < 4 && (
            <span className="chip !border-dashed">+ 添加项目（{selected.length}/4）</span>
          )}
        </div>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索要对比的项目…"
            className="w-full h-10 px-3.5 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[13px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
          />
          {query && (
            <div className="absolute top-11 left-0 right-0 panel p-2 z-20 max-h-72 overflow-y-auto">
              {candidates.length === 0 && <div className="px-3 py-2 text-[12px] text-[#5b6885]">无匹配</div>}
              {candidates.map((p) => (
                <button key={p.slug} onClick={() => add(p)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#16233d] text-left">
                  <span className="text-[13px] text-[#cfe0ff]">{p.name} <span className="text-[#5b6885]">· {p.owner} · ⭐{formatStars(p.stars)}</span></span>
                  <Plus size={14} className="text-[#7dd3fc]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected.length < 2 ? (
        <div className="panel p-12 text-center text-[13px] text-[#5b6885]">
          至少选择 2 个项目开始对比（可从 <Link href="/discover" className="text-[#7dd3fc] underline">Discover</Link> 或项目详情页加入）
        </div>
      ) : (
        <>
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#16213a]">
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#5b6885]">指标</th>
                    {selected.map((p) => (
                      <th key={p.slug} className="px-4 py-3 text-center">
                        <Link href={`/projects/${p.slug}`} className="font-bold text-white hover:text-[#7dd3fc]">{p.name}</Link>
                        <div className="text-[10.5px] text-[#5b6885] font-normal mt-0.5">{p.language} · ⭐{formatStars(p.stars)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const vals = selected.map((p) => ({ p, s: computeScores(p), v: row.value(p) }));
                    const maxIdx = vals.reduce((best, x, i) => (typeof x.v === "number" && typeof vals[best].v === "number" && (x.v as number) > (vals[best].v as number) ? i : best), 0);
                    return (
                      <tr key={row.label} className="border-b border-[#101a2e]">
                        <td className="px-4 py-2.5 text-[#8b98b3]">{row.label}</td>
                        {vals.map((x, i) => (
                          <td key={x.p.slug} className={`px-4 py-2.5 text-center num ${typeof x.v === "number" && i === maxIdx ? "text-emerald-300 font-bold" : "text-[#cfe0ff]"}`}>
                            {x.v}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {recommendation && (
            <div className="panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-[#7dd3fc]" />
                <span className="text-[14px] font-bold text-white">AI Final Recommendation</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendation.map((r) => (
                  <div key={r.goal} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
                    <div className="flex items-center gap-2">
                      <Check size={15} className="text-emerald-400" />
                      <span className="text-[13.5px] font-semibold text-white">{r.goal} → 推荐 <span className="text-[#7dd3fc]">{r.pick}</span></span>
                    </div>
                    <div className="text-[12px] text-[#8b98b3] mt-1">{r.why}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
