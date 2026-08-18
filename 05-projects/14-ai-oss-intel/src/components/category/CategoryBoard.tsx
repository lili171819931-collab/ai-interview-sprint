"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, RefreshCw, Radio, Database, AlertTriangle, ChevronDown, ChevronUp, Boxes, FileText, UserRoundCheck, ExternalLink } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { MasterAnalysis, FeaturePathDiagram, DirectorView, LiveAnalysis, LiveFeatureDiagram, LiveDirectorView } from "@/components/analysis/AnalysisView";
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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<"analysis" | "diagram" | "director">("analysis");

  const load = useCallback(async (f: boolean) => {
    setLoading(true);
    const state = await loadLive(id, f);
    setLive(state);
    setLoading(false);
  }, [id]);

  useEffect(() => { setTab("stars"); setLive(null); setLoading(true); setExpandedKey(null); load(false); }, [id, load]);

  const seed = PROJECTS.filter((p) => p.categories.includes(id));
  const opportunity = seed.map((p) => ({ p, s: computeScores(p) })).sort((a, b) => b.s.opportunity - a.s.opportunity);
  const starsSeed = [...seed].sort((a, b) => b.stars - a.stars);
  const growthSeed = [...seed].sort((a, b) => b.growth90d - a.growth90d);
  const liveOn = !!live && live.source !== "seed" && live.repos.length > 0;

  const toggle = (key: string, pt: "analysis" | "diagram" | "director") => {
    if (expandedKey === key && panelTab === pt) { setExpandedKey(null); return; }
    setExpandedKey(key); setPanelTab(pt);
  };

  const renderRows = () => {
    if (tab === "opportunity") {
      return opportunity.map(({ p, s }, i) => (
        <SeedRow key={p.slug} p={p} s={s} rank={i + 1} color="#7dd3fc" expandedKey={expandedKey} panelTab={panelTab} onToggle={toggle}
          columns={<>{[
            { v: <span className="num font-bold text-[#7dd3fc]">{s.opportunity}</span>, label: "Opp" },
            { v: <span className="num text-[#34d399]">{s.technical}</span>, label: "Tech" },
            { v: <span className="num text-[#f87171]">{s.money}</span>, label: "Money" },
          ].map((c) => <Cell key={c.label} label={c.label}>{c.v}</Cell>)}</>} />
      ));
    }
    if (tab === "stars") {
      if (liveOn) {
        return [...live!.repos].sort((a, b) => b.stars - a.stars).slice(0, LIMIT).map((r, i) => (
          <LiveRow key={r.fullName} repo={r} rank={i + 1} color="#fbbf24" expandedKey={expandedKey} panelTab={panelTab} onToggle={toggle}
            columns={<>{[
              <Cell key="stars" label="⭐ Stars"><span className="num font-bold text-[#fbbf24]">{formatStars(r.stars)}</span></Cell>,
              <Cell key="forks" label="Forks"><span className="num text-[#8b98b3]">{formatStars(r.forks)}</span></Cell>,
              <Cell key="lang" label="语言"><span className="text-[#8b98b3] text-[12px]">{r.language ?? "—"}</span></Cell>,
              <Cell key="upd" label="更新时间"><span className="num text-[#5b6885]">{r.updatedAt}</span></Cell>,
            ]}</>} />
        ));
      }
      return starsSeed.slice(0, LIMIT).map((p, i) => (
        <SeedRow key={p.slug} p={p} s={computeScores(p)} rank={i + 1} color="#fbbf24" expandedKey={expandedKey} panelTab={panelTab} onToggle={toggle}
          columns={<>{[
            <Cell key="stars" label="⭐ Stars"><span className="num font-bold text-[#fbbf24]">{formatStars(p.stars)}</span></Cell>,
            <Cell key="forks" label="Forks"><span className="num text-[#8b98b3]">{formatStars(p.forks)}</span></Cell>,
            <Cell key="g30" label="30D"><span className="num text-emerald-300">{formatSigned(p.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(p, 30))}</div></span></Cell>,
            <Cell key="g90" label="90D"><span className="num text-emerald-300/80">{formatSigned(p.growth90d)}</span></Cell>,
          ]}</>} />
      ));
    }
    // growth
    if (liveOn) {
      return [...live!.repos].sort((a, b) => starsPerDay(b) - starsPerDay(a)).slice(0, LIMIT).map((r, i) => (
        <LiveRow key={r.fullName} repo={r} rank={i + 1} color="#34d399" expandedKey={expandedKey} panelTab={panelTab} onToggle={toggle}
          columns={<>{[
            <Cell key="stars" label="⭐ Stars"><span className="num text-[#fbbf24]">{formatStars(r.stars)}</span></Cell>,
            <Cell key="spd" label="平均日增"><span className="num font-bold text-emerald-300">{starsPerDay(r).toFixed(1)}/天</span></Cell>,
            <Cell key="forks" label="Forks"><span className="num text-[#8b98b3]">{formatStars(r.forks)}</span></Cell>,
            <Cell key="upd" label="更新时间"><span className="num text-[#5b6885]">{r.updatedAt}</span></Cell>,
          ]}</>} />
      ));
    }
    return growthSeed.slice(0, LIMIT).map((p, i) => (
      <SeedRow key={p.slug} p={p} s={computeScores(p)} rank={i + 1} color="#34d399" expandedKey={expandedKey} panelTab={panelTab} onToggle={toggle}
        columns={<>{[
          <Cell key="stars" label="⭐ Stars"><span className="num text-[#fbbf24]">{formatStars(p.stars)}</span></Cell>,
          <Cell key="g7" label="7D"><span className="num text-emerald-300">{formatSigned(p.growth7d)}</span></Cell>,
          <Cell key="g30" label="30D"><span className="num text-emerald-300">{formatSigned(p.growth30d)}</span></Cell>,
          <Cell key="g90" label="90D(2026)"><span className="num font-bold text-emerald-300">{formatSigned(p.growth90d)}</span></Cell>,
        ]}</>} />
    ));
  };

  return (
    <div className="space-y-4">
      <div className="panel px-4 py-3 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setExpandedKey(null); }} className={`chip cursor-pointer ${tab === t.id ? "chip-accent" : ""}`} title={t.desc}>{t.label}</button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-[11.5px]">
          {loading ? (
            <span className="flex items-center gap-1.5 text-[#7dd3fc]"><RefreshCw size={12} className="animate-spin" /> 正在从 GitHub 拉取实时数据…</span>
          ) : liveOn ? (
            <>
              <span className="chip !text-[10.5px] !text-emerald-300 !border-emerald-400/40"><Radio size={11} /> 实时数据 {live.source === "live" ? "· 刚刚" : `· 缓存 ${new Date(live.fetchedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}</span>
              <span className="text-[#5b6885]">收录 {Math.min(LIMIT, live.repos.length)}/100 个项目</span>
              <button onClick={() => load(true)} className="chip cursor-pointer hover:!text-[#7dd3fc]"><RefreshCw size={11} /> 立即刷新</button>
            </>
          ) : (
            <>
              <span className="chip !text-[10.5px] !text-amber-300 !border-amber-400/40"><Database size={11} /> 本地快照</span>
              {live?.error && <span className="flex items-center gap-1 text-[#f87171]"><AlertTriangle size={11} /> {live.error}</span>}
              <button onClick={() => load(true)} className="chip cursor-pointer hover:!text-[#7dd3fc]"><RefreshCw size={11} /> 重新拉取</button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {renderRows()}
      </div>

      <p className="text-[11px] text-[#4d5a75]">
        📡 每次打开页面自动从 GitHub 拉取实时数据（缓存 30 分钟，可点「立即刷新」）；未联网或超限时自动回退本地快照（{seed.length} 个项目）。
        每个项目均可「分析」打开完整逆向工程（40 节报告 + 全景图），「产品框图」查看功能实现路径框图，「产品总监视角」查看边界 / 痛点 / 真实案例预测。
      </p>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-right min-w-[72px]">
      <div className="text-[10px] text-[#5b6885] uppercase">{label}</div>
      <div className="num mt-0.5">{children}</div>
    </div>
  );
}

function StatusChip({ status }: { status: "2026NEW" | "2026ACTIVE" | "2026RELEVANT" }) {
  const meta = TIME_STATUS_META[status];
  return <span className="chip !text-[9.5px]" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "12" }}>{meta.label}</span>;
}

function Actions({ seed, repo, expandedKey, panelTab, onToggle }: {
  seed?: Project; repo?: LiveRepo; expandedKey: string | null; panelTab: "analysis" | "diagram" | "director";
  onToggle: (key: string, pt: "analysis" | "diagram" | "director") => void;
}) {
  const key = seed ? `seed:${seed.slug}` : `live:${repo!.fullName}`;
  const isOpen = expandedKey === key;
  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <button onClick={() => onToggle(key, "analysis")} className={`chip !text-[11px] cursor-pointer ${isOpen && panelTab === "analysis" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <FileText size={11} /> 分析
      </button>
      <button onClick={() => onToggle(key, "diagram")} className={`chip !text-[11px] cursor-pointer ${isOpen && panelTab === "diagram" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <Boxes size={11} /> 产品框图
      </button>
      <button onClick={() => onToggle(key, "director")} className={`chip !text-[11px] cursor-pointer ${isOpen && panelTab === "director" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <UserRoundCheck size={11} /> 产品总监视角
      </button>
    </div>
  );
}

function SeedRow({ p, s, rank, color, expandedKey, panelTab, onToggle, columns }: {
  p: Project; s: ReturnType<typeof computeScores>; rank: number; color: string;
  expandedKey: string | null; panelTab: "analysis" | "diagram" | "director"; onToggle: (k: string, pt: "analysis" | "diagram" | "director") => void;
  columns: React.ReactNode;
}) {
  const ts = timeStatusOf(p);
  const meta = TIME_STATUS_META[ts];
  const key = `seed:${p.slug}`;
  const open = expandedKey === key;
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-[#0e1626]">
        <span className="w-8 font-bold num" style={{ color: rank <= 3 ? color : "#8b98b3" }}>#{String(rank).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <Link href={`/projects/${p.slug}`} className="font-semibold text-white hover:text-[#7dd3fc]">{p.name}</Link>
          <div className="text-[11px] text-[#5b6885] truncate max-w-[420px]">{p.tagline}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10.5px] text-[#5b6885]"><Clock size={10} /> 发布于 {p.createdAt}</span>
            <span className="chip !text-[9.5px]" style={{ color: meta.color, borderColor: meta.color + "55", background: meta.color + "12" }}>{meta.label}</span>
            <span className="text-[10.5px] text-[#5b6885] num">⭐{formatStars(p.stars)}</span>
            {p.language && <span className="chip !text-[9px]">{p.language}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">{columns}</div>
        <Actions seed={p} expandedKey={expandedKey} panelTab={panelTab} onToggle={onToggle} />
        <button onClick={() => onToggle(key, open ? "analysis" : "analysis")} className="text-[#4d5a75]"><ChevronDown size={14} /></button>
      </div>
      {open && <ExpandPanel seed={p} panelTab={panelTab} onTab={onToggle} />}
    </div>
  );
}

function LiveRow({ repo, rank, color, expandedKey, panelTab, onToggle, columns }: {
  repo: LiveRepo; rank: number; color: string;
  expandedKey: string | null; panelTab: "analysis" | "diagram" | "director"; onToggle: (k: string, pt: "analysis" | "diagram" | "director") => void;
  columns: React.ReactNode;
}) {
  const status = liveStatus(repo);
  const key = `live:${repo.fullName}`;
  const open = expandedKey === key;
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-[#0e1626]">
        <span className="w-8 font-bold num" style={{ color: rank <= 3 ? color : "#8b98b3" }}>#{String(rank).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <a href={`https://github.com/${repo.fullName}`} target="_blank" className="font-semibold text-white hover:text-[#7dd3fc]">{repo.name} <ExternalLink size={11} className="inline text-[#4d5a75]" /></a>
          <div className="text-[11px] text-[#5b6885] truncate max-w-[420px]">{repo.description ?? repo.fullName}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10.5px] text-[#5b6885]"><Clock size={10} /> 发布于 {repo.createdAt}</span>
            <StatusChip status={status} />
            {repo.language && <span className="chip !text-[9px]">{repo.language}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">{columns}</div>
        <Actions repo={repo} expandedKey={expandedKey} panelTab={panelTab} onToggle={onToggle} />
        <button onClick={() => onToggle(key, open ? "analysis" : "analysis")} className="text-[#4d5a75]"><ChevronDown size={14} /></button>
      </div>
      {open && <ExpandPanel repo={repo} panelTab={panelTab} onTab={onToggle} />}
    </div>
  );
}

function ExpandPanel({ seed, repo, panelTab, onTab }: {
  seed?: Project; repo?: LiveRepo;
  panelTab: "analysis" | "diagram" | "director";
  onTab: (k: string, pt: "analysis" | "diagram" | "director") => void;
}) {
  const key = seed ? `seed:${seed.slug}` : `live:${repo!.fullName}`;
  return (
    <div className="border-t border-[#16213a] bg-[#0a101d] px-4 py-4">
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => onTab(key, "analysis")} className={`chip cursor-pointer ${panelTab === "analysis" ? "chip-accent" : ""}`}><FileText size={11} /> 分析（完整逆向工程）</button>
        <button onClick={() => onTab(key, "diagram")} className={`chip cursor-pointer ${panelTab === "diagram" ? "chip-accent" : ""}`}><Boxes size={11} /> 产品框图（功能实现路径）</button>
        <button onClick={() => onTab(key, "director")} className={`chip cursor-pointer ${panelTab === "director" ? "chip-accent" : ""}`}><UserRoundCheck size={11} /> 产品总监视角</button>
      </div>
      {seed ? (
        panelTab === "analysis" ? <MasterAnalysis project={seed} /> : panelTab === "diagram" ? <FeaturePathDiagram project={seed} /> : <DirectorView project={seed} />
      ) : (
        panelTab === "analysis" ? <LiveAnalysis repo={repo!} /> : panelTab === "diagram" ? <LiveFeatureDiagram repo={repo!} /> : <LiveDirectorView repo={repo!} />
      )}
    </div>
  );
}





