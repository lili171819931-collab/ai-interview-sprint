"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock, RefreshCw, Radio, Database, AlertTriangle, ChevronDown, ChevronUp, Microscope, Boxes, ExternalLink, GitCommitHorizontal } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { categoryOf } from "@/lib/categories";
import { buildReverseEngineering, buildIntelligenceReport } from "@/lib/reverse";
import { buildProductDna } from "@/lib/learning";
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
  const [panelTab, setPanelTab] = useState<"reverse" | "dna">("reverse");

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

  const toggle = (key: string, pt: "reverse" | "dna") => {
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
        每个项目均可「分析」进入项目页 / GitHub，「逆向拆解」查看实现路径与架构，「产品框图」查看 Product DNA 底层逻辑图。
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
  seed?: Project; repo?: LiveRepo; expandedKey: string | null; panelTab: "reverse" | "dna";
  onToggle: (key: string, pt: "reverse" | "dna") => void;
}) {
  const key = seed ? `seed:${seed.slug}` : `live:${repo!.fullName}`;
  const isOpen = expandedKey === key;
  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      {seed ? (
        <Link href={`/projects/${seed.slug}`} className="chip chip-accent !text-[11px]">分析</Link>
      ) : (
        <a href={`https://github.com/${repo!.fullName}`} target="_blank" className="chip !text-[11px]"><GithubIcon size={11} /> GitHub</a>
      )}
      <button onClick={() => onToggle(key, "reverse")} className={`chip !text-[11px] cursor-pointer ${isOpen && panelTab === "reverse" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <Microscope size={11} /> 逆向拆解
      </button>
      <button onClick={() => onToggle(key, "dna")} className={`chip !text-[11px] cursor-pointer ${isOpen && panelTab === "dna" ? "chip-accent" : "hover:!text-[#7dd3fc]"}`}>
        <Boxes size={11} /> 产品框图
      </button>
    </div>
  );
}

function SeedRow({ p, s, rank, color, expandedKey, panelTab, onToggle, columns }: {
  p: Project; s: ReturnType<typeof computeScores>; rank: number; color: string;
  expandedKey: string | null; panelTab: "reverse" | "dna"; onToggle: (k: string, pt: "reverse" | "dna") => void;
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
        <button onClick={() => onToggle(key, open ? "reverse" : "reverse")} className="text-[#4d5a75]"><ChevronDown size={14} /></button>
      </div>
      {open && <ExpandPanel seed={p} panelTab={panelTab} onTab={onToggle} />}
    </div>
  );
}

function LiveRow({ repo, rank, color, expandedKey, panelTab, onToggle, columns }: {
  repo: LiveRepo; rank: number; color: string;
  expandedKey: string | null; panelTab: "reverse" | "dna"; onToggle: (k: string, pt: "reverse" | "dna") => void;
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
        <button onClick={() => onToggle(key, open ? "reverse" : "reverse")} className="text-[#4d5a75]"><ChevronDown size={14} /></button>
      </div>
      {open && <ExpandPanel repo={repo} panelTab={panelTab} onTab={onToggle} />}
    </div>
  );
}

function ExpandPanel({ seed, repo, panelTab, onTab }: {
  seed?: Project; repo?: LiveRepo;
  panelTab: "reverse" | "dna";
  onTab: (k: string, pt: "reverse" | "dna") => void;
}) {
  const key = seed ? `seed:${seed.slug}` : `live:${repo!.fullName}`;
  return (
    <div className="border-t border-[#16213a] bg-[#0a101d] px-4 py-4">
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => onTab(key, "reverse")} className={`chip cursor-pointer ${panelTab === "reverse" ? "chip-accent" : ""}`}><Microscope size={11} /> 逆向拆解</button>
        <button onClick={() => onTab(key, "dna")} className={`chip cursor-pointer ${panelTab === "dna" ? "chip-accent" : ""}`}><Boxes size={11} /> 产品框图</button>
      </div>
      {panelTab === "reverse"
        ? seed ? <ReversePanel p={seed} /> : <LiveReversePanel repo={repo!} />
        : seed ? <DnaPanel p={seed} /> : <LiveDnaPanel repo={repo!} />}
    </div>
  );
}

function ReversePanel({ p }: { p: Project }) {
  const r = buildReverseEngineering(p);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MiniBlock title="产品功能实现路径" color="#34d399" icon="⚙️">
        <div className="space-y-1">
          {r.implementationPath.slice(0, 10).map((x, i) => (
            <div key={i} className="flex gap-1.5 text-[11.5px] leading-snug">
              <span className="text-[#5b6885] num">{i + 1}.</span>
              <span className="text-[#cfe0ff]">{x.step}</span>
              <span className="chip !text-[9px]" style={{ color: { Confirmed: "#34d399", Inferred: "#7dd3fc", Hypothesis: "#fbbf24", Unknown: "#f87171" }[x.evidence], borderColor: { Confirmed: "#34d399", Inferred: "#7dd3fc", Hypothesis: "#fbbf24", Unknown: "#f87171" }[x.evidence] + "55" }}>{x.evidence}</span>
            </div>
          ))}
        </div>
      </MiniBlock>
      <MiniBlock title="底层逻辑 · Product DNA" color="#7dd3fc" icon="🧬">
        <div className="flex flex-wrap gap-1">
          {r.productDnaFlow.map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="rounded-md bg-[#0c1322] border border-[#2c4370] px-1.5 py-0.5 text-[10px] text-[#cfe0ff]">{step}</span>
              {i < r.productDnaFlow.length - 1 && <span className="text-[#4f8cff] text-[9px]">→</span>}
            </span>
          ))}
        </div>
      </MiniBlock>
      <MiniBlock title="技术架构" color="#a78bfa" icon="🏗️">
        <div className="space-y-1">
          {r.sourceArchitecture.tree.slice(0, 6).map((t, i) => <div key={i} className="text-[11px] text-[#aab6cd] font-mono">· {t}</div>)}
          <div className="pt-1 text-[10.5px] text-[#5b6885]">选型：{r.techStackExplained.slice(0, 4).map((t) => t.tech).join(" / ")}</div>
        </div>
      </MiniBlock>
      <MiniBlock title="产品架构" color="#f472b6" icon="📐">
        <div className="space-y-1">
          {Object.entries(r.productToTech).slice(0, 6).map(([k, v]) => (
            <div key={k} className="flex gap-1.5 text-[11px]">
              <span className="w-20 shrink-0 text-[#7dd3fc] font-semibold capitalize">{k}</span>
              <span className="text-[#aab6cd] line-clamp-2">{v}</span>
            </div>
          ))}
        </div>
        <Link href={`/projects/${p.slug}#reverse`} className="chip chip-accent mt-2">完整 40 节报告 →</Link>
      </MiniBlock>
    </div>
  );
}

