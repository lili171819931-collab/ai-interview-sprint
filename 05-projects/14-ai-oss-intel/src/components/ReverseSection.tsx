import Link from "next/link";
import { Microscope, Map as MapIcon, Route, FolderTree, FileCode2, Layers3, GitBranch, Hammer, Coins, Target, Factory, Swords, Gauge, Cpu, GraduationCap, Megaphone, FileText, ChevronDown } from "lucide-react";
import { buildReverseEngineering, buildIntelligenceReport } from "@/lib/reverse";
import { computeScores } from "@/lib/engines";
import { categoryOf } from "@/lib/categories";
import type { EvidenceLevel, Project } from "@/lib/types";

const EVIDENCE_COLOR: Record<EvidenceLevel, string> = {
  Confirmed: "#34d399",
  Inferred: "#7dd3fc",
  Hypothesis: "#fbbf24",
  Unknown: "#f87171",
};

export function ReverseSection({ project }: { project: Project }) {
  const r = buildReverseEngineering(project);
  const report = buildIntelligenceReport(project);
  const s = computeScores(project);

  return (
    <div className="space-y-5">
      {/* 40-section report */}
      <details className="panel p-5" open={false}>
        <summary className="cursor-pointer flex items-center gap-2 text-[14px] font-bold text-white">
          <FileText size={16} className="text-[#7dd3fc]" /> PROJECT INTELLIGENCE REPORT · 40 节完整报告
          <ChevronDown size={15} className="ml-auto text-[#5b6885]" />
        </summary>
        <div className="mt-4 space-y-2 max-h-[560px] overflow-y-auto pr-1">
          {report.map((sec) => (
            <div key={sec.n} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[11.5px] font-bold text-[#7dd3fc]">{String(sec.n).padStart(2, "0")} · {sec.title}</div>
              <div className="text-[12.5px] text-[#aab6cd] mt-0.5 leading-relaxed">{sec.body}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Value scores */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3"><Gauge size={16} className="text-[#34d399]" /><span className="text-[14px] font-bold text-white">项目价值评分 · 10 维</span></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {r.valueScores.map((v) => (
            <div key={v.label} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3 text-center">
              <div className="text-[10.5px] text-[#8b98b3]">{v.label}</div>
              <div className="text-lg font-bold num" style={{ color: v.color }}>{v.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* User journey */}
      <Block icon={MapIcon} color="#60a5fa" title="完整用户路径 · USER JOURNEY MAP">
        <div className="space-y-1.5">
          {r.userJourney.map((u, i) => (
            <div key={u.step} className="flex gap-3 rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <span className="w-7 h-7 rounded-lg bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-[11px] font-bold num text-[#7dd3fc] shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[13px] text-white">{u.step}</span>
                  <span className="chip !text-[10px]">{u.module}</span>
                  <span className={`chip !text-[10px] ${u.aiRole === "None" ? "" : "chip-accent"}`}>{u.aiRole !== "None" ? `🤖 ${u.aiRole}` : "—"}</span>
                </div>
                <div className="text-[12px] text-[#aab6cd] mt-0.5">{u.what} · 为什么：{u.why}</div>
                <div className="text-[11px] text-[#5b6885]">输入：{u.input} → 输出：{u.output}</div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* Product DNA flow */}
      <Block icon={GitBranch} color="#7dd3fc" title="核心产品逻辑 · PRODUCT DNA FLOW">
        <div className="flex flex-wrap items-center gap-1.5">
          {r.productDnaFlow.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="rounded-lg bg-[#0c1322] border border-[#2c4370] px-2.5 py-1.5 text-[11.5px] text-[#cfe0ff]">{step}</span>
              {i < r.productDnaFlow.length - 1 && <span className="text-[#4f8cff] text-[11px]">→</span>}
            </div>
          ))}
        </div>
      </Block>

      {/* Implementation path */}
      <Block icon={Route} color="#34d399" title="核心功能实现路径 · IMPLEMENTATION PATH">
        <div className="space-y-1.5">
          {r.implementationPath.map((x, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <span className="w-7 h-7 rounded-lg bg-[#1a2a4a] border border-[#2c4370] flex items-center justify-center text-[11px] font-bold num text-[#34d399] shrink-0">{i + 1}</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-white">{x.step}</span>
                  <span className="chip !text-[10px]">{x.layer}</span>
                  <span className="chip !text-[10px]" style={{ color: EVIDENCE_COLOR[x.evidence], borderColor: EVIDENCE_COLOR[x.evidence] + "55" }}>{x.evidence}</span>
                </div>
                <div className="text-[12px] text-[#aab6cd] mt-0.5">{x.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11.5px] text-[#5b6885]">Evidence Mode：Confirmed=可从源码/文档确认 · Inferred=合理推断 · Hypothesis=假设 · 源码无法确认时标注「无法从公开源码确认」。</div>
      </Block>

      {/* Source architecture + feature→code */}
      <div className="grid gap-4 md:grid-cols-2">
        <Block icon={FolderTree} color="#a78bfa" title="源码架构逆向 · SYSTEM ARCHITECTURE">
          <div className="space-y-1">
            {r.sourceArchitecture.tree.map((t, i) => <div key={i} className="text-[12px] text-[#aab6cd] font-mono">{t}</div>)}
          </div>
          <div className="mt-3 space-y-1.5">
            {r.sourceArchitecture.coreModules.map((m) => (
              <div key={m.module} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5 text-[12px]">
                <b className="text-[#cfe0ff]">{m.module}</b> <span className="chip !text-[9.5px]" style={{ color: EVIDENCE_COLOR[m.evidence], borderColor: EVIDENCE_COLOR[m.evidence] + "55" }}>{m.evidence}</span>
                <div className="text-[#8b98b3]">{m.role}</div>
              </div>
            ))}
          </div>
        </Block>
        <Block icon={FileCode2} color="#f472b6" title="代码 → 产品功能映射（杀手级）">
          {r.featureToCode.map((f) => (
            <div key={f.feature} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="text-[12.5px] font-semibold text-white">{f.feature}</div>
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                {f.chain.map((c, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="chip !text-[10px] chip-accent">{c}</span>
                    {i < f.chain.length - 1 && <span className="text-[#4f8cff] text-[10px]">→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-2 text-[11.5px] text-[#5b6885]">让非技术产品经理「看懂代码背后的产品」。</div>
        </Block>
      </div>

      {/* Product → tech mapping + tech choices */}
      <Block icon={Layers3} color="#7dd3fc" title="产品设计 → 技术设计 映射">
        <div className="space-y-1.5">
          {Object.entries(r.productToTech).map(([k, v]) => (
            <div key={k} className="flex gap-2 rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5 text-[12.5px]">
              <span className="w-28 shrink-0 text-[#7dd3fc] font-semibold capitalize">{k}</span>
              <span className="text-[#aab6cd]">{v}</span>
            </div>
          ))}
        </div>
      </Block>
      <Block icon={Cpu} color="#34d399" title="技术选型解释 · 为什么选它">
        <div className="space-y-1.5">
          {r.techStackExplained.map((t) => (
            <div key={t.tech} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
              <div className="flex flex-wrap items-center gap-2"><b className="text-[13px] text-white">{t.tech}</b><span className="text-[11.5px] text-[#8b98b3]">替代：{t.alternative}</span></div>
              <div className="text-[12px] text-[#aab6cd] mt-0.5">为什么：{t.why} · 影响：{t.impact}</div>
            </div>
          ))}
        </div>
      </Block>

      {/* If were PM + MVP reverse + decisions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Block icon={Hammer} color="#fbbf24" title="如果让我重新做 · IF I WERE THE PM">
          <div className="space-y-2">
            {[
              ["我会保留", r.ifWerePm.keep, "#34d399"],
              ["我会删除", r.ifWerePm.remove, "#f87171"],
              ["我会增加", r.ifWerePm.add, "#7dd3fc"],
              ["我会重新设计", r.ifWerePm.redesign, "#a78bfa"],
              ["我会优先做", r.ifWerePm.priority, "#fbbf24"],
              ["我不会做", r.ifWerePm.notDo, "#8b98b3"],
            ].map(([label, list, color]) => (
              <div key={label as string} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3">
                <div className="text-[12px] font-semibold" style={{ color: color as string }}>{label as string}</div>
                <div className="text-[12.5px] text-[#aab6cd] mt-0.5">{(list as string[]).join("；")}</div>
              </div>
            ))}
          </div>
        </Block>
        <div className="space-y-4">
          <Block icon={Factory} color="#2dd4bf" title="MVP 逆向 · 产品演进路径">
            <div className="space-y-1.5">
              {[
                ["MVP（3-5 功能）", r.mvpReverse.mvp, "#34d399"],
                ["V1", r.mvpReverse.v1, "#7dd3fc"],
                ["V2", r.mvpReverse.v2, "#fbbf24"],
                ["Scale", r.mvpReverse.scale, "#f472b6"],
              ].map(([label, list, color]) => (
                <div key={label as string} className="flex gap-2 rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5">
                  <span className="w-28 shrink-0 text-[12px] font-semibold" style={{ color: color as string }}>{label as string}</span>
                  <span className="text-[12px] text-[#aab6cd]">{(list as string[]).join(" + ")}</span>
                </div>
              ))}
            </div>
          </Block>
          <Block icon={GitBranch} color="#60a5fa" title="产品决策分析">
            <div className="space-y-1.5">
              {r.productDecisions.map((d) => (
                <div key={d.decision} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5 text-[12px]">
                  <b className="text-white">{d.decision}</b> · 理由：{d.reason}
                  <div className="text-[#5b6885]">取舍：{d.tradeoff} · 替代：{d.alternative}</div>
                </div>
              ))}
            </div>
          </Block>
        </div>
      </div>

      {/* Business + opportunities + industries + competition */}
      <Block icon={Coins} color="#f87171" title="商业模式 · 真正的赚钱点">
        <div className="rounded-xl bg-[#0c1322] border border-[#16213a] p-3.5">
          <div className="flex flex-wrap gap-1.5 mb-2">{r.businessModelDetail.streams.map((x) => <span key={x} className="chip chip-accent">{x}</span>)}</div>
          <div className="text-[12.5px] text-[#aab6cd]">{r.businessModelDetail.moneyPoint}</div>
        </div>
        <div className="grid gap-1.5 mt-3 md:grid-cols-2">
          {r.businessOpportunities.map((o) => (
            <div key={o.type} className="flex gap-2 rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5 text-[12px]">
              <span className="chip !text-[10px] shrink-0">{o.type}</span><span className="text-[#aab6cd]">{o.opportunity}</span>
            </div>
          ))}
        </div>
      </Block>

      <div className="grid gap-4 md:grid-cols-2">
        <Block icon={Factory} color="#fb923c" title="行业应用（10 行业）">
          <div className="space-y-1.5">
            {r.industries.map((i) => (
              <div key={i.industry} className="flex gap-2 rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5 text-[12px]">
                <span className="w-24 shrink-0 font-semibold text-white">{i.industry}</span>
                <span className="flex-1 text-[#aab6cd]">{i.scenario} · {i.value}</span>
                <span className="text-[10.5px] text-[#5b6885] num">{i.difficulty} · {i.potential}</span>
              </div>
            ))}
          </div>
        </Block>
        <Block icon={Swords} color="#f472b6" title="竞争分析">
          <div className="space-y-1.5">
            {r.competitors.map((c) => (
              <div key={c.type} className="flex gap-2 rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5 text-[12px]">
                <span className="chip !text-[10px] shrink-0">{c.type}</span>
                <span className="text-[#cfe0ff]">{c.name}</span>
                <span className="text-[#8b98b3]">{c.note}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 text-[12px] text-[#aab6cd]">{r.comparison.map((c, i) => <div key={i}>· {c}</div>)}</div>
        </Block>
      </div>

      {/* AI Architecture + learning/media value */}
      <Block icon={Cpu} color="#7dd3fc" title="AI Architecture · 15 组件职责">
        <div className="grid gap-1.5 md:grid-cols-3">
          {r.aiArchitecture.map((a) => (
            <div key={a.component} className="rounded-xl bg-[#0c1322] border border-[#16213a] p-2.5">
              <b className="text-[12px] text-[#7dd3fc]">{a.component}</b>
              <div className="text-[11.5px] text-[#8b98b3]">{a.role}</div>
            </div>
          ))}
        </div>
      </Block>

      <div className="grid gap-4 md:grid-cols-2">
        <Block icon={GraduationCap} color="#c084fc" title="AI PM 学习价值">
          <div className="space-y-1.5">{r.learningValue.map((v, i) => <div key={i} className="text-[12.5px] text-[#aab6cd]">· {v}</div>)}</div>
        </Block>
        <Block icon={Megaphone} color="#f472b6" title="自媒体价值">
          <div className="space-y-1.5 text-[12.5px] text-[#aab6cd]">
            <div><b className="text-[#f472b6]">值得做内容：</b>{r.mediaValue.worth ? "✅ 是" : "⚠️ 一般"}</div>
            <div><b className="text-[#f472b6]">Hook：</b>{r.mediaValue.hook}</div>
            <div><b className="text-[#f472b6]">角度：</b>{r.mediaValue.angle}</div>
            <div><b className="text-[#f472b6]">争议点：</b>{r.mediaValue.controversy}</div>
            <div><b className="text-[#f472b6]">PM Insight：</b>{r.mediaValue.pmInsight}</div>
            <div><b className="text-[#f472b6]">标题：</b>{r.mediaValue.title}</div>
            <div><b className="text-[#f472b6]">脚本：</b>{r.mediaValue.script}</div>
            <div><b className="text-[#f472b6]">封面：</b>{r.mediaValue.thumbnail}</div>
          </div>
        </Block>
      </div>
    </div>
  );
}

function Block({ icon: Icon, color, title, children }: { icon: any; color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-3"><Icon size={16} style={{ color }} /><span className="text-[14px] font-bold text-white">{title}</span></div>
      {children}
    </div>
  );
}
