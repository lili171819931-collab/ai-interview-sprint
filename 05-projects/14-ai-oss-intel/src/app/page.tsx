import Link from "next/link";
import { ArrowRight, Search, Sparkles, TrendingUp, Star, Target, Coins, Zap, Layers, Database, LineChart } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { allCategories, categoryCounts, topBy, projectBySlug } from "@/lib/store";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { AiPmScoreCard } from "@/components/AiPmScoreCard";
import { computeScores, formatPct, formatSigned, formatStars } from "@/lib/engines";
import { ProjectCard } from "@/components/ProjectCard";
import { CategoryChips, Sparkline } from "@/components/ui";

export const dynamic = "force-static";

export default function HomePage() {
  const totalStars = PROJECTS.reduce((a, p) => a + p.stars, 0);
  const trending = [...PROJECTS].sort((a, b) => b.growth7d - a.growth7d).slice(0, 8);
  const cats = categoryCounts();
  const quickStats = [
    { label: "追踪项目", value: `${PROJECTS.length}`, sub: "AI 开源雷达" },
    { label: "总 Stars", value: formatStars(totalStars), sub: "+ 实时同步" },
    { label: "分类体系", value: `${allCategories().length}`, sub: "可扩展标签" },
    { label: "榜单类型", value: "9", sub: "多维排名" },
  ];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="panel p-8 md:p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#4f8cff]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[#7c5cff]/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="chip chip-accent mb-5"><Sparkles size={12} /> AI OPEN SOURCE INTELLIGENCE</div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            <span className="glow-text">发现 AI 开源项目</span>
            <br />
            比别人更早找到机会
          </h1>
          <p className="mt-4 text-[15px] text-[#aab6cd] leading-relaxed">
            Discover what is being built before everyone else discovers it.
            从 GitHub 海量项目中，用 Growth Intelligence + 10-Agent 共识分析，
            找到最值得 <b className="text-white">学习 · 复刻 · 副业 · 商业化</b> 的项目。
          </p>
          <form action="/ask" method="get" className="mt-6 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6885]" />
              <input
                name="q"
                placeholder="试试：最近30天增长最快、适合一个人做副业、能SaaS化的AI项目"
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[13.5px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
              />
            </div>
            <button className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-white text-[13.5px] font-semibold hover:opacity-90">
              智能分析
            </button>
          </form>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {quickStats.map((s) => (
              <div key={s.label} className="rounded-xl bg-[#0c1322]/70 border border-[#16213a] p-3.5">
                <div className="text-[11px] text-[#5b6885]">{s.label}</div>
                <div className="text-xl font-bold num text-white mt-1">{s.value}</div>
                <div className="text-[10.5px] text-[#4d5a75]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT SHOULD I STUDY TODAY? */}
      <StudyToday />

      <HomeRadarSection />

      {/* Trending */}
      <section>
        <SectionHead icon={Zap} title="🔥 Trending AI Projects" sub="近 7 天 Star 增长最快的项目" href="/rankings/growth" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {trending.map((p, i) => (
            <Link key={p.slug} href={`/projects/${p.slug}`} className="panel card-hover p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#4d5a75] num">#{String(i + 1).padStart(2, "0")}</span>
                <span className="text-emerald-300 text-[12px] num font-semibold">+{formatSigned(p.growth7d)} ⭐</span>
              </div>
              <div className="font-bold text-[14.5px] text-white truncate">{p.name}</div>
              <div className="text-[12px] text-[#8b98b3] line-clamp-2 min-h-[32px]">{p.tagline}</div>
              <Sparkline points={p.growthHistory} width={200} height={40} />
              <CategoryChips project={p} limit={2} />
            </Link>
          ))}
        </div>
      </section>

      {/* Rank previews */}
      <section className="space-y-8">
        <RankPreview kind="stars" icon={Star} color="#fbbf24" title="Star Top 10" sub="Stars 总量排名" href="/rankings/stars" />
        <RankPreview kind="growth" icon={TrendingUp} color="#34d399" title="Fastest Growth Top 10" sub="近 30 天绝对增长" href="/rankings/growth" />
        <RankPreview kind="opportunity" icon={Target} color="#7dd3fc" title="AI Opportunity Top 10" sub="平台最核心的机会榜" href="/rankings/opportunity" />
        <RankPreview kind="money" icon={Coins} color="#f87171" title="Money Making Top 10" sub="赚钱潜力排名" href="/rankings/money" />
      </section>

      {/* Categories */}
      <section>
        <SectionHead icon={Layers} title="按分类探索" sub="30 大分类体系" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {cats.slice(0, 20).map((c) => {
            const cat = allCategories().find((x) => x.id === c.id)!;
            return (
              <Link key={c.id} href={`/discover?category=${c.id}`} className="panel card-hover px-3.5 py-3 flex items-center justify-between">
                <span className="text-[12.5px] text-[#cfe0ff]">{cat.emoji} {cat.name}</span>
                <span className="text-[10.5px] text-[#5b6885] num">{c.count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Insight strip */}
      <section className="panel p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f8cff] to-[#7c5cff] flex items-center justify-center shrink-0"><LineChart size={19} className="text-white" /></div>
        <div className="flex-1">
          <div className="text-[15px] font-bold text-white">Growth Intelligence Engine</div>
          <div className="text-[12.5px] text-[#8b98b3] mt-1">
            系统计算每个项目 7 / 30 / 90 天 Star 增长与增长率，结合 10 个 Agent 的共识评分，输出
            <span className="text-[#7dd3fc]"> Opportunity Score</span> — 不只看谁 Star 多，更看谁现在最值得行动。
          </div>
        </div>
        <div className="flex gap-2.5">
          {[
            { k: "Growth", v: "15%" },
            { k: "Demand", v: "20%" },
            { k: "Commercial", v: "20%" },
            { k: "Innovation", v: "15%" },
            { k: "Ecosystem", v: "10%" },
            { k: "Low Comp.", v: "10%" },
          ].map((x) => (
            <div key={x.k} className="text-center">
              <div className="text-[11px] text-[#5b6885]">{x.k}</div>
              <div className="text-[13px] font-bold text-white num">{x.v}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ icon: Icon, title, sub, href }: { icon: any; title: string; sub: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-[17px] font-bold text-white flex items-center gap-2"><Icon size={18} className="text-[#4f8cff]" />{title}</h2>
        <div className="text-[12px] text-[#5b6885] mt-0.5">{sub}</div>
      </div>
      {href && (
        <Link href={href} className="text-[12.5px] text-[#7dd3fc] hover:underline flex items-center gap-1">
          查看全部 <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

function RankPreview({ kind, icon: Icon, color, title, sub, href }: {
  kind: "stars" | "growth" | "opportunity" | "money";
  icon: any; color: string; title: string; sub: string; href: string;
}) {
  const items = topBy(kind, 10);
  return (
    <section>
      <SectionHead icon={Icon} title={title} sub={sub} href={href} />
      <div className="grid gap-3 md:grid-cols-2">
        {items.slice(0, 10).map(({ project, scores, rank, delta }) => (
          <Link key={project.slug} href={`/projects/${project.slug}`} className="panel card-hover px-4 py-3 flex items-center gap-3">
            <div className="w-8 text-center font-bold num" style={{ color }}>{String(rank).padStart(2, "0")}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[13.5px] text-white truncate">{project.name}</span>
                {delta > 0 && <span className="text-[10.5px] text-emerald-400 num">▲{delta}</span>}
                {delta < 0 && <span className="text-[10.5px] text-rose-400 num">▼{Math.abs(delta)}</span>}
              </div>
              <div className="text-[11.5px] text-[#5b6885] truncate mt-0.5">
                ⭐{formatStars(project.stars)} · ↗ {formatSigned(project.growth30d)} ({formatPct((project.growth30d / (project.stars - project.growth30d)) * 100)})
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10.5px] text-[#5b6885]">Score</div>
              <div className="font-bold num text-[15px]" style={{ color }}>
                {kind === "stars" ? formatStars(project.stars) : kind === "growth" ? formatSigned(project.growth30d) : scores[kind]}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}


function StudyToday() {
  const day = Math.floor(Date.now() / 86400000);
  const lists = {
    opportunity: topBy("opportunity", 12),
    money: topBy("money", 12),
    content: topBy("content", 12),
    resume: topBy("resume", 12),
    growth: topBy("growth", 12),
  };
  const pick = (kind: keyof typeof lists, offset: number) => {
    const list = lists[kind];
    const slug = list[(day + offset) % list.length]?.project.slug ?? list[0]?.project.slug ?? "";
    return projectBySlug(slug) ?? PROJECTS[0];
  };
  const entries = [
    { emoji: "🔥", label: "今天最值得研究的 AI 项目", tag: "OPPORTUNITY", color: "#f87171", p: pick("opportunity", 0) },
    { emoji: "🧠", label: "最能补齐产品能力的项目", tag: "GROWTH", color: "#7dd3fc", p: pick("growth", 3) },
    { emoji: "💰", label: "今天最值得研究的商业项目", tag: "MONEY", color: "#fbbf24", p: pick("money", 1) },
    { emoji: "🎬", label: "最适合做自媒体内容的项目", tag: "CONTENT", color: "#f472b6", p: pick("content", 2) },
    { emoji: "💼", label: "最适合写进 Portfolio 的项目", tag: "PORTFOLIO", color: "#a78bfa", p: pick("resume", 4) },
  ];
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={17} className="text-[#fbbf24]" />
        <h2 className="text-[17px] font-bold text-white">WHAT SHOULD I STUDY TODAY?</h2>
        <span className="text-[11.5px] text-[#5b6885]">今天的 AI PM 学习推荐（每日轮换）</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {entries.map((it) => {
          const s = computeScores(it.p);
          const ts = timeStatusOf(it.p);
          const meta = TIME_STATUS_META[ts];
          return (
            <Link key={it.label} href={`/projects/${it.p.slug}`} className="panel card-hover p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[20px]">{it.emoji}</span>
                <span className="chip" style={{ color: it.color, borderColor: it.color + "55", background: it.color + "12" }}>{it.tag}</span>
              </div>
              <div className="text-[11px] text-[#5b6885]">{it.label}</div>
              <div className="font-bold text-white text-[15px]">{it.p.name}</div>
              <div className="text-[11.5px] text-[#5b6885] line-clamp-2">{it.p.tagline}</div>
              <div className="mt-auto flex items-center justify-between text-[11px] num text-[#8b98b3]">
                <span>⭐ {formatStars(it.p.stars)} · Opp {s.opportunity}</span>
                <span style={{ color: meta.color }}>{meta.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}


function HomeRadarSection() {
  const all = PROJECTS;
  const hot = all
    .filter((p) => ["2026NEW", "2026RISING"].includes(timeStatusOf(p)))
    .sort((a, b) => computeScores(b).opportunity - computeScores(a).opportunity)
    .slice(0, 5);
  const rising = all
    .filter((p) => timeStatusOf(p) === "2026RISING")
    .sort((a, b) => b.growth30d - a.growth30d)
    .slice(0, 5);
  const fastest = [...all].sort((a, b) => b.growth7d - a.growth7d).slice(0, 5);
  const gems = all
    .filter((p) => p.stars < 30000 && computeScores(p).opportunity >= 70)
    .sort((a, b) => computeScores(b).opportunity - computeScores(a).opportunity)
    .slice(0, 5);
  const lists = [
    { title: "🔥 2026 HOT", color: "#f87171", items: hot },
    { title: "🚀 2026 RISING", color: "#7dd3fc", items: rising },
    { title: "⚡ FASTEST GROWING", color: "#34d399", items: fastest },
    { title: "💎 HIDDEN GEMS", color: "#f472b6", items: gems },
  ];
  return (
    <section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4 md:grid-cols-2">
          {lists.map((l) => (
            <div key={l.title} className="panel p-4">
              <div className="text-[13px] font-bold mb-3" style={{ color: l.color }}>{l.title}</div>
              <div className="space-y-1.5">
                {l.items.map((p, i) => {
                  const s = computeScores(p);
                  const ts = timeStatusOf(p);
                  return (
                    <Link key={p.slug} href={`/projects/${p.slug}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#101a2e]">
                      <span className="w-4 text-center text-[11px] font-bold num text-[#4d5a75]">{i + 1}</span>
                      <span className="flex-1 truncate text-[12.5px] text-[#cfe0ff]">{p.name}</span>
                      <span className="text-[11px] num text-emerald-300">↗{formatSigned(p.growth30d)}</span>
                      <span className="text-[11px] num text-[#7dd3fc]">Opp {s.opportunity}</span>
                      <span className="chip !text-[9.5px]" style={{ color: TIME_STATUS_META[ts].color, borderColor: TIME_STATUS_META[ts].color + "55" }}>{TIME_STATUS_META[ts].label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div>
          <AiPmScoreCard />
          <Link href="/rankings/categories" className="panel card-hover p-4 mt-4 block">
            <div className="text-[13px] font-bold text-white mb-1">📂 分类 TOP 榜</div>
            <div className="text-[11.5px] text-[#5b6885]">每个一级分类独立榜单 + 二级场景</div>
          </Link>
        </div>
      </div>
    </section>
  );
}
