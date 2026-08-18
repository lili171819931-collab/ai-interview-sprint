import Link from "next/link";
import { FileText, Boxes, UserRoundCheck, GitCommitHorizontal, ExternalLink } from "lucide-react";
import {
  buildMasterReport, buildFactSheet, buildKillerFeature, buildBeforeAfter, buildAiValueMap,
  buildFeatureDependency, buildTechChallenges, buildProductChallenges, buildProduct2,
  buildCloningPlan, buildThreeConclusions, buildPanorama, buildDirectorView,
} from "@/lib/master";
import { formatPct, formatSigned, formatStars } from "@/lib/engines";
import { timeStatusOf, TIME_STATUS_META } from "@/lib/scenarios";
import { liveStatus } from "@/lib/live";
import type { Project } from "@/lib/types";
import type { LiveRepo } from "@/lib/live";

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
      <details className="rounded-xl bg-[#0c1322] border border-[#16213a]" open={false}>
        <summary className="cursor-pointer px-4 py-3 text-[12.5px] font-bold text-white flex items-center gap-2">
          <FileText size={13} className="text-[#7dd3fc]" /> PROJECT REVERSE ENGINEERING REPORT · 40 节完整报告
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

/* ── Live（实时项目）轻量版 ──────────────────────────────────── */
export function LiveAnalysis({ repo }: { repo: LiveRepo }) {
  const status = liveStatus(repo);
  const meta = TIME_STATUS_META[status];
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="text-[12.5px] font-bold text-white mb-2">PROJECT FACT SHEET · GitHub 实时</div>
        <div className="grid gap-1.5 md:grid-cols-2 text-[11.5px]">
          {[
            ["仓库", repo.fullName], ["定位", repo.description ?? "—"], ["语言", repo.language ?? "—"],
            ["License", repo.license ?? "—"], ["Stars/Forks", `${formatStars(repo.stars)} / ${formatStars(repo.forks)}`],
            ["发布时间", repo.createdAt], ["更新时间", repo.updatedAt], ["2026 状态", meta.label],
            ["主题", repo.topics.slice(0, 6).join(" · ") || "—"],
          ].map(([k, v]) => (
            <div key={k as string} className="flex gap-2">
              <span className="w-20 shrink-0 text-[#5b6885]">{k}</span><span className="text-[#cfe0ff] break-all">{v}</span>
            </div>
          ))}
        </div>
        <a href={`https://github.com/${repo.fullName}`} target="_blank" className="chip chip-accent mt-2"><ExternalLink size={11} /> 打开 GitHub（可获取源码后深度分析）</a>
      </div>
      <div className="text-[11.5px] text-[#5b6885] leading-relaxed">
        💡 实时项目暂未抓取源码，无法生成完整的 40 节逆向工程报告与产品全景图。将其加入收藏/快照后即可获得全量分析；当前可先通过 GitHub 查看 README 与源码。
      </div>
    </div>
  );
}

export function LiveFeatureDiagram({ repo }: { repo: LiveRepo }) {
  return (
    <div>
      <div className="text-[12px] font-bold text-[#7dd3fc] mb-3">功能实现路径框图 · 实时项目（元数据）</div>
      <div className="grid gap-1.5 md:grid-cols-3">
        {[
          ["User Input", "用户需求/问题", repo.description ?? "—"],
          ["Frontend / Entry", "产品入口", repo.language ? `${repo.language} 实现` : "—"],
          ["Core Logic", "核心流程", "以 README/源码为准（未抓取）"],
          ["AI / Model", "AI 能力", "以仓库主题/描述推断（[HYPOTHESIS]）"],
          ["Tools / Data", "工具与数据", repo.topics.slice(0, 4).join(" · ") || "—"],
          ["Output", "输出与发布", `发布于 ${repo.createdAt} · 最近更新 ${repo.updatedAt}`],
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

export function LiveDirectorView({ repo }: { repo: LiveRepo }) {
  const status = liveStatus(repo);
  const meta = TIME_STATUS_META[status];
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-4">
        <div className="text-[12.5px] font-bold text-white mb-2">产品总监视角 · 实时项目</div>
        <div className="space-y-1.5 text-[11.5px] text-[#aab6cd]">
          <div><b className="text-[#a78bfa]">边界考虑：</b>当前边界以「{repo.description ?? repo.fullName}」为核心；建议先做窄而深，再资产化。</div>
          <div><b className="text-[#f87171]">痛点分析：</b>实时项目需结合 README/Issues 分析；当前信号：⭐ {formatStars(repo.stars)} · Issues {repo.openIssues.toLocaleString()} · {repo.language ?? "—"}。</div>
          <div><b className="text-[#34d399]">真实案例预测：</b>进入 GitHub 查看 Star 用户/Issues 讨论可获得真实案例证据；当前状态 {meta.label}（{TIME_STATUS_META[status].desc}）。</div>
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
