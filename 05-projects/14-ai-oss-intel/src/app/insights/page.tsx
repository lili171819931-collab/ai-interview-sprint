import Link from "next/link";
import { Sparkles, TrendingUp, Flame, Lightbulb, BarChart3, ArrowRight } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { categoryCounts } from "@/lib/store";
import { answerQuery } from "@/lib/query";
import { CategoryChips, Sparkline } from "@/components/ui";
import { categoryOf } from "@/lib/categories";

export const dynamic = "force-static";

export default function InsightsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const totalGrowth30 = PROJECTS.reduce((a, p) => a + p.growth30d, 0);
  const hottest = [...PROJECTS].sort((a, b) => growthRate(b, 30) - growthRate(a, 30)).slice(0, 6);
  const cats = categoryCounts().slice(0, 8);

  const top3 = answerQuery("找出最近30天增长最快、适合个人开发者、可以做副业、最好能SaaS化的AI项目").projects.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-2"><Sparkles size={17} className="text-[#7dd3fc]" /><h1 className="text-xl font-bold text-white">AI Insights · 每日智能洞察</h1></div>
        <p className="text-[13px] text-[#8b98b3]">AI Open Source Daily · {today} · 自动生成的市场快照与行动雷达</p>
      </div>

      {/* Market summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="追踪项目" value={`${PROJECTS.length}`} sub="AI 开源雷达" />
        <Stat label="30 天总增长" value={`+${formatStars(totalGrowth30)}`} sub="Stars 增量" color="#34d399" />
        <Stat label="机会分最高" value={String(Math.max(...PROJECTS.map((p) => computeScores(p).opportunity)))} sub="/100" color="#7dd3fc" />
        <Stat label="活跃分类" value={`${cats.length}`} sub="TOP 分类" />
      </div>

      {/* The 3 worth doing */}
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

      {/* Hottest by rate */}
      <section>
        <div className="flex items-center gap-2 mb-3"><Flame size={17} className="text-[#f87171]" /><h2 className="text-[16px] font-bold text-white">增长率最高 · Rising Stars</h2></div>
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
                <Link key={c.id} href={`/discover?category=${c.id}`} className="flex items-center gap-3 group">
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

      {/* Trending strip */}
      <section>
        <div className="flex items-center gap-2 mb-3"><TrendingUp size={17} className="text-[#34d399]" /><h2 className="text-[16px] font-bold text-white">Market Pulse</h2></div>
        <div className="panel p-5 text-[13.5px] text-[#aab6cd] leading-relaxed space-y-2">
          <p>过去 30 天，被追踪的 {PROJECTS.length} 个项目共新增 <b className="text-emerald-300 num">+{formatStars(totalGrowth30)}</b> Stars。</p>
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
