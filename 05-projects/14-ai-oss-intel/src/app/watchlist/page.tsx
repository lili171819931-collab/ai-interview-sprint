"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Radar, Trash2, Bell, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate, rankProjects, seededRandom } from "@/lib/engines";
import { CategoryChips, Sparkline } from "@/components/ui";
import type { Project } from "@/lib/types";

export default function WatchlistPage() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aioss.watchlist") ?? "[]";
      setSlugs(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const remove = (slug: string) => {
    const next = slugs.filter((s) => s !== slug);
    setSlugs(next);
    try { localStorage.setItem("aioss.watchlist", JSON.stringify(next)); } catch {}
  };

  const projects = slugs.map((s) => PROJECTS.find((p) => p.slug === s)).filter(Boolean) as Project[];
  const alerts = projects.map((p) => buildAlert(p)).filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center"><Radar size={18} className="text-[#7dd3fc]" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">My AI Radar · 我的雷达</h1>
          <p className="text-[12.5px] text-[#8b98b3] mt-0.5">自动监控 Star 增长、排名变化、商业化趋势与重大更新</p>
        </div>
      </div>

      {!ready ? (
        <div className="panel p-12 text-center text-[#5b6885]">加载中…</div>
      ) : projects.length === 0 ? (
        <div className="panel p-12 text-center space-y-3">
          <Radar size={32} className="mx-auto text-[#33415e]" />
          <div className="text-[14px] text-[#8b98b3]">雷达还是空的</div>
          <div className="text-[12.5px] text-[#5b6885]">在项目卡片或详情页点击 Save，把它们加入你的 AI 雷达</div>
          <Link href="/discover" className="inline-block mt-2 h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white flex items-center justify-center gap-1.5 w-fit mx-auto">去发现项目</Link>
        </div>
      ) : (
        <>
          {alerts.length > 0 && (
            <div className="panel p-5">
              <div className="flex items-center gap-2 mb-3"><Bell size={15} className="text-[#fbbf24]" /><span className="text-[13px] font-bold text-white">智能提醒</span></div>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className="text-[13px] text-[#cfe0ff] leading-relaxed">{a}</div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => {
              const s = computeScores(p);
              const r30 = growthRate(p, 30);
              return (
                <div key={p.slug} className="panel card-hover p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/projects/${p.slug}`} className="font-bold text-[15px] text-white hover:text-[#7dd3fc]">{p.name}</Link>
                      <div className="text-[12px] text-[#5b6885] mt-0.5 truncate">{p.tagline}</div>
                    </div>
                    <button onClick={() => remove(p.slug)} className="text-[#5b6885] hover:text-rose-400"><Trash2 size={15} /></button>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[12px] num text-[#8b98b3]">
                    <span className="flex items-center gap-1"><Star size={13} className="text-amber-300" /> {formatStars(p.stars)}</span>
                    <span className="text-emerald-300">↗ {formatSigned(p.growth30d)} ({formatPct(r30)})</span>
                    <span className="text-[#7dd3fc]">Opportunity {s.opportunity}</span>
                    <span className="text-[#a78bfa]">Money {s.money}</span>
                  </div>
                  <div className="mt-2"><CategoryChips project={p} limit={2} /></div>
                  <div className="mt-3"><Sparkline points={p.growthHistory} width={320} height={48} /></div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/projects/${p.slug}`} className="chip chip-accent">深度分析</Link>
                    <Link href={`/compare?a=${p.slug}`} className="chip">对比</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function buildAlert(p: Project): string | null {
  const r7 = growthRate(p, 7);
  const r30 = growthRate(p, 30);
  const growthRank = rankProjects(PROJECTS, "growth", 50).findIndex((x) => x.project.slug === p.slug);
  const oppRank = rankProjects(PROJECTS, "opportunity", 50).findIndex((x) => x.project.slug === p.slug);
  const rand = seededRandom(p.id + "alert");
  const parts: string[] = [];
  if (r7 > 12) parts.push(`🔥 <b class="text-emerald-300">${p.name}</b> 最近 7 天 Star 增长 ${formatPct(r7)}，处于爆发期，建议重点关注`);
  if (r30 > 18) parts.push(`🚀 ${p.name} 近 30 天增长 ${formatSigned(p.growth30d)}（${formatPct(r30)}），在 Growth Top 50 中排 #${growthRank + 1}`);
  if (oppRank >= 0 && oppRank < 10) parts.push(`💡 ${p.name} 进入 AI Opportunity Top 10（#${oppRank + 1}），机会分 ${computeScores(p).opportunity}`);
  if (rand > 0.82) parts.push(`💰 ${p.name} 出现明显商业化趋势（新版本/云服务/企业版），建议评估变现路径`);
  if (parts.length === 0) parts.push(`📊 ${p.name} 状态稳定，7 天增长 ${formatPct(r7)}，保持观察`);
  return parts[0];
}
