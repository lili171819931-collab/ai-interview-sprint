"use client";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, Flame, Lightbulb, BarChart3, FolderKanban, Radio, ExternalLink } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { categoryCounts } from "@/lib/store";
import { answerQuery } from "@/lib/query";
import { categoryOf } from "@/lib/categories";
import { useDb } from "@/lib/db";
import { CategoryChips, Sparkline } from "@/components/ui";

export default function InsightsPage() {
  return (
    <Suspense fallback={<div className="panel p-12 text-center text-[#5b6885]">加载中…</div>}>
      <InsightsInner />
    </Suspense>
  );
}

function InsightsInner() {
  const today = new Date().toISOString().slice(0, 10);
  const { state, syncing } = useDb();
  const totalGrowth30 = PROJECTS.reduce((a, p) => a + p.growth30d, 0);
  const hottest = useMemo(() => [...PROJECTS].sort((a, b) => growthRate(b, 30) - growthRate(a, 30)).slice(0, 6), []);
  const cats = categoryCounts().slice(0, 8);
  const top3 = useMemo(() => answerQuery("找出最近30天增长最快、适合个人开发者、可以做副业、最好能SaaS化的AI项目").projects.slice(0, 3), []);
  const liveTop = useMemo(() => [...state.repos].sort((a, b) => b.stars - a.stars).slice(0, 6), [state.repos]);

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-2"><Sparkles size={17} className="text-[#7dd3fc]" /><h1 className="text-xl font-bold text-white">AI Insights · 每日智能洞察</h1></div>
        <p className="text-[13px] text-[#8b98b3]">AI Open Source Daily · {today} · 自动生成的市场快照与行动雷达 · 全部洞察数据已关联「分类 TOP 榜」并实时同步 GitHub（{state.repos.length} 个实时项目{syncing ? " · 同步中…" : ""}）</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="追踪项目（快照+实时）" value={`${PROJECTS.length + state.repos.length}`} sub={`快照 ${PROJECTS.length} + 实时 ${state.repos.length}`} color="#ffffff" />
        <Stat label="30 天总增长" value={`+${formatStars(totalGrowth30)}`} sub="Stars 增量（快照）" color="#34d399" />
        <Stat label="机会分最高" value={String(Math.max(...PROJECTS.map((p) => computeScores(p).opportunity)))} sub="/100" color="#7dd3fc" />
        <Stat label="活跃分类" value={`${cats.length}`} sub="TOP 分类" />
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3"><Lightbulb size={17} className="text-[#fbbf24]" /><h2 className="text-[16px] font-bold text-white">如果你只有一个人，30 天内最值得做的 3 个项目</h2></div>
        <div className="panel p-5">
          <p className="text-[13px] text-[#8b98b3] mb-4">综合 Growth / Opportunity / Side Hustle / Money / Startup 五维评分，结合单人开发可行性：</p>
          <div className="space-y-4">
            {top3.map(({ project, scores }, i) => {
              const r30 = growthRate(project, 30);
              return (
                <div key={project.slug} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2f6bff] to-[#7c5cff] flex items-center justify-center text-[13px] font-bold text-white num">{i + 1}</span>
                    <Link href={`/projects/${project.slug}`} className="font-bold text-white text-[15px] hover:text-[#7dd3fc]">{project.name}</Link>
                    <span className="chip chip-accent">Opportunity {scores.opportunity}</span>
                    <span className="chip">Money {scores.money}</span>
                    <span className="chip">SideHustle {scores.sideHustle}</span>
                  </div>
                  <div className="text-[12.5px] text-[#5b6885] mt-1.5">{project.tagline}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] num text-[#8b98b3]">
                    <span>⭐ {formatStars(project.stars)}</span>
                    <span className="text-emerald-300">↗ 30D {formatSigned(project.growth30d)} ({formatPct(r30)})</span>
                    <span>语言 {project.language}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 分类洞察 · 关联分类 TOP 榜 */}
      <section>
        <div className="flex items-center gap-2 mb-3"><FolderKanban size={17} className="text-[#7dd3fc]" /><h2 className="text-[16px] font-bold text-white">分类洞察 · 关联分类 TOP 榜</h2></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cats.slice(0, 8).map((c) => {
            const cat = categoryOf(c.id);
            const top = PROJECTS.filter((p) => p.categories.includes(c.id))
              .map((p) => ({ p, s: computeScores(p) }))
              .sort((a, b) => b.s.opportunity - a.s.opportunity)
              .slice(0, 3);
            return (
              <Link key={c.id} href={`/rankings/category/${c.id}`} className="panel card-hover p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white">{cat.emoji} {cat.name}</span>
                  <span className="chip">{c.count} 个</span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {top.map(({ p, s }, i) => (
                    <div key={p.slug} className="flex items-center gap-2 text-[12px]">
                      <span className="w-4 text-center font-bold num text-[#7dd3fc]">{i + 1}</span>
                      <span className="flex-1 truncate text-[#cfe0ff]">{p.name}</span>
                      <span className="num text-[#5b6885]">Opp {s.opportunity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-[#7dd3fc]">进入收藏榜/增长榜 →</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 实时 GitHub 项目 */}
      {state.repos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3"><Radio size={17} className="text-emerald-400" /><h2 className="text-[16px] font-bold text-white">GitHub 实时项目 · 全球最新热点</h2></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {liveTop.map((r) => (
              <a key={r.fullName} href={`https://github.com/${r.fullName}`} target="_blank" className="panel card-hover p-4 block">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white text-[14px] truncate">{r.name} <ExternalLink size={11} className="inline text-[#4d5a75]" /></span>
                  <span className="text-[12px] num text-[#fbbf24]">⭐{formatStars(r.stars)}</span>
                </div>
                <div className="text-[12px] text-[#5b6885] mt-0.5 line-clamp-2 min-h-[32px]">{r.description ?? r.fullName}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="chip">发布于 {r.createdAt}</span>
                  {r.language && <span className="chip">{r.language}</span>}
                  {r.topics.slice(0, 2).map((t) => <span key={t} className="chip">#{t}</span>)}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Hottest by rate */}
      <section>
        <div className="flex items-center gap-2 mb-3"><Flame size={17} className="text-[#f87171]" /><h2 className="text-[16px] font-bold text-white">增长率最高 · Rising Stars（快照）</h2></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {hottest.map((p) => (
            <Link key={p.slug} href={`/projects/${p.slug}`} className="panel card-hover p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-[14px]">{p.name}</span>
                <span className="text-emerald-300 text-[12px] num font-semibold">{formatPct(growthRate(p, 30))} / 30D</span>
              </div>
              <div className="text-[12px] text-[#5b6885] mt-0.5 truncate">{p.tagline}</div>
              <div className="mt-2"><Sparkline points={p.growthHistory} width={260} height={40} /></div>
              <div className="mt-2 flex items-center gap-3 text-[11.5px] num text-[#8b98b3]">
                <span>⭐{formatStars(p.stars)}</span><span>↗ {formatSigned(p.growth30d)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category heat */}
      <section>
        <div className="flex items-center gap-2 mb-3"><BarChart3 size={17} className="text-[#a78bfa]" /><h2 className="text-[16px] font-bold text-white">分类热度</h2></div>
        <div className="panel p-5">
          <div className="space-y-3">
            {cats.map((c, i) => {
              const cat = categoryOf(c.id);
              const width = 100 - i * 6;
              return (
                <Link key={c.id} href={`/rankings/category/${c.id}`} className="flex items-center gap-3 group">
                  <span className="w-32 text-[12.5px] text-[#8b98b3] group-hover:text-white truncate">{cat.emoji} {cat.name}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#141e33] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#4f8cff] to-[#7c5cff]" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-8 text-right text-[12px] num text-[#5b6885]">{c.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3"><TrendingUp size={17} className="text-[#34d399]" /><h2 className="text-[16px] font-bold text-white">Market Pulse</h2></div>
        <div className="panel p-5 text-[13.5px] text-[#aab6cd] leading-relaxed space-y-2">
          <p>过去 30 天，被追踪的 {PROJECTS.length} 个快照项目共新增 <b className="text-emerald-300 num">+{formatStars(totalGrowth30)}</b> Stars；另有 {state.repos.length} 个 GitHub 实时项目同步入库。</p>
          <p>Agent / MCP / Skill 三个赛道保持最高热度：{cats.filter((c) => ["agent", "mcp", "skill"].includes(c.id)).map((c) => categoryOf(c.id).name).join("、")} 占据头部。</p>
          <p>单人创业窗口：机会分 Top 项目集中在「开源核心 + 托管 SaaS + Skill 封装」三种变现组合，7-30 天可启动 MVP。</p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, color = "#ffffff" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="panel p-4">
      <div className="text-[11px] text-[#5b6885]">{label}</div>
      <div className="text-2xl font-extrabold num mt-1" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[#4d5a75]">{sub}</div>
    </div>
  );
}
