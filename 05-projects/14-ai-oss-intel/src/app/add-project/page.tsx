"use client";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Link2, RefreshCw, FileText, Boxes, UserRoundCheck, Check, AlertTriangle, Database } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { formatStars } from "@/lib/engines";
import { isOpenSourceLicense } from "@/lib/licenses";
import { fetchRepoSource, type SourceIntel } from "@/lib/source";
import { addProject } from "@/lib/db";
import { buildSourceReportMarkdown, buildProjectReportMarkdown } from "@/lib/report";
import { buildProjectPrompt } from "@/lib/prompt";
import { useState as usePromptState } from "react";
import { MasterAnalysis, FeaturePathDiagram, DirectorView, LiveSourcePanel } from "@/components/analysis/AnalysisView";
import { ReportActions } from "@/components/ReportActions";
import type { LiveRepo } from "@/lib/live";
import type { Project } from "@/lib/types";

type Tab = "analysis" | "diagram" | "director" | "prompt" | "report";

export default function AddProjectPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    repo: LiveRepo;
    intel: SourceIntel;
    seed?: Project;
    degraded?: string;
    linked: boolean;
  } | null>(null);
  const [tab, setTab] = useState<Tab>("analysis");

  const run = async () => {
    const parsed = parseRepo(input.trim());
    if (!parsed) { setError("请输入有效的 GitHub 链接，如 https://github.com/openai/codex 或 owner/repo"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    setTab("analysis");
    try {
      setStep("正在获取仓库元数据（GitHub API）…");
      const repo = await fetchRepoMeta(parsed.owner, parsed.repo);
      setStep("正在抓取源码：README → 依赖清单 → 目录树…");
      const { intel, degraded } = await fetchRepoSource(repo.fullName);
      const seed = PROJECTS.find((p) => p.fullName.toLowerCase() === repo.fullName.toLowerCase());
      setStep("正在生成三件套与全项目分析报告…");
      await new Promise((r) => setTimeout(r, 300));
      const linked = isOpenSourceLicense(repo.license);
      if (linked) {
        addProject(repo);
        if (seed) {
          try {
            const raw = localStorage.getItem("aioss.watchlist") ?? "[]";
            const list: string[] = JSON.parse(raw);
            if (!list.includes(seed.slug)) localStorage.setItem("aioss.watchlist", JSON.stringify([...list, seed.slug]));
          } catch {}
        }
      }
      setResult({ repo, intel, seed, degraded, linked });
    } catch (e) {
      setError((e as Error).message || "生成失败（GitHub API 限流或仓库不存在，请稍后重试）");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-2"><Link2 size={18} className="text-[#7dd3fc]" /><h1 className="text-xl font-bold text-white">添加 GitHub 项目 · 一键生成三件套 + 完整报告</h1></div>
        <p className="text-[13px] text-[#8b98b3]">粘贴任意 GitHub 项目链接（或 owner/repo），自动抓取仓库元数据与源码，生成 分析 / 产品框图 / 产品总监视角 + 全项目分析报告，并联动全平台数据库（Discover / Insights / My GitHub / 分类榜可见）。</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(); }}
            placeholder="https://github.com/openai/codex 或 owner/repo"
            className="h-11 flex-1 min-w-[240px] px-3.5 rounded-xl bg-[#0c1322] border border-[#1c2942] text-[13.5px] placeholder:text-[#4d5a75] focus:outline-none focus:border-[#2c4370]"
          />
          <button onClick={run} disabled={loading} className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#2f6bff] to-[#7c5cff] text-white font-semibold text-[13.5px] flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> 一键生成
          </button>
        </div>
        {loading && <div className="mt-3 text-[12.5px] text-[#7dd3fc]">⏳ {step}</div>}
        {error && <div className="mt-3 text-[12.5px] text-[#f87171]">⚠️ {error}</div>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            "https://github.com/langgenius/dify",
            "https://github.com/browser-use/browser-use",
            "https://github.com/assafelovic/gpt-researcher",
          ].map((ex) => (
            <button key={ex} onClick={() => setInput(ex)} className="chip cursor-pointer hover:!text-[#7dd3fc]">{ex}</button>
          ))}
        </div>
      </div>

      {result && (
        <>
          {/* 项目头 */}
          <div className="panel p-5">
            <div className="flex flex-wrap items-center gap-2">
              <a href={`https://github.com/${result.repo.fullName}`} target="_blank" className="text-lg font-extrabold text-white hover:text-[#7dd3fc]">
                {result.repo.name} <ExternalLink size={14} className="inline text-[#4d5a75]" />
              </a>
              {result.seed && <Link href={`/projects/${result.seed.slug}`} className="chip chip-accent">已收录 · 打开平台页</Link>}
              {result.linked ? (
                <span className="chip !text-emerald-300 !border-emerald-400/40"><Check size={11} /> 已联动全平台数据库</span>
              ) : (
                <span className="chip !text-amber-300 !border-amber-400/40"><AlertTriangle size={11} /> 非开源许可，仅本地分析</span>
              )}
            </div>
            <p className="text-[12.5px] text-[#8b98b3] mt-1">{result.repo.description ?? result.repo.fullName}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="chip">⭐ {formatStars(result.repo.stars)}</span>
              <span className="chip">🍴 {formatStars(result.repo.forks)}</span>
              <span className="chip">🕐 发布于 {result.repo.createdAt}</span>
              <span className="chip">🔓 {result.repo.license ?? "—"}</span>
              {result.repo.language && <span className="chip">{result.repo.language}</span>}
              {result.repo.topics.slice(0, 5).map((t) => <span key={t} className="chip">#{t}</span>)}
            </div>
            {result.degraded && <div className="mt-2 text-[11.5px] text-[#fbbf24]">⚠️ {result.degraded}</div>}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTab("analysis")} className={`chip cursor-pointer ${tab === "analysis" ? "chip-accent" : ""}`}><FileText size={12} /> 分析（完整逆向工程）</button>
            <button onClick={() => setTab("diagram")} className={`chip cursor-pointer ${tab === "diagram" ? "chip-accent" : ""}`}><Boxes size={12} /> 产品框图</button>
            <button onClick={() => setTab("director")} className={`chip cursor-pointer ${tab === "director" ? "chip-accent" : ""}`}><UserRoundCheck size={12} /> 产品总监视角</button>
            <button onClick={() => setTab("prompt")} className={`chip cursor-pointer ${tab === "prompt" ? "chip-accent" : ""}`}>⚡ Prompt</button>
            <button onClick={() => setTab("report")} className={`chip cursor-pointer ${tab === "report" ? "chip-accent" : ""}`}><Database size={12} /> 完整报告</button>
            <div className="ml-auto">
              <ReportActions markdown={result.seed ? buildProjectReportMarkdown(result.seed) : buildSourceReportMarkdown(result.repo, result.intel)} />
            </div>
          </div>

          <div className="panel p-5">
            {tab === "analysis" && (result.seed ? <MasterAnalysis project={result.seed} /> : <LiveSourcePanel repo={result.repo} mode="analysis" />)}
            {tab === "diagram" && (result.seed ? <FeaturePathDiagram project={result.seed} /> : <LiveSourcePanel repo={result.repo} mode="diagram" />)}
            {tab === "director" && (result.seed ? <DirectorView project={result.seed} /> : <LiveSourcePanel repo={result.repo} mode="director" />)}
            {tab === "prompt" && (result.seed ? (
              <div>
                <div className="text-[12px] font-bold text-white mb-2">⚡ 项目 Prompt（展示与复制）</div>
                <LivePromptPage seed={result.seed} />
              </div>
            ) : (
              <LiveSourcePanel repo={result.repo} mode="prompt" />
            ))}
            {tab === "report" && (
              <div>
                <div className="text-[12px] font-bold text-[#7dd3fc] mb-2">📄 全项目分析报告（Markdown · 完整链路 + 40 节 + 总监视角）</div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-[#aab6cd] bg-[#0c1322] border border-[#16213a] rounded-xl p-4 max-h-[560px] overflow-y-auto">
                  {result.seed ? buildProjectReportMarkdown(result.seed) : buildSourceReportMarkdown(result.repo, result.intel)}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function parseRepo(input: string): { owner: string; repo: string } | null {
  const t = input.trim().replace(/\/+$/, "");
  const m = t.match(/github\.com\/([^/?#\s]+)\/([^/?#\s]+)/i);
  if (m) return { owner: m[1], repo: m[2] };
  const m2 = t.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (m2) return { owner: m2[1], repo: m2[2] };
  return null;
}

async function fetchRepoMeta(owner: string, repo: string): Promise<LiveRepo> {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) {
    if (res.status === 403 || res.status === 429) throw new Error("GitHub API 限流（未认证 60 次/小时），请稍后重试");
    if (res.status === 404) throw new Error("仓库不存在（404），请检查链接");
    throw new Error(`GitHub API ${res.status}`);
  }
  const it = await res.json();
  return {
    fullName: it.full_name,
    name: it.full_name.split("/")[1],
    owner: it.full_name.split("/")[0],
    stars: it.stargazers_count ?? 0,
    forks: it.forks_count ?? 0,
    openIssues: it.open_issues_count ?? 0,
    language: it.language ?? null,
    description: it.description ?? null,
    topics: (it.topics ?? []).slice(0, 10),
    createdAt: (it.created_at ?? "").slice(0, 10),
    updatedAt: (it.updated_at ?? "").slice(0, 10),
    homepage: it.homepage ?? null,
    license: it.license?.spdx_id ?? null,
  };
}


function LivePromptPage({ seed }: { seed: Project }) {
  const [copied, setCopied] = usePromptState(false);
  const md = buildProjectPrompt(seed);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-bold text-white">⚡ 项目 Prompt（展示与复制）</span>
        <button onClick={async () => { try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }} className="chip hover:!text-[#7dd3fc] ml-auto">{copied ? "✓ 已复制" : "📋 复制"}</button>
        <button onClick={() => { const b = new Blob([md], { type: "text/markdown;charset=utf-8" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${seed.slug}-prompt.md`; a.click(); URL.revokeObjectURL(u); }} className="chip hover:!text-[#7dd3fc]">⬇️ 下载 .md</button>
      </div>
      <pre className="whitespace-pre-wrap font-mono text-[11px] text-[#cfe0ff] bg-[#0c1322] border border-[#16213a] rounded-xl p-4 max-h-[520px] overflow-y-auto leading-relaxed">{md}</pre>
    </div>
  );
}
