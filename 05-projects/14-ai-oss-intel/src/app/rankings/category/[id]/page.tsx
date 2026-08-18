import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { allCategories, categoryLabel } from "@/lib/store";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { scenariosOf, secondaryScenariosOf, timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { Sparkline } from "@/components/ui";
import { GithubIcon } from "@/components/icons";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-static";

export function generateStaticParams() {
  return allCategories().map((c) => ({ id: c.id }));
}

export default async function CategoryRankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = categoryOf(id as CategoryId);
  if (!cat) notFound();
  const projects = PROJECTS.filter((p) => p.categories.includes(id as CategoryId))
    .map((p) => ({ p, s: computeScores(p) }))
    .sort((a, b) => b.s.opportunity - a.s.opportunity);

  return (
    <div className="space-y-5">
      <div className="panel p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-xl">{cat.emoji}</div>
          <div>
            <h1 className="text-xl font-bold text-white">{cat.name} · 分类 TOP 榜</h1>
            <p className="text-[12.5px] text-[#8b98b3] mt-0.5">{cat.nameZh} · 该分类下 {projects.length} 个项目，按 AI Opportunity Score 排名 · 二级场景：{secondaryScenariosOf(projects[0]?.p ?? PROJECTS[0]).map((x) => x.name).join(" / ")}</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {allCategories().slice(0, 14).map((c) => (
              <Link key={c.id} href={`/rankings/category/${c.id}`} className={`chip ${c.id === id ? "chip-accent" : ""}`}>{c.emoji} {c.name}</Link>
            ))}
            <Link href="/rankings/categories" className="chip">全部分类 →</Link>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[820px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
                <th className="px-4 py-3">#</th>
                <th className="px-2 py-3">项目</th>
                <th className="px-2 py-3 text-right num">Stars</th>
                <th className="px-2 py-3 text-right num">30D</th>
                <th className="px-2 py-3 text-right num">Opp</th>
                <th className="px-2 py-3 text-right num">Tech</th>
                <th className="px-2 py-3 text-right num">Money</th>
                <th className="px-2 py-3 text-right num">趋势</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(({ p, s }, i) => {
                const ts = timeStatusOf(p);
                const meta = TIME_STATUS_META[ts];
                return (
                  <tr key={p.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                    <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#7dd3fc" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-2 py-3">
                      <Link href={`/projects/${p.slug}`} className="block max-w-[280px]">
                        <div className="font-semibold text-white truncate hover:text-[#7dd3fc]">{p.name}</div>
                        <div className="text-[11.5px] text-[#5b6885] truncate">{p.tagline}</div>
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-right num text-[#cfe0ff]">{formatStars(p.stars)}</td>
                    <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 30))}</div></td>
                    <td className="px-2 py-3 text-right num font-bold text-[#7dd3fc]">{s.opportunity}</td>
                    <td className="px-2 py-3 text-right num text-[#34d399]">{s.technical}</td>
                    <td className="px-2 py-3 text-right num text-[#f87171]">{s.money}</td>
                    <td className="px-2 py-3"><div className="flex justify-end"><Sparkline points={p.growthHistory} width={84} height={28} /></div></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="chip" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "12" }}>{meta.label}</span>
                        <a href={`https://github.com/${p.fullName}`} target="_blank" className="chip !text-[11px]"><GithubIcon size={11} /> GitHub</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
