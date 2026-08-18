"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Boxes, UserRoundCheck, GitCommitHorizontal, ExternalLink } from "lucide-react";
import {
  buildMasterReport, buildFactSheet, buildKillerFeature, buildBeforeAfter, buildAiValueMap,
  buildFeatureDependency, buildTechChallenges, buildProductChallenges, buildProduct2,
  buildCloningPlan, buildThreeConclusions, buildPanorama, buildDirectorView,
} from "@/lib/master";
import { formatPct, formatSigned, formatStars } from "@/lib/engines";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { liveStatus, type LiveRepo } from "@/lib/live";
import { fetchRepoSource, getCachedSource, type SourceIntel } from "@/lib/source";
import { buildSourceMasterReport, buildSourcePanorama, buildSourceDirectorView, buildSourceFactSheet } from "@/lib/sourceMaster";
import { buildCompleteChain, buildTechRouteMainline } from "@/lib/master";
import { buildSourceCompleteChain } from "@/lib/sourceMaster";
import { buildProjectReportMarkdown, buildSourceReportMarkdown } from "@/lib/report";
import { ReportActions } from "@/components/ReportActions";
import type { Project } from "@/lib/types";

/* ── 分析（Master Reverse Engineering，含以上所有需求） ─────────── */
export function MasterAnalysis({ project }: { project: Project }) {
  const report = buildMasterReport(project);
  const fact = buildFactSheet(project);
  const killer = buildKillerFeature(project);
  const ba = buildBeforeAfter(project);
  const aiMap = buildAiValueMap(project);
  const deps = buildFeatureDependency(project);
  const techCh = buildTechChallenges(project);
  const prodCh = buildProductChallenges(project);
  const p2 = buildProduct2(project);
  const clone = buildCloningPlan(project);
  const three = buildThreeConclusions(project);
  const panorama = buildPanorama(project);
  const ts = timeStatusOf(project);
  const meta = TIME_STATUS_META[ts];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#101a2e] border border-[#2c4370] p-2.5">
        <span className="text-[12px] font-bold text-white">📄 完整报告</span>
        <Link href={`/projects/${project.slug}/report`} className="chip chip-accent ml-auto">打开完整报告页 →</Link>
        <ReportActions markdown={buildProjectReportMarkdown(project)} />
      </div>

      {/* 完整链路（平台灵魂） */}
      <CompleteChain project={project} />

      {/* 三结论 */}
      <div className="grid gap-2 md:grid-cols-3">
        {[["WHY IT WORKS", three.why, "#34d399"], ["HOW IT WORKS", three.how, "#7dd3fc"], ["WHERE IT GOES", three.where, "#fbbf24"]].map(([k, v, c]) => (
          <div key={k as string} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
            <div className="text-[11px] font-bold mb-1" style={{ color: c as string }}>{k}</div>
            <div className="text-[11.5px] text-[#aab6cd] leading-relaxed">{v}</div>
          </div>
        ))}
      </div>

      {/* 产品全景图 */}
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="text-[12px] font-bold text-[#7dd3fc] mb-3">产品全景图 · PRODUCT PANORAMA</div>
        <div className="flex flex-wrap items-center gap-1">
          {panorama.map((n, i) => (
            <div key={n.node} className="flex items-center gap-1">
              <div className="rounded-lg bg-[#101a2e] border border-[#2c4370] px-2.5 py-1.5 text-center">
                <div className="text-[9.5px] font-bold text-white tracking-wide">{n.node}</div>
                {n.sub && <div className="text-[9px] text-[#8b98b3] max-w-[130px] truncate">{n.sub[0]}</div>}
              </div>
              {i < panorama.length - 1 && <GitCommitHorizontal size={11} className="text-[#4f8cff]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Fact sheet + Killer */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#34d399] mb-2">PROJECT FACT SHEET</div>
          <div className="space-y-1">
            {fact.map((x) => (
              <div key={x.k} className="flex gap-2 text-[11.5px]">
                <span className="w-24 shrink-0 text-[#5b6885]">{x.k}</span>
                <span className="text-[#cfe0ff] break-all">{x.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip" style={{ color: meta.color, borderColor: meta.color + "55" }}>{meta.label}</span>
            <span className="chip">🕐 发布时间 {project.createdAt}</span>
            <span className="chip">⭐ {formatStars(project.stars)}</span>
            <span className="chip">↗ {formatSigned(project.growth30d)} ({formatPct((project.growth30d / (project.stars - project.growth30d)) * 100)})</span>
          </div>
        </div>
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#fbbf24] mb-2">KILLER FEATURE · 杀手级功能</div>
          <div className="text-[13px] font-semibold text-white mb-1.5">{killer.feature}</div>
          <div className="space-y-1 text-[11.5px] text-[#aab6cd]">
            <div>· {killer.why}</div>
            <div>· 留存：{killer.retention}</div>
            <div>· 壁垒：{killer.moat}</div>
            <div>· 商业化：{killer.commercial}</div>
            <div>· 可复制性：{killer.copyable}</div>
          </div>
        </div>
      </div>

      {/* Before / After + AI Value Map */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#60a5fa] mb-2">BEFORE VS AFTER</div>
          <div className="space-y-1.5 text-[11.5px] text-[#aab6cd]">
            <div><b className="text-[#8b98b3]">Before：</b>{ba.before}</div>
            <div><b className="text-[#7dd3fc]">After：</b>{ba.after}</div>
            <div><b className="text-[#34d399]">减少：</b>{ba.reduce}</div>
            <div><b className="text-[#34d399]">自动化：</b>{ba.automate}</div>
            <div><b className="text-[#34d399]">增强：</b>{ba.enhance}</div>
            <div><b className="text-[#fbbf24]">创造：</b>{ba.create}</div>
          </div>
        </div>
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#a78bfa] mb-2">AI VALUE MAP</div>
          <div className="space-y-1.5">
            {aiMap.map((t) => (
              <div key={t.tier} className="flex gap-2 text-[11.5px]">
                <span className="chip !text-[10px] shrink-0">{t.tier}</span>
                <span className="text-[#aab6cd]">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature dependency + challenges */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#2dd4bf] mb-2">FEATURE DEPENDENCY GRAPH</div>
          <div className="space-y-2">
            {deps.map((d) => (
              <div key={d.path}>
                <div className="text-[11px] font-semibold text-[#7dd3fc]">{d.path}</div>
                <div className="text-[11px] text-[#aab6cd]">{d.items.join(" → ")}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[12px] font-bold text-[#f87171] mb-2">TECHNICAL CHALLENGES</div>
            <div className="space-y-1 text-[11px] text-[#aab6cd]">{techCh.slice(0, 6).map((c, i) => <div key={i}>· {c}</div>)}</div>
          </div>
          <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
            <div className="text-[12px] font-bold text-[#fbbf24] mb-2">PRODUCT CHALLENGES</div>
            <div className="space-y-1 text-[11px] text-[#aab6cd]">{prodCh.map((c, i) => <div key={i}>· {c}</div>)}</div>
          </div>
        </div>
      </div>

      {/* Product 2.0 + Cloning */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#7dd3fc] mb-2">PRODUCT 2.0</div>
          <div className="space-y-1 text-[11.5px] text-[#aab6cd]">
            <div><b>当前：</b>{p2.current}</div>
            <div><b>问题：</b>{p2.problems.join("；")}</div>
            <div><b>机会：</b>{p2.opportunity}</div>
            <div><b>新产品：</b>{p2.newProduct}</div>
            <div><b>新 UX：</b>{p2.newUx}</div>
            <div><b>新 AI：</b>{p2.newAi}</div>
            <div><b>新商业模式：</b>{p2.newBusiness}</div>
          </div>
        </div>
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#34d399] mb-2">PRODUCT CLONING PLAN · 抄作业</div>
          <div className="space-y-1 text-[11.5px] text-[#aab6cd]">
            <div><b>MVP：</b>{clone.mvp}</div>
            <div><b>核心架构：</b>{clone.coreArchitecture}</div>
            <div><b>AI 栈：</b>{clone.aiStack}</div>
            <div><b>数据：</b>{clone.data}</div>
            <div><b>Workflow：</b>{clone.workflow}</div>
            <div><b>团队：</b>{clone.team}</div>
            <div><b>周期：</b>{clone.timeline}</div>
            <div><b>成本：</b>{clone.cost}</div>
            <div><b>风险：</b>{clone.risk}</div>
          </div>
        </div>
      </div>

      {/* 40-section report */}
      <details className="rounded-xl bg-[#0c1322] border border-[#16213a]" open>
        <summary className="cursor-pointer px-4 py-3 text-[12.5px] font-bold text-white flex items-center gap-2">
          <FileText size={13} className="text-[#7dd3fc]" /> PROJECT REVERSE ENGINEERING REPORT · 40 节完整报告（默认展开）
        </summary>
        <div className="px-4 pb-4 space-y-1.5 max-h-[420px] overflow-y-auto">
          {report.map((sec) => (
            <div key={sec.n} className="rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5">
              <div className="text-[11px] font-bold text-[#7dd3fc]">{String(sec.n).padStart(2, "0")} · {sec.title}</div>
              <div className="text-[11.5px] text-[#aab6cd] mt-0.5 leading-relaxed">{sec.body}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

/* ── 产品框图 · 功能实现路径框图 ─────────────────────────────── */
export function FeaturePathDiagram({ project }: { project: Project }) {
  const r = requireReverse(project);
  const steps = r.implementationPath;
  const evidenceColor: Record<string, string> = { Confirmed: "#34d399", Inferred: "#7dd3fc", Hypothesis: "#fbbf24", Unknown: "#f87171" };
  return (
    <div>
      <div className="text-[12px] font-bold text-[#7dd3fc] mb-3">功能实现路径框图 · FEATURE IMPLEMENTATION PATH</div>
      <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0c1322] border border-[#2c4370] p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#5b6885] num">STEP {String(i + 1).padStart(2, "0")}</span>
              <span className="chip !text-[9px]" style={{ color: evidenceColor[s.evidence], borderColor: evidenceColor[s.evidence] + "55" }}>{s.evidence}</span>
            </div>
            <div className="text-[12px] font-bold text-white mt-1">{s.step}</div>
            <div className="text-[10px] text-[#5b6885]">{s.layer}</div>
            <div className="text-[10.5px] text-[#8b98b3] mt-0.5 leading-snug">{s.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 产品总监视角：边界 / 痛点 / 真实案例预测 ────────────────── */
export function DirectorView({ project }: { project: Project }) {
  const d = buildDirectorView(project);
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-2"><UserRoundCheck size={14} className="text-[#a78bfa]" /><span className="text-[12.5px] font-bold text-white">边界考虑 · Boundary</span></div>
        <div className="grid gap-2 md:grid-cols-3 text-[11.5px]">
          <div className="rounded-lg bg-[#101a2e] border border-emerald-400/25 p-2.5">
            <div className="text-[11px] font-bold text-emerald-300 mb-1">✅ 范围内（In Scope）</div>
            {d.boundary.inScope.map((x, i) => <div key={i}>· {x}</div>)}
          </div>
          <div className="rounded-lg bg-[#101a2e] border border-rose-400/25 p-2.5">
            <div className="text-[11px] font-bold text-rose-300 mb-1">⛔ 范围外（Out of Scope）</div>
            {d.boundary.outScope.map((x, i) => <div key={i}>· {x}</div>)}
          </div>
          <div className="rounded-lg bg-[#101a2e] border border-amber-400/25 p-2.5">
            <div className="text-[11px] font-bold text-amber-300 mb-1">⚠️ 约束（Constraints）</div>
            {d.boundary.constraints.map((x, i) => <div key={i}>· {x}</div>)}
          </div>
        </div>
        <div className="mt-2 text-[11.5px] text-[#aab6cd]"><b className="text-[#7dd3fc]">边界结论：</b>{d.boundary.verdict}</div>
      </div>

      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-2"><UserRoundCheck size={14} className="text-[#f87171]" /><span className="text-[12.5px] font-bold text-white">痛点分析 · Pain Point</span></div>
        <div className="space-y-1.5 text-[11.5px] text-[#aab6cd]">
          <div><b className="text-[#f87171]">深层痛点：</b>{d.pain.deep}</div>
          <div><b className="text-[#fbbf24]">路径摩擦：</b>{d.pain.journeyFriction}</div>
          <div><b className="text-[#34d399]">未被满足：</b>{d.pain.unmet}</div>
        </div>
      </div>

      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-2"><UserRoundCheck size={14} className="text-[#34d399]" /><span className="text-[12.5px] font-bold text-white">真实案例预测 · Case Prediction</span></div>
        <div className="grid gap-2 md:grid-cols-3">
          {d.cases.map((c) => (
            <div key={c.name} className="rounded-lg bg-[#101a2e] border border-[#16213a] p-3">
              <div className="text-[11.5px] font-bold text-[#7dd3fc] mb-1">{c.name}</div>
              <div className="space-y-1 text-[10.5px] text-[#aab6cd]">
                <div><b>用户：</b>{c.user}</div>
                <div><b>场景：</b>{c.scenario}</div>
                <div><b>之前：</b>{c.before}</div>
                <div><b>之后：</b>{c.after}</div>
                <div><b>预期：</b>{c.outcome}</div>
                <div><b>指标：</b>{c.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Live（实时项目）源码深度分析 ─────────────────────────────── */
export function LiveSourcePanel({ repo, mode }: { repo: LiveRepo; mode: "analysis" | "diagram" | "director" }) {
  const [intel, setIntel] = useState<SourceIntel | null>(() => getCachedSource(repo.fullName));
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [degraded, setDegraded] = useState<string | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!intel) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async () => {
    setLoading(true);
    setError("");
    setStep("正在抓取源码：README → 依赖清单 → 目录树…");
    try {
      const { intel: i, degraded: d } = await fetchRepoSource(repo.fullName);
      setStep("正在生成逆向工程报告与产品全景图…");
      await new Promise((r) => setTimeout(r, 250));
      setIntel(i);
      setDegraded(d);
    } catch (e) {
      setError((e as Error).message || "源码抓取失败");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[12.5px] text-[#7dd3fc]">
          <span className="inline-block w-4 h-4 border-2 border-[#4f8cff] border-t-transparent rounded-full animate-spin" />
          {step || "源码分析中…"}
        </div>
        <div className="text-[11.5px] text-[#5b6885]">（raw.githubusercontent.com 抓取 README/依赖；git/trees 抓取目录树，受 GitHub API 限流影响时会降级）</div>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="space-y-2">
        <div className="text-[12.5px] text-[#f87171]">{error || "源码抓取失败"}</div>
        <button onClick={run} className="chip cursor-pointer hover:!text-[#7dd3fc]">重试抓取源码</button>
      </div>
    );
  }

  if (mode === "analysis") return <LiveSourceAnalysis repo={repo} intel={intel} degraded={degraded} onRefresh={run} />;
  if (mode === "diagram") return <LiveSourceDiagram repo={repo} intel={intel} />;
  return <LiveSourceDirector repo={repo} intel={intel} />;
}

function LiveSourceAnalysis({ repo, intel, degraded, onRefresh }: { repo: LiveRepo; intel: SourceIntel; degraded?: string; onRefresh: () => void }) {
  const report = buildSourceMasterReport(repo, intel);
  const panorama = buildSourcePanorama(repo, intel);
  const fact = buildSourceFactSheet(repo, intel);
  const status = liveStatus(repo);
  const meta = TIME_STATUS_META[status];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#101a2e] border border-[#2c4370] p-2.5">
        <span className="text-[12px] font-bold text-white">📄 完整报告（源码驱动）</span>
        <div className="ml-auto"><ReportActions markdown={buildSourceReportMarkdown(repo, intel)} /></div>
      </div>
      {degraded && <div className="rounded-xl bg-[#101a2e] border border-amber-400/30 p-2.5 text-[11.5px] text-[#fbbf24]">⚠️ {degraded}</div>}
      {/* 完整链路（源码驱动） */}
      <SourceCompleteChain repo={repo} intel={intel} />
      {/* 产品全景图（源码驱动） */}
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-bold text-[#7dd3fc]">产品全景图 · PRODUCT PANORAMA（源码驱动）</span>
          <span className="chip !text-[10px]">源码 {intel.treeSource === "tree" ? "✓ 目录树" : "README/依赖"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {panorama.map((n, i) => (
            <div key={n.node} className="flex items-center gap-1">
              <div className="rounded-lg bg-[#101a2e] border border-[#2c4370] px-2 py-1.5 text-center">
                <div className="text-[9.5px] font-bold text-white tracking-wide">{n.node}</div>
                {n.sub && <div className="text-[9px] text-[#8b98b3] max-w-[130px] truncate">{n.sub[0]}</div>}
              </div>
              {i < panorama.length - 1 && <GitCommitHorizontal size={11} className="text-[#4f8cff]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Fact sheet（源码） */}
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="text-[12px] font-bold text-[#34d399] mb-2">PROJECT FACT SHEET · 源码实抓</div>
        <div className="grid gap-1.5 md:grid-cols-2 text-[11.5px]">
          {fact.map((x) => (
            <div key={x.k} className="flex gap-2"><span className="w-24 shrink-0 text-[#5b6885]">{x.k}</span><span className="text-[#cfe0ff] break-all">{x.v}</span></div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="chip" style={{ color: meta.color, borderColor: meta.color + "55" }}>{meta.label}</span>
          <span className="chip">🕐 发布时间 {repo.createdAt}</span>
          <span className="chip">⭐ {formatStars(repo.stars)}</span>
          <span className="chip">🧠 AI：{intel.aiComponents.join("/") || "未检出"}</span>
          <button onClick={onRefresh} className="chip cursor-pointer hover:!text-[#7dd3fc]">重新抓取</button>
        </div>
      </div>

      {/* 源码证据 */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#7dd3fc] mb-2">源码模块 → 产品角色（[CONFIRMED via tree]）</div>
          <div className="space-y-1 text-[11.5px] text-[#aab6cd]">
            {intel.moduleMap.map((m) => <div key={m.module}>· <b className="text-[#cfe0ff] font-mono">{m.module}</b> → {m.role} ({m.evidence})</div>)}
          </div>
        </div>
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#f472b6] mb-2">功能 → 代码映射</div>
          <div className="space-y-2">
            {intel.featureToCode.map((x) => (
              <div key={x.feature} className="text-[11.5px]">
                <b className="text-[#cfe0ff]">{x.feature}</b>
                <div className="text-[10.5px] text-[#8b98b3]">{x.chain.join(" → ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* README 片段 */}
      {intel.readme && (
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
          <div className="text-[12px] font-bold text-[#fbbf24] mb-2">README 证据片段</div>
          <pre className="whitespace-pre-wrap font-sans text-[11px] text-[#8b98b3] leading-relaxed max-h-40 overflow-y-auto">{intel.readme}</pre>
        </div>
      )}

      {/* 40 节报告 */}
      <details className="rounded-xl bg-[#0c1322] border border-[#16213a]" open>
        <summary className="cursor-pointer px-4 py-3 text-[12.5px] font-bold text-white flex items-center gap-2">
          <FileText size={13} className="text-[#7dd3fc]" /> PROJECT REVERSE ENGINEERING REPORT · 40 节（源码驱动 · 默认展开）
        </summary>
        <div className="px-4 pb-4 space-y-1.5 max-h-[420px] overflow-y-auto">
          {report.map((sec) => (
            <div key={sec.n} className="rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5">
              <div className="text-[11px] font-bold text-[#7dd3fc]">{String(sec.n).padStart(2, "0")} · {sec.title}</div>
              <div className="text-[11.5px] text-[#aab6cd] mt-0.5 leading-relaxed">{sec.body}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function LiveSourceDiagram({ repo, intel }: { repo: LiveRepo; intel: SourceIntel }) {
  return (
    <div>
      <div className="text-[12px] font-bold text-[#7dd3fc] mb-3">功能实现路径框图 · 源码驱动</div>
      <div className="grid gap-1.5 md:grid-cols-3">
        {[
          ["User Input", "用户需求", intel.tagline],
          ["Frontend", "产品入口", intel.moduleMap.find((m) => /Frontend|前端/.test(m.role))?.module ?? "src/"],
          ["API", "服务端接口", intel.moduleMap.find((m) => /Backend|API/.test(m.role))?.module ?? "api/"],
          ["AI / Agent", "AI 能力", intel.aiComponents.join(" / ") || "待源码确认"],
          ["Tools / Data", "工具与数据", intel.moduleMap.find((m) => /工具|数据/.test(m.role))?.module ?? "tools/ · data/"],
          ["Output", "结果输出", intel.features.slice(0, 2).join(" · ") || "核心功能"],
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0c1322] border border-[#2c4370] p-2.5">
            <div className="text-[10px] text-[#5b6885] num">STEP {String(i + 1).padStart(2, "0")}</div>
            <div className="text-[12px] font-bold text-white mt-0.5">{s[0]}</div>
            <div className="text-[10px] text-[#5b6885]">{s[1]}</div>
            <div className="text-[10.5px] text-[#8b98b3] mt-0.5 leading-snug">{s[2]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveSourceDirector({ repo, intel }: { repo: LiveRepo; intel: SourceIntel }) {
  const d = buildSourceDirectorView(repo, intel);
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-2"><UserRoundCheck size={14} className="text-[#a78bfa]" /><span className="text-[12.5px] font-bold text-white">边界考虑 · Boundary（源码驱动）</span></div>
        <div className="grid gap-2 md:grid-cols-3 text-[11.5px]">
          <div className="rounded-lg bg-[#101a2e] border border-emerald-400/25 p-2.5"><div className="text-[11px] font-bold text-emerald-300 mb-1">✅ 范围内</div>{d.boundary.inScope.map((x, i) => <div key={i}>· {x}</div>)}</div>
          <div className="rounded-lg bg-[#101a2e] border border-rose-400/25 p-2.5"><div className="text-[11px] font-bold text-rose-300 mb-1">⛔ 范围外</div>{d.boundary.outScope.map((x, i) => <div key={i}>· {x}</div>)}</div>
          <div className="rounded-lg bg-[#101a2e] border border-amber-400/25 p-2.5"><div className="text-[11px] font-bold text-amber-300 mb-1">⚠️ 约束</div>{d.boundary.constraints.map((x, i) => <div key={i}>· {x}</div>)}</div>
        </div>
        <div className="mt-2 text-[11.5px] text-[#aab6cd]"><b className="text-[#7dd3fc]">边界结论：</b>{d.boundary.verdict}</div>
      </div>
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-2"><UserRoundCheck size={14} className="text-[#f87171]" /><span className="text-[12.5px] font-bold text-white">痛点分析 · Pain Point</span></div>
        <div className="space-y-1.5 text-[11.5px] text-[#aab6cd]">
          <div><b className="text-[#f87171]">深层痛点：</b>{d.pain.deep}</div>
          <div><b className="text-[#fbbf24]">路径摩擦：</b>{d.pain.journeyFriction}</div>
          <div><b className="text-[#34d399]">未被满足：</b>{d.pain.unmet}</div>
        </div>
      </div>
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="flex items-center gap-2 mb-2"><UserRoundCheck size={14} className="text-[#34d399]" /><span className="text-[12.5px] font-bold text-white">真实案例预测 · Case Prediction</span></div>
        <div className="grid gap-2 md:grid-cols-3">
          {d.cases.map((c) => (
            <div key={c.name} className="rounded-lg bg-[#101a2e] border border-[#16213a] p-3">
              <div className="text-[11.5px] font-bold text-[#7dd3fc] mb-1">{c.name}</div>
              <div className="space-y-1 text-[10.5px] text-[#aab6cd]">
                <div><b>用户：</b>{c.user}</div><div><b>场景：</b>{c.scenario}</div>
                <div><b>之前：</b>{c.before}</div><div><b>之后：</b>{c.after}</div>
                <div><b>预期：</b>{c.outcome}</div><div><b>指标：</b>{c.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function requireReverse(p: Project) {
  // local re-import to avoid circular import concerns in client bundle
  const { buildReverseEngineering } = require("@/lib/reverse") as typeof import("@/lib/reverse");
  return buildReverseEngineering(p);
}


/* ── 完整链路组件：用户问题 → 需求 → 方案 → 功能 → UX → Workflow → AI → 数据流 → 技术架构 → 源码模块 → 部署 → 商业 → 增长 → 可复制性 ── */
export function CompleteChain({ project }: { project: Project }) {
  const chain = buildCompleteChain(project);
  const mainline = buildTechRouteMainline(project);
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#2c4370] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-bold text-white">🔗 完整链路 · 用户问题 → 可复制性</span>
        <span className="chip chip-accent ml-auto">{chain.length} 个环节</span>
      </div>
      <div className="space-y-1">
        {chain.map((st) => (
          <div key={st.key} className="flex items-start gap-2">
            <div className="flex flex-col items-center shrink-0">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2f6bff] to-[#7c5cff] flex items-center justify-center text-[11px] font-bold num text-white">{st.stage}</span>
              {st.stage < chain.length && <span className="w-px flex-1 min-h-[14px] bg-[#2c4370]" />}
            </div>
            <div className="flex-1 rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5 mb-1">
              <div className="text-[11px] font-bold text-[#7dd3fc]">{st.label}</div>
              <div className="text-[11.5px] text-[#aab6cd] leading-relaxed mt-0.5">{st.content}</div>
            </div>
          </div>
        ))}
      </div>
      <details className="mt-3" open={false}>
        <summary className="cursor-pointer text-[12px] font-bold text-[#7dd3fc] flex items-center gap-1.5">
          <GitCommitHorizontal size={13} /> 展开技术路线主线（{mainline.length} 节点深层链路）
        </summary>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {mainline.map((n, i) => (
            <div key={n.node} className="flex items-center gap-1">
              <div className="rounded-lg bg-[#0e1626] border border-[#2c4370] px-2 py-1.5 text-center">
                <div className="text-[9.5px] font-bold text-white">{n.node}</div>
                <div className="text-[9px] text-[#8b98b3] max-w-[120px] truncate">{n.detail}</div>
              </div>
              {i < mainline.length - 1 && <GitCommitHorizontal size={10} className="text-[#4f8cff]" />}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export function SourceCompleteChain({ repo, intel }: { repo: LiveRepo; intel: SourceIntel }) {
  const chain = buildSourceCompleteChain(repo, intel);
  return (
    <div className="rounded-xl bg-[#0c1322] border border-[#2c4370] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-bold text-white">🔗 完整链路 · 用户问题 → 可复制性（源码驱动）</span>
        <span className="chip chip-accent ml-auto">{chain.length} 个环节</span>
      </div>
      <div className="space-y-1">
        {chain.map((st) => (
          <div key={st.key} className="flex items-start gap-2">
            <div className="flex flex-col items-center shrink-0">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2f6bff] to-[#7c5cff] flex items-center justify-center text-[11px] font-bold num text-white">{st.stage}</span>
              {st.stage < chain.length && <span className="w-px flex-1 min-h-[14px] bg-[#2c4370]" />}
            </div>
            <div className="flex-1 rounded-lg bg-[#101a2e] border border-[#16213a] p-2.5 mb-1">
              <div className="text-[11px] font-bold text-[#7dd3fc]">{st.label}</div>
              <div className="text-[11.5px] text-[#aab6cd] leading-relaxed mt-0.5">{st.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
