"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, RefreshCw, Radio, Database, AlertTriangle, ChevronDown, ChevronUp, Boxes, FileText, UserRoundCheck, ExternalLink, Bot } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { MasterAnalysis, FeaturePathDiagram, DirectorView, LiveSourcePanel, AgentCockpit, SourceAgentCockpit, ExpertCockpit, SourceExpertCockpit } from "@/components/analysis/AnalysisView";
import { loadLive, liveStatus, starsPerDay, liveOpportunityScore, type LiveRepo, type LiveState } from "@/lib/live";
import { getAddedProjects } from "@/lib/db";
import { buildBoardRows } from "@/lib/boardRows";
import { guessCategoryFromRepo } from "@/lib/categorize";
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
  const [panelTab, setPanelTab] = useState<"analysis" | "diagram" | "director" | "agent" | "expert" | "prompt">("analysis");

  const load = useCallback(async (f: boolean) => {
    setLoading(true);
    const state = await loadLive(id, f);
    setLive(state);
    setLoading(false);
  }, [id]);

  useEffect(() => { setTab("stars"); setLive(null); setLoading(true); setExpandedKey(null); load(false); }, [id, load]);

  // 全平台实时联动：顶栏「实时同步」（db.ts 写入后派发 aioss.db.change）完成后自动重拉本榜
  useEffect(() => {
    const h = () => { load(true); };
    window.addEventListener("aioss.db.change", h);
    return () => window.removeEventListener("aioss.db.change", h);
  }, [load]);

  // 实时更新：页面可见时每 10 分钟自动重拉（未认证限流时快速失败，不挂起）
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) load(true); }, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  const seed = PROJECTS.filter((p) => p.categories.includes(id));
  // 全平台联动：手动添加的项目（add-project）若匹配当前分类，并入实时展示
  const addedInCat = useMemo(
    () => getAddedProjects().map((a) => a.repo).filter((r) => guessCategoryFromRepo(r) === id),
    [id]
  );
  const mergeLive = (repos: LiveRepo[]) => {
    const byName = new Map(repos.map((r) => [r.fullName.toLowerCase(), r]));
    for (const r of addedInCat) byName.set(r.fullName.toLowerCase(), r);
    return [...byName.values()];
  };
  const liveOn = !!live && live.source !== "seed" && live.repos.length > 0;
  // 统一榜单行：本分类优先（快照 + 实时 + 手动添加），再用全局池补齐至 LIMIT（保证每榜 ≥100）
  const board = buildBoardRows({
    projects: PROJECTS,
    liveRepos: liveOn ? mergeLive(live!.repos) : [],
    addedRepos: addedInCat,
    categoryId: id,
    tab,
    limit: LIMIT,
    liveTrusted: true, // loadLive(id) 已按分类查询拉取实时项目
  });

  const toggle = (key: string, pt: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt") => {
    if (expandedKey === key && panelTab === pt) { setExpandedKey(null); return; }
    setExpandedKey(key); setPanelTab(pt);
  };

  const renderRows = () => {
    const { rows, liveCount } = board;
    const shortage = rows.length < LIMIT;
    const head =
      tab === "opportunity"
        ? `机会 TOP 榜 = 仅本分类 · 2025 年至今项目 · 共 ${rows.length}/${LIMIT} 个（快照真实评分 + 实时启发式评分）· 从高到低 · 实时 ${liveCount}`
        : tab === "stars"
          ? `收藏榜 = 仅本分类 · 2025 年至今项目 · 共 ${rows.length}/${LIMIT} 个 · 从高到低 · 实时 ${liveCount}`
          : `收藏增长最快榜 = 仅本分类 · 2025 年至今项目 · 共 ${rows.length}/${LIMIT} 个 · 从高到低 · 实时 ${liveCount}`;
    return (
      <>
        <div className="px-1 text-[11.5px] text-[#5b6885]">{head}</div>
        {shortage && (
          <div className="px-1 mt-1 flex items-center gap-1.5 text-[11px] text-amber-300/90">
            <AlertTriangle size={11} /> 本分类可用数据 {rows.length} 条（目标 {LIMIT}）：GitHub 实时拉取受限（未配置 Token 或该分类真实项目较少）。在 My GitHub 页配置 GITHUB_TOKEN 后自动补齐至 {LIMIT} 条本分类真实项目；点击「立即刷新」重试。
          </div>
        )}
        {rows.map((row, i) => {
          const rank = i + 1;
          if (row.kind === "seed") {
            const s = computeScores(row.p);
            const color = tab === "opportunity" ? "#7dd3fc" : tab === "stars" ? "#fbbf24" : "#34d399";
            const cols =
              tab === "opportunity" ? (
                <>{[
                  { v: <span className="num font-bold text-[#7dd3fc]">{s.opportunity}</span>, label: "Opp" },
                  { v: <span className="num text-[#34d399]">{s.technical}</span>, label: "Tech" },
                  { v: <span className="num text-[#f87171]">{s.money}</span>, label: "Money" },
                ].map((c) => <Cell key={c.label} label={c.label}>{c.v}</Cell>)}</>
              ) : tab === "stars" ? (
                <>{[
                  <Cell key="stars" label="⭐ Stars"><span className="num font-bold text-[#fbbf24]">{formatStars(row.p.stars)}</span></Cell>,
                  <Cell key="forks" label="Forks"><span className="num text-[#8b98b3]">{formatStars(row.p.forks)}</span></Cell>,
                  <Cell key="g30" label="30D"><span className="num text-emerald-300">{formatSigned(row.p.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(growthRate(row.p, 30))}</div></span></Cell>,
                  <Cell key="g90" label="90D"><span className="num text-emerald-300/80">{formatSigned(row.p.growth90d)}</span></Cell>,
                ]}</>
              ) : (
                <>{[
                  <Cell key="stars" label="⭐ Stars"><span className="num text-[#fbbf24]">{formatStars(row.p.stars)}</span></Cell>,
                  <Cell key="g7" label="7D"><span className="num text-emerald-300">{formatSigned(row.p.growth7d)}</span></Cell>,
                  <Cell key="g30" label="30D"><span className="num text-emerald-300">{formatSigned(row.p.growth30d)}</span></Cell>,
                  <Cell key="g90" label="90D(2026)"><span className="num font-bold text-emerald-300">{formatSigned(row.p.growth90d)}</span></Cell>,
                ]}</>
              );
            return (
              <SeedRow key={row.p.slug} p={row.p} s={s} rank={rank} color={color} expandedKey={expandedKey} panelTab={panelTab} onToggle={toggle} columns={cols} />
            );
          }
          const r = row.r;
          const color = tab === "opportunity" ? "#7dd3fc" : tab === "stars" ? "#fbbf24" : "#34d399";
          const cols =
            tab === "opportunity" ? (
              <>{[
                <Cell key="opp" label="Opp(估)"><span className="num font-bold text-[#7dd3fc]">{liveOpportunityScore(r)}</span></Cell>,
                <Cell key="stars" label="⭐ Stars"><span className="num text-[#fbbf24]">{formatStars(r.stars)}</span></Cell>,
                <Cell key="lang" label="语言"><span className="text-[#8b98b3] text-[12px]">{r.language ?? "—"}</span></Cell>,
                <Cell key="upd" label="更新时间"><span className="num text-[#5b6885]">{r.updatedAt}</span></Cell>,
              ]}</>
            ) : tab === "stars" ? (
              <>{[
                <Cell key="stars" label="⭐ Stars"><span className="num font-bold text-[#fbbf24]">{formatStars(r.stars)}</span></Cell>,
                <Cell key="forks" label="Forks"><span className="num text-[#8b98b3]">{formatStars(r.forks)}</span></Cell>,
                <Cell key="lang" label="语言"><span className="text-[#8b98b3] text-[12px]">{r.language ?? "—"}</span></Cell>,
                <Cell key="upd" label="更新时间"><span className="num text-[#5b6885]">{r.updatedAt}</span></Cell>,
              ]}</>
            ) : (
              <>{[
                <Cell key="stars" label="⭐ Stars"><span className="num text-[#fbbf24]">{formatStars(r.stars)}</span></Cell>,
                <Cell key="spd" label="平均日增"><span className="num font-bold text-emerald-300">{starsPerDay(r).toFixed(1)}/天</span></Cell>,
                <Cell key="forks" label="Forks"><span className="num text-[#8b98b3]">{formatStars(r.forks)}</span></Cell>,
              ]}</>
            );
          return (
            <LiveRow key={r.fullName} repo={r} rank={rank} color={color} expandedKey={expandedKey} panelTab={panelTab} onToggle={toggle} columns={cols} />
          );
        })}
      </>
    );
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
              <span className="text-[#5b6885]">实时收录 {Math.min(LIMIT, live.repos.length)}/100 个项目 · 三榜均 ≥100（实时模式）</span>
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
        📡 三榜只展示**本分类相关且发布时间为 2025 年至今**的开源项目（创建或最近更新在 2025 年至今；不做跨分类凑数），**从高到低**排列；配置 Token 后实时拉取可每榜补齐 {LIMIT} 条本分类真实项目。每次打开页面自动拉取实时数据（缓存 30 分钟，可点「立即刷新」；顶栏「实时同步」与每 10 分钟自动重拉同步本榜）；未配置 Token 限流时自动降级，不会挂起。
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
  seed?: Project; repo?: LiveRepo; expandedKey: string | null; panelTab: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt";
  onToggle: (key: string, pt: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt") => void;
}) {
  const key = seed ? `seed:${seed.slug}` : `live:${repo!.fullName}`;
  const isOpen = expandedKey === key;
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <button onClick={() => onToggle(key, "analysis")} className={`chip !text-[11px] cursor-pointer w-full justify-center ${isOpen && panelTab === "analysis" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <FileText size={11} /> 分析
      </button>
      <button onClick={() => onToggle(key, "diagram")} className={`chip !text-[11px] cursor-pointer w-full justify-center ${isOpen && panelTab === "diagram" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <Boxes size={11} /> 产品框图
      </button>
      <button onClick={() => onToggle(key, "expert")} className={`chip !text-[11px] cursor-pointer w-full justify-center ${isOpen && panelTab === "expert" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <UserRoundCheck size={11} /> 专家实战
      </button>
      <button onClick={() => onToggle(key, "agent")} className={`chip !text-[11px] cursor-pointer w-full justify-center ${isOpen && panelTab === "agent" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <Bot size={11} /> Agent 拆解
      </button>
      <button onClick={() => onToggle(key, "director")} className={`chip !text-[11px] cursor-pointer w-full justify-center ${isOpen && panelTab === "director" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <UserRoundCheck size={11} /> 产品总监视角
      </button>
      {seed ? (
        <Link href={`/projects/${seed.slug}/prompt`} className="chip !text-[11px] hover:!text-[#fbbf24] w-full justify-center">⚡ Prompt</Link>
      ) : (
        <button onClick={() => onToggle(key, "prompt")} className={`chip !text-[11px] cursor-pointer w-full justify-center ${isOpen && panelTab === "prompt" ? "chip-accent" : "hover:!text-[#fbbf24]"}`}>
          ⚡ Prompt
        </button>
      )}
    </div>
  );
}

function SeedRow({ p, s, rank, color, expandedKey, panelTab, onToggle, columns }: {
  p: Project; s: ReturnType<typeof computeScores>; rank: number; color: string;
  expandedKey: string | null; panelTab: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt"; onToggle: (k: string, pt: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt") => void;
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
            {p.license && <span className="chip !text-[9px] !text-emerald-300 !border-emerald-400/40">🔓 {p.license}</span>}
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
  expandedKey: string | null; panelTab: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt"; onToggle: (k: string, pt: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt") => void;
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
            <span className="chip !text-[9px] !text-emerald-300 !border-emerald-400/40">🔓 开源</span>
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
  panelTab: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt";
  onTab: (k: string, pt: "analysis" | "diagram" | "director" | "agent" | "expert" | "prompt") => void;
}) {
  const key = seed ? `seed:${seed.slug}` : `live:${repo!.fullName}`;
  return (
    <div className="border-t border-[#16213a] bg-[#0a101d] px-4 py-4">
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <button onClick={() => onTab(key, "analysis")} className={`chip cursor-pointer w-full justify-center ${panelTab === "analysis" ? "chip-accent" : ""}`}><FileText size={11} /> 分析（完整逆向工程）</button>
        <button onClick={() => onTab(key, "diagram")} className={`chip cursor-pointer w-full justify-center ${panelTab === "diagram" ? "chip-accent" : ""}`}><Boxes size={11} /> 产品框图（功能实现路径）</button>
        <button onClick={() => onTab(key, "expert")} className={`chip cursor-pointer w-full justify-center ${panelTab === "expert" ? "chip-accent" : ""}`}><UserRoundCheck size={11} /> 专家实战</button>
        <button onClick={() => onTab(key, "agent")} className={`chip cursor-pointer w-full justify-center ${panelTab === "agent" ? "chip-accent" : ""}`}><Bot size={11} /> Agent 拆解</button>
        <button onClick={() => onTab(key, "director")} className={`chip cursor-pointer w-full justify-center ${panelTab === "director" ? "chip-accent" : ""}`}><UserRoundCheck size={11} /> 产品总监视角</button>
        {seed ? (
          <Link href={`/projects/${seed.slug}/prompt`} className={`chip w-full justify-center ${panelTab === "prompt" ? "chip-accent" : ""}`}>⚡ Prompt</Link>
        ) : (
          <button onClick={() => onTab(key, "prompt")} className={`chip cursor-pointer w-full justify-center ${panelTab === "prompt" ? "chip-accent" : ""}`}>⚡ Prompt</button>
        )}
      </div>
      {seed ? (
        panelTab === "analysis" ? <MasterAnalysis project={seed} /> :
        panelTab === "diagram" ? <FeaturePathDiagram project={seed} /> :
        panelTab === "director" ? <DirectorView project={seed} /> :
        panelTab === "agent" ? <AgentCockpit project={seed} /> :
        panelTab === "expert" ? <ExpertCockpit project={seed} /> :
        <Link href={`/projects/${seed.slug}/prompt`} className="chip chip-accent">打开「项目全部 Prompt」页 →</Link>
      ) : (
        <LiveSourcePanel repo={repo!} mode={panelTab} />
      )}
    </div>
  );
}





