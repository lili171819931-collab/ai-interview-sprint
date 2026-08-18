"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, RefreshCw, Radio, Database, AlertTriangle } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { loadLive, liveStatus, starsPerDay, type LiveRepo, type LiveState } from "@/lib/live";
import { GithubIcon } from "@/components/icons";
import type { CategoryId, Project } from "@/lib/types";

const LIMIT = 100;
type Tab = "opportunity" | "stars" | "growth";

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: "opportunity", label: "机会 TOP 榜", desc: "按 AI Opportunity Score" },
  { id: "stars", label: "收藏榜", desc: "按 Stars · 2026 · 实时" },
  { id: "growth", label: "收藏增长最快榜", desc: "按 2026 增长 · 2026 · 实时" },
];

export function CategoryBoard({ id }: { id: CategoryId }) {
  const [tab, setTab] = useState<Tab>("stars");
  const [live, setLive] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [force, setForce] = useState(false);

  const load = useCallback(async (f: boolean) => {
    setLoading(true);
    const state = await loadLive(id, f);
    setLive(state);
    setLoading(false);
  }, [id]);

  useEffect(() => { setTab("stars"); setLive(null); setLoading(true); load(false); }, [id, load]);

  const refresh = () => { setForce(true); load(true); };

  const seed = PROJECTS.filter((p) => p.categories.includes(id));
  const opportunity = seed.map((p) => ({ p, s: computeScores(p) })).sort((a, b) => b.s.opportunity - a.s.opportunity);
  const starsSeed = [...seed].sort((a, b) => b.stars - a.stars);
  const growthSeed = [...seed].sort((a, b) => b.growth90d - a.growth90d);

  const liveOn = !!live && live.source !== "seed" && live.repos.length > 0;

  return (
    <div className="space-y-4">
      {/* Tabs + live status */}
      <div className="panel px-4 py-3 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`chip cursor-pointer ${tab === t.id ? "chip-accent" : ""}`} title={t.desc}>{t.label}</button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-[11.5px]">
          {loading ? (
            <span className="flex items-center gap-1.5 text-[#7dd3fc]"><RefreshCw size={12} className="animate-spin" /> 正在从 GitHub 拉取实时数据…</span>
          ) : liveOn ? (
            <>
              <span className="chip !text-[10.5px] !text-emerald-300 !border-emerald-400/40"><Radio size={11} /> 实时数据 {live.source === "live" ? "· 刚刚" : `· 缓存 ${new Date(live.fetchedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}</span>
              <span className="text-[#5b6885]">收录 {Math.min(LIMIT, live.repos.length)}/100 个项目</span>
              <button onClick={refresh} className="chip cursor-pointer hover:!text-[#7dd3fc]"><RefreshCw size={11} /> 立即刷新</button>
            </>
          ) : (
            <>
              <span className="chip !text-[10.5px] !text-amber-300 !border-amber-400/40"><Database size={11} /> 本地快照</span>
              {live?.error && <span className="flex items-center gap-1 text-[#f87171]"><AlertTriangle size={11} /> {live.error}</span>}
              <button onClick={refresh} className="chip cursor-pointer hover:!text-[#7dd3fc]"><RefreshCw size={11} /> 重新拉取</button>
            </>
          )}
        </div>
      </div>

      {tab === "opportunity" && <OpportunityTable rows={opportunity} />}
      {tab === "stars" && <StarsTable liveOn={liveOn} live={live} seed={starsSeed} />}
      {tab === "growth" && <GrowthTable liveOn={liveOn} live={live} seed={growthSeed} />}

      <p className="text-[11px] text-[#4d5a75]">
        📡 每次打开页面自动从 GitHub 拉取实时数据（缓存 30 分钟，可点「立即刷新」）；未联网或超限时自动回退本地快照（{seed.length} 个项目）。
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: "2026NEW" | "2026ACTIVE" | "2026RELEVANT" }) {
  const meta = TIME_STATUS_META[status];
  return <span className="chip !text-[9.5px]" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "12" }}>{meta.label}</span>;
}

function LiveCell({ repo }: { repo: LiveRepo }) {
  const status = liveStatus(repo);
  return (
    <div className="min-w-0">
      <a href={`https://github.com/${repo.fullName}`} target="_blank" className="font-semibold text-white truncate hover:text-[#7dd3fc] block max-w-[240px]">{repo.name}</a>
      <div className="text-[10.5px] text-[#5b6885] truncate max-w-[260px]">{repo.description ?? repo.fullName}</div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="flex items-center gap-1 text-[10.5px] text-[#5b6885]"><Clock size={10} /> 发布于 {repo.createdAt}</span>
        <StatusChip status={status} />
        {repo.language && <span className="chip !text-[9px]">{repo.language}</span>}
      </div>
    </div>
  );
}

function SeedCell({ p }: { p: Project }) {
  const ts = timeStatusOf(p);
  const meta = TIME_STATUS_META[ts];
  return (
    <div className="min-w-0">
      <Link href={`/projects/${p.slug}`} className="font-semibold text-white truncate hover:text-[#7dd3fc] block max-w-[240px]">{p.name}</Link>
      <div className="text-[10.5px] text-[#5b6885] truncate max-w-[260px]">{p.tagline}</div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="flex items-center gap-1 text-[10.5px] text-[#5b6885]"><Clock size={10} /> 发布于 {p.createdAt}</span>
        <span className="chip !text-[9.5px]" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "12" }}>{meta.label}</span>
      </div>
    </div>
  );
}

function ActionLink({ href, github }: { href: string; github?: string }) {
  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      {href && <Link href={href} className="chip chip-accent !text-[11px]">分析</Link>}
      {github && <a href={github} target="_blank" className="chip !text-[11px]"><GithubIcon size={11} /> GitHub</a>}
    </div>
  );
}

