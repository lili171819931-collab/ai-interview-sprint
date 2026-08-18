"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star, TrendingUp, Puzzle, Radar, RefreshCw, Sparkles, GitFork } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { PROJECTS } from "@/data/projects";
import { topBy } from "@/lib/store";
import { computeScores, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { timeStatusOf, TIME_STATUS_META, scenariosOf } from "@/lib/scenarios";
import { buildMyProjectReport } from "@/lib/reverse";
import { categoryOf } from "@/lib/categories";
import type { Project, TimeStatus } from "@/lib/types";

interface StarredRepo { fullName: string; name: string; owner: string; stars: number; url: string }

export default function MyGitHubPage() {
  const [saved, setSaved] = useState<string[]>([]);
  const [user, setUser] = useState("");
  const [starred, setStarred] = useState<StarredRepo[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aioss.watchlist") ?? "[]";
      setSaved(JSON.parse(raw));
      setUser(localStorage.getItem("aioss.github.user") ?? "");
      const st = localStorage.getItem("aioss.github.starred");
      if (st) setStarred(JSON.parse(st));
    } catch {}
    setReady(true);
  }, []);

  const savedProjects = useMemo(
    () => saved.map((s) => PROJECTS.find((p) => p.slug === s)).filter(Boolean) as Project[],
    [saved]
  );
  const starredProjects = useMemo(
    () => starred.map((r) => PROJECTS.find((p) => p.fullName.toLowerCase() === r.fullName.toLowerCase())).filter(Boolean) as Project[],
    [starred]
  );
  const starredUnknown = useMemo(
    () => starred.filter((r) => !PROJECTS.some((p) => p.fullName.toLowerCase() === r.fullName.toLowerCase())),
    [starred]
  );

  const sync = async () => {
    if (!user.trim()) { setSyncNote("先输入 GitHub 用户名"); return; }
    setSyncing(true);
    setSyncNote("");
    try {
      const all: StarredRepo[] = [];
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user.trim())}/starred?per_page=100&page=${page}`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        const items = (await res.json()) as { full_name: string; stargazers_count: number; html_url: string }[];
        if (items.length === 0) break;
        for (const it of items) all.push({ fullName: it.full_name, name: it.full_name.split("/")[1], owner: it.full_name.split("/")[0], stars: it.stargazers_count, url: it.html_url });
        if (items.length < 100) break;
      }
      setStarred(all);
      try {
        localStorage.setItem("aioss.github.user", user.trim());
        localStorage.setItem("aioss.github.starred", JSON.stringify(all));
      } catch {}
      setSyncNote(`✓ 已同步 ${all.length} 个 Star 项目（${user.trim()}）`);
    } catch (e) {
      setSyncNote(`✗ 同步失败：${(e as Error).message}（未认证 GitHub API 限额 60 次/小时；可稍后重试）`);
    }
    setSyncing(false);
  };

  // Interest graph
  const interest = useMemo(() => {
    const pool = savedProjects.length > 0 ? savedProjects : starredProjects;
    const counts = new Map<string, number>();
    for (const p of pool) for (const c of p.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    return [...counts.entries()].map(([id, n]) => ({ id: id as Project["categories"][number], pct: Math.round((n / total) * 100), n })).sort((a, b) => b.n - a.n).slice(0, 6);
  }, [savedProjects, starredProjects]);

  const globalInterest = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of PROJECTS) for (const c of p.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    return [...counts.entries()].map(([id, n]) => ({ id: id as Project["categories"][number], pct: Math.round((n / total) * 100) })).sort((a, b) => b.pct - a.pct).slice(0, 6);
  }, []);

  const myCatIds = new Set(interest.map((i) => i.id));
  const missed = globalInterest.filter((g) => !myCatIds.has(g.id)).slice(0, 3);

  const hiddenGems = useMemo(() => {
    if (interest.length === 0) return topBy("opportunity", 6).map((r) => r.project).filter((p) => !saved.includes(p.slug) && !starredProjects.some((x) => x.slug === p.slug)).slice(0, 6);
    const ids = new Set(interest.map((i) => i.id));
    return PROJECTS.filter((p) => !saved.includes(p.slug) && !starredProjects.some((x) => x.slug === p.slug) && p.categories.some((c) => ids.has(c)))
      .sort((a, b) => computeScores(b).opportunity - computeScores(a).opportunity)
      .slice(0, 6);
  }, [interest, saved, starredProjects]);

  const radarItems = useMemo(() => {
    const pool = savedProjects.length > 0 ? savedProjects : starredProjects;
    return pool.map((p) => {
      const s = computeScores(p);
      const ts = timeStatusOf(p);
      const icons: string[] = [];
      if (ts === "2026RISING" || ts === "2026NEW") icons.push("🔥");
      if (growthRate(p, 30) > 8) icons.push("🚀");
      if (s.money > 75) icons.push("💰");
      if (s.skill > 70) icons.push("🧩");
      if (p.categories.includes("agent")) icons.push("🤖");
      if (p.categories.includes("rag") || p.categories.includes("pkm")) icons.push("📚");
      icons.push("⭐");
      return { p, s, ts, icons };
    });
  }, [savedProjects, starredProjects]);

  const rising = useMemo(() => [...(savedProjects.length ? savedProjects : starredProjects)].sort((a, b) => b.growth30d - a.growth30d), [savedProjects, starredProjects]);
  const favorites2026 = useMemo(() => {
    const pool = savedProjects.length ? savedProjects : starredProjects;
    return pool.filter((p) => ["2026NEW", "2026RISING", "2026ACTIVE"].includes(timeStatusOf(p)));
  }, [savedProjects, starredProjects]);

  const activePool = savedProjects.length > 0 ? savedProjects : starredProjects;

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-2"><GithubIcon size={18} className="text-[#7dd3fc]" /><h1 className="text-xl font-bold text-white">My GitHub · 我的 GitHub 收藏雷达</h1></div>
        <p className="text-[13px] text-[#8b98b3]">同步你的 GitHub Stars，自动分析 2026 状态、增长与兴趣图谱，发现漏掉的宝藏项目。</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="GitHub 用户名（如 lili171819931-collab）" className="h-9 flex-1 min-w-[220px] max-w-xs px-3 rounded-lg bg-[#0c1322] border border-[#1c2942] text-[13px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]" />
          <button onClick={sync} disabled={syncing} className="h-9 px-4 rounded-lg bg-[#1a2a4a] border border-[#2c4370] text-[12.5px] text-white flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> 同步 GitHub Stars
          </button>
          <span className="text-[11.5px] text-[#5b6885] self-center">未同步时使用平台内已收藏项目（My AI Radar）作为数据源</span>
        </div>
        {syncNote && <div className="mt-2 text-[12.5px] text-[#8b98b3]">{syncNote}</div>}
        {!ready && <div className="mt-2 text-[12px] text-[#5b6885]">加载中…</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Star} label="已收藏 / 已同步" value={`${activePool.length}`} color="#fbbf24" />
        <Metric icon={TrendingUp} label="2026 Rising" value={`${favorites2026.filter((p) => timeStatusOf(p) === "2026RISING").length}`} color="#7dd3fc" />
        <Metric icon={Sparkles} label="2026 New" value={`${favorites2026.filter((p) => timeStatusOf(p) === "2026NEW").length}`} color="#34d399" />
        <Metric icon={GitFork} label="漏掉的机会（推荐）" value={`${hiddenGems.length}`} color="#f472b6" />
      </div>

      {/* My Project Radar */}
      <div className="panel p-5">
        <div className="text-[14px] font-bold text-white mb-3 flex items-center gap-2"><Radar size={15} className="text-[#7dd3fc]" /> My Project Radar</div>
        {activePool.length === 0 ? (
          <div className="text-[12.5px] text-[#5b6885]">还没有数据。去项目卡片点 Save，或输入 GitHub 用户名同步 Stars。</div>
        ) : (
          <div className="space-y-2">
            {radarItems.map(({ p, s, ts, icons }) => (
              <Link key={p.slug} href={`/projects/${p.slug}`} className="flex flex-wrap items-center gap-2.5 rounded-xl bg-[#0c1322] border border-[#16213a] p-3 hover:border-[#2c4370]">
                <span className="font-semibold text-white text-[13.5px] w-40 truncate">{p.name}</span>
                <span className="text-[11.5px] text-[#5b6885]">{icons.join(" ")}</span>
                <span className="chip" style={{ color: TIME_STATUS_META[ts].color, borderColor: TIME_STATUS_META[ts].color + "55" }}>{TIME_STATUS_META[ts].label}</span>
                <span className="ml-auto text-[11.5px] num text-[#8b98b3]">⭐{formatStars(p.stars)} · ↗{formatSigned(p.growth30d)} · Opp {s.opportunity}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 2026 Favorites / Rising / Hidden Gems */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="2026 Favorites" emoji="📌" desc="收藏中 2026 年真正活跃/增长的项目">
          {favorites2026.length === 0 ? <Empty /> : favorites2026.map((p) => <MiniRow key={p.slug} p={p} />)}
        </Section>
        <Section title="My Rising Projects" emoji="🔥" desc="收藏中正在快速增长的项目（按 30 天增长排序）">
          {rising.length === 0 ? <Empty /> : rising.slice(0, 6).map((p) => <MiniRow key={p.slug} p={p} />)}
        </Section>
      </div>
      <Section title="My Hidden Gems" emoji="💎" desc="与你兴趣高度相关、但你还没收藏的项目">
        {hiddenGems.map((p) => <MiniRow key={p.slug} p={p} />)}
      </Section>

      {/* My Project Report */}
      <Section title="我的项目报告 · MY PROJECT REPORT" emoji="📑" desc="每个收藏/同步项目的个人逆向报告：为什么收藏、重点学什么、是否值得自媒体/Portfolio/重新开发">
        {activePool.length === 0 ? <Empty /> : activePool.map((p) => <MyReportRow key={p.slug} p={p} />)}
      </Section>

      {/* Interest graph + Radar vs Global */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <div className="text-[14px] font-bold text-white mb-3 flex items-center gap-2"><Puzzle size={15} className="text-[#c084fc]" /> Personal AI PM Interest Graph</div>
          {interest.length === 0 ? <Empty /> : (
            <div className="space-y-2.5">
              {interest.map((i) => (
                <div key={i.id} className="flex items-center gap-3">
                  <span className="w-28 text-[12px] text-[#8b98b3] truncate">{categoryOf(i.id).emoji} {categoryOf(i.id).name}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#141e33] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#4f8cff] to-[#7c5cff]" style={{ width: `${Math.max(4, i.pct)}%` }} />
                  </div>
                  <span className="w-10 text-right text-[11.5px] num text-[#aab6cd]">{i.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <div className="text-[14px] font-bold text-white mb-3 flex items-center gap-2"><Radar size={15} className="text-[#34d399]" /> My Radar vs Global Radar</div>
          <div className="space-y-2.5">
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[11.5px] font-semibold text-[#7dd3fc] mb-2">全球最热分类（你关注了吗？）</div>
              <div className="flex flex-wrap gap-1.5">
                {globalInterest.map((g) => (
                  <span key={g.id} className={`chip ${myCatIds.has(g.id) ? "" : "!border-rose-400/50 !text-rose-300"}`}>
                    {categoryOf(g.id).emoji} {categoryOf(g.id).name} {g.pct}%
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[11.5px] font-semibold text-[#f472b6] mb-2">你可能漏掉了</div>
              {missed.length === 0 ? <div className="text-[12.5px] text-[#5b6885]">你的兴趣覆盖了全球热门方向 👍</div> : (
                <div className="space-y-1.5">
                  {missed.map((m) => {
                    const cat = categoryOf(m.id);
                    const picks = PROJECTS.filter((p) => p.categories.includes(m.id)).sort((a, b) => computeScores(b).opportunity - computeScores(a).opportunity).slice(0, 2);
                    return (
                      <div key={m.id} className="text-[12.5px] text-[#aab6cd]">
                        <b className="text-[#cfe0ff]">{cat.emoji} {cat.name}</b>（全球 {m.pct}%）：
                        {picks.map((p) => <Link key={p.slug} href={`/projects/${p.slug}`} className="text-[#7dd3fc] hover:underline ml-1">{p.name}</Link>)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[11.5px] font-semibold text-[#fbbf24] mb-1.5">技能缺口提示</div>
              <div className="text-[12.5px] text-[#aab6cd]">你的兴趣集中在 {interest.slice(0, 2).map((i) => categoryOf(i.id).name).join("、") || "…"}；建议补 <Link href="/learn" className="text-[#7dd3fc] underline">能力雷达</Link> 看看短板，再针对性补项目。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-[11.5px] text-[#5b6885]"><Icon size={13} style={{ color }} /> {label}</div>
      <div className="text-2xl font-extrabold num mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function Section({ title, emoji, desc, children }: { title: string; emoji: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <div className="text-[14px] font-bold text-white mb-1">{emoji} {title}</div>
      <div className="text-[11.5px] text-[#5b6885] mb-3">{desc}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MiniRow({ p }: { p: Project }) {
  const ts = timeStatusOf(p);
  const s = computeScores(p);
  return (
    <Link href={`/projects/${p.slug}`} className="flex items-center gap-2.5 rounded-xl bg-[#0c1322] border border-[#16213a] p-3 hover:border-[#2c4370]">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white text-[13px] truncate">{p.name}</div>
        <div className="text-[11px] text-[#5b6885] truncate">{p.tagline}</div>
      </div>
      <span className="chip" style={{ color: TIME_STATUS_META[ts].color, borderColor: TIME_STATUS_META[ts].color + "55" }}>{TIME_STATUS_META[ts].label}</span>
      <span className="text-[11.5px] num text-[#8b98b3]">↗{formatSigned(p.growth30d)}</span>
    </Link>
  );
}

function Empty() {
  return <div className="text-[12.5px] text-[#5b6885] py-2">暂无数据 — 收藏项目或同步 GitHub Stars 后自动生成。</div>;
}


function MyReportRow({ p }: { p: Project }) {
  const [open, setOpen] = useState(false);
  const r = buildMyProjectReport(p);
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#16213a] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left">
        <span className="flex-1">
          <span className="font-semibold text-[13.5px] text-white">{p.name}</span>
          <span className="text-[11px] text-[#5b6885] ml-2">{p.tagline}</span>
        </span>
        <span className="chip shrink-0">{open ? "收起" : "展开报告"}</span>
      </button>
      {open && (
        <div className="px-3.5 pb-4 space-y-2 text-[12.5px] text-[#aab6cd]">
          <div className="rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5"><b className="text-[#7dd3fc]">为什么我收藏：</b>{r.whyStarred}</div>
          <div className="rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5"><b className="text-[#7dd3fc]">它为什么值得研究：</b>{r.worthStudying}</div>
          <div className="rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5">
            <b className="text-[#34d399]">我应该重点学习：</b>
            <div className="mt-1 space-y-0.5">{r.focusLearn.map((x, i) => <div key={i}>· {x}</div>)}</div>
          </div>
          <div className="rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5"><b className="text-[#fbbf24]">对 AI PM 转型的帮助：</b>{r.careerHelp}</div>
          <div className="flex flex-wrap gap-2 text-[11.5px]">
            <span className={`chip ${r.mediaWorth ? "!text-[#f472b6]" : ""}`}>{r.mediaWorth ? "📱 值得做自媒体：" + r.mediaTitle : "📱 自媒体价值一般"}</span>
            <span className={`chip ${r.portfolioWorth ? "!text-[#a78bfa]" : ""}`}>{r.portfolioWorth ? "💼 值得做 Portfolio" : "💼 Portfolio 价值一般"}</span>
            <span className={`chip ${r.rebuildWorth ? "!text-emerald-300" : ""}`}>{r.rebuildWorth ? "🔧 值得重新开发/副业" : "🔧 二开价值一般"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