function LiveReversePanel({ repo }: { repo: LiveRepo }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MiniBlock title="产品功能实现路径" color="#34d399" icon="⚙️">
        <div className="text-[11.5px] text-[#5b6885] leading-relaxed">实时项目（GitHub 实时拉取）暂未抓取源码，无法生成实现路径；建议进入 GitHub 查看 README/源码后再分析。</div>
      </MiniBlock>
      <MiniBlock title="底层逻辑 · 元数据" color="#7dd3fc" icon="🧬">
        <div className="space-y-1 text-[11.5px] text-[#aab6cd]">
          <div><b className="text-[#7dd3fc]">定位：</b>{repo.description ?? "—"}</div>
          <div><b className="text-[#7dd3fc]">主题：</b>{repo.topics.slice(0, 6).join(" / ") || "—"}</div>
        </div>
      </MiniBlock>
      <MiniBlock title="技术架构" color="#a78bfa" icon="🏗️">
        <div className="text-[11.5px] text-[#aab6cd]">语言：{repo.language ?? "—"} · License：{repo.license ?? "—"} · 最近更新：{repo.updatedAt}</div>
      </MiniBlock>
      <MiniBlock title="社区信号" color="#f472b6" icon="📐">
        <div className="text-[11.5px] text-[#aab6cd]">⭐ {formatStars(repo.stars)} · 🍴 {formatStars(repo.forks)} · Issues {repo.openIssues.toLocaleString()}</div>
      </MiniBlock>
    </div>
  );
}

function DnaPanel({ p }: { p: Project }) {
  const dna = buildProductDna(p);
  return (
    <div>
      <div className="text-[12px] font-semibold text-[#7dd3fc] mb-3">产品框图 · Product DNA（14 节点底层逻辑）</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {dna.map((n, i) => (
          <div key={n.label} className="flex items-center gap-1.5">
            <div className="rounded-xl bg-[#0c1322] border border-[#2c4370] px-3 py-2 text-center min-w-[70px]">
              <div className="text-[10px] font-bold text-[#7dd3fc] uppercase">{n.label}</div>
              <div className="text-[11px] text-[#cfe0ff] leading-snug mt-0.5 max-w-[120px]">{n.value}</div>
            </div>
            {i < dna.length - 1 && <GitCommitHorizontal size={13} className="text-[#4f8cff] shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveDnaPanel({ repo }: { repo: LiveRepo }) {
  const status = liveStatus(repo);
  const nodes = [
    { label: "Project", value: repo.name },
    { label: "定位", value: repo.description ?? "—" },
    { label: "语言", value: repo.language ?? "—" },
    { label: "主题", value: repo.topics.slice(0, 4).join(" · ") || "—" },
    { label: "2026", value: TIME_STATUS_META[status].label },
    { label: "社区", value: `⭐${formatStars(repo.stars)} · 🍴${formatStars(repo.forks)}` },
    { label: "发布", value: repo.createdAt },
  ];
  return (
    <div>
      <div className="text-[12px] font-semibold text-[#7dd3fc] mb-3">产品框图 · 实时项目元数据（进入平台快照可获得完整 14 节点 DNA）</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex items-center gap-1.5">
            <div className="rounded-xl bg-[#0c1322] border border-[#2c4370] px-3 py-2 text-center min-w-[70px]">
              <div className="text-[10px] font-bold text-[#7dd3fc] uppercase">{n.label}</div>
              <div className="text-[11px] text-[#cfe0ff] leading-snug mt-0.5 max-w-[130px]">{n.value}</div>
            </div>
            {i < nodes.length - 1 && <GitCommitHorizontal size={13} className="text-[#4f8cff] shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBlock({ title, color, icon, children }: { title: string; color: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
      <div className="text-[11.5px] font-bold mb-2" style={{ color }}>{icon} {title}</div>
      {children}
    </div>
  );
}