function OpportunityTable({ rows }: { rows: { p: Project; s: ReturnType<typeof computeScores> }[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-[820px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
              <th className="px-4 py-3">#</th><th className="px-2 py-3">项目（发布时间）</th>
              <th className="px-2 py-3 text-right num">Stars</th><th className="px-2 py-3 text-right num">30D</th>
              <th className="px-2 py-3 text-right num">Opp</th><th className="px-2 py-3 text-right num">Tech</th>
              <th className="px-2 py-3 text-right num">Money</th><th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, s }, i) => (
              <tr key={p.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#7dd3fc" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                <td className="px-2 py-3"><SeedCell p={p} /></td>
                <td className="px-2 py-3 text-right num text-[#cfe0ff]">{formatStars(p.stars)}</td>
                <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 30))}</div></td>
                <td className="px-2 py-3 text-right num font-bold text-[#7dd3fc]">{s.opportunity}</td>
                <td className="px-2 py-3 text-right num text-[#34d399]">{s.technical}</td>
                <td className="px-2 py-3 text-right num text-[#f87171]">{s.money}</td>
                <td className="px-4 py-3 text-right"><ActionLink href={`/projects/${p.slug}`} github={`https://github.com/${p.fullName}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StarsTable({ liveOn, live, seed }: { liveOn: boolean; live: LiveState | null; seed: Project[] }) {
  const rows = liveOn
    ? [...live!.repos].sort((a, b) => b.stars - a.stars).slice(0, LIMIT)
    : seed.slice(0, LIMIT);
  return (
    <div className="panel overflow-hidden">
      <div className="px-4 py-3 text-[12px] text-[#8b98b3] border-b border-[#16213a]">
        🔥 收藏榜 · 按 Stars（收藏数）排名 · 2026 · {liveOn ? `实时数据（GitHub）` : "本地快照"} · 共 {rows.length} 个项目（目标 {LIMIT}）· 每项目显示发布时间
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-[820px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
              <th className="px-4 py-3">#</th><th className="px-2 py-3">项目（发布时间）</th>
              <th className="px-2 py-3 text-right num">⭐ Stars</th><th className="px-2 py-3 text-right num">Forks</th>
              <th className="px-2 py-3 text-right num">{liveOn ? "语言" : "30D 增长"}</th>
              <th className="px-2 py-3 text-right num">{liveOn ? "更新时间" : "90D 增长"}</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) =>
              liveOn ? (
                (() => {
                  const repo = r as LiveRepo;
                  return (
                    <tr key={repo.fullName} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                      <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#fbbf24" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-2 py-3"><LiveCell repo={repo} /></td>
                      <td className="px-2 py-3 text-right num font-bold text-[#fbbf24]">{formatStars(repo.stars)}</td>
                      <td className="px-2 py-3 text-right num text-[#8b98b3]">{formatStars(repo.forks)}</td>
                      <td className="px-2 py-3 text-right text-[#8b98b3] text-[12px]">{repo.language ?? "—"}</td>
                      <td className="px-2 py-3 text-right num text-[#5b6885]">{repo.updatedAt}</td>
                      <td className="px-4 py-3 text-right"><ActionLink href="" github={`https://github.com/${repo.fullName}`} /></td>
                    </tr>
                  );
                })()
              ) : (
                (() => {
                  const p = r as Project;
                  return (
                    <tr key={p.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                      <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#fbbf24" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-2 py-3"><SeedCell p={p} /></td>
                      <td className="px-2 py-3 text-right num font-bold text-[#fbbf24]">{formatStars(p.stars)}</td>
                      <td className="px-2 py-3 text-right num text-[#8b98b3]">{formatStars(p.forks)}</td>
                      <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 30))}</div></td>
                      <td className="px-2 py-3 text-right num text-emerald-300/80">{formatSigned(p.growth90d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 90))}</div></td>
                      <td className="px-4 py-3 text-right"><ActionLink href={`/projects/${p.slug}`} github={`https://github.com/${p.fullName}`} /></td>
                    </tr>
                  );
                })()
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GrowthTable({ liveOn, live, seed }: { liveOn: boolean; live: LiveState | null; seed: Project[] }) {
  const rows = liveOn
    ? [...live!.repos].sort((a, b) => starsPerDay(b) - starsPerDay(a)).slice(0, LIMIT)
    : seed.slice(0, LIMIT);
  return (
    <div className="panel overflow-hidden">
      <div className="px-4 py-3 text-[12px] text-[#8b98b3] border-b border-[#16213a]">
        ⚡ 收藏增长最快榜 · {liveOn ? "实时数据：按「平均日增 Stars」代理排序（GitHub 不提供历史增长，用 stars/发布天数 估算）" : "本地快照：按 2026 近 90 天 Star 增长排序"} · 共 {rows.length} 个项目（目标 {LIMIT}）· 每项目显示发布时间
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-[860px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#5b6885] border-b border-[#16213a]">
              <th className="px-4 py-3">#</th><th className="px-2 py-3">项目（发布时间）</th>
              <th className="px-2 py-3 text-right num">⭐ Stars</th>
              <th className="px-2 py-3 text-right num">{liveOn ? "平均日增" : "7D"}</th>
              <th className="px-2 py-3 text-right num">{liveOn ? "Forks" : "30D"}</th>
              <th className="px-2 py-3 text-right num">{liveOn ? "更新时间" : "90D(2026)"}</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) =>
              liveOn ? (
                (() => {
                  const repo = r as LiveRepo;
                  const spd = starsPerDay(repo);
                  return (
                    <tr key={repo.fullName} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                      <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#34d399" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-2 py-3"><LiveCell repo={repo} /></td>
                      <td className="px-2 py-3 text-right num text-[#fbbf24]">{formatStars(repo.stars)}</td>
                      <td className="px-2 py-3 text-right num font-bold text-emerald-300">{spd.toFixed(1)}/天</td>
                      <td className="px-2 py-3 text-right num text-[#8b98b3]">{formatStars(repo.forks)}</td>
                      <td className="px-2 py-3 text-right num text-[#5b6885]">{repo.updatedAt}</td>
                      <td className="px-4 py-3 text-right"><ActionLink href="" github={`https://github.com/${repo.fullName}`} /></td>
                    </tr>
                  );
                })()
              ) : (
                (() => {
                  const p = r as Project;
                  return (
                    <tr key={p.slug} className="border-b border-[#101a2e] hover:bg-[#0e1626]">
                      <td className="px-4 py-3 font-bold num" style={{ color: i < 3 ? "#34d399" : "#8b98b3" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-2 py-3"><SeedCell p={p} /></td>
                      <td className="px-2 py-3 text-right num text-[#fbbf24]">{formatStars(p.stars)}</td>
                      <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth7d)}</td>
                      <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(p.growth30d)}</td>
                      <td className="px-2 py-3 text-right num font-bold text-emerald-300">{formatSigned(p.growth90d)}</td>
                      <td className="px-4 py-3 text-right"><ActionLink href={`/projects/${p.slug}`} github={`https://github.com/${p.fullName}`} /></td>
                    </tr>
                  );
                })()
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
