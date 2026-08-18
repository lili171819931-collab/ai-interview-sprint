"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import { buildReverseEngineering } from "@/lib/reverse";
import { Sparkline } from "@/components/ui";
import { GithubIcon } from "@/components/icons";
import type { Project } from "@/lib/types";

const EVIDENCE_COLOR: Record<string, string> = {
  Confirmed: "#34d399",
  Inferred: "#7dd3fc",
  Hypothesis: "#fbbf24",
  Unknown: "#f87171",
};

export function ExpandableRankRow({ project, rank, delta, metaColor, keyMetric, showExtra }: {
  project: Project;
  rank: number;
  delta: number;
  metaColor: string;
  keyMetric: string;
  showExtra: boolean;
}) {
  const [open, setOpen] = useState(false);
  const r = buildReverseEngineering(project);
  const r7 = growthRate(project, 7);
  const r30 = growthRate(project, 30);
  const r90 = growthRate(project, 90);

  return (
    <>
      <tr className="border-b border-[#101a2e] hover:bg-[#0e1626]">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold num" style={{ color: rank <= 3 ? metaColor : "#8b98b3" }}>{String(rank).padStart(2, "0")}</span>
            {delta > 0 ? <span className="text-emerald-400 text-[11px]">▲{delta}</span> : delta < 0 ? <span className="text-rose-400 text-[11px]">▼{Math.abs(delta)}</span> : <span className="text-[#33415e] text-[11px]">—</span>}
          </div>
        </td>
        <td className="px-2 py-3">
          <button onClick={() => setOpen((v) => !v)} className="block max-w-[280px] text-left group">
            <div className="font-semibold text-white truncate group-hover:text-[#7dd3fc]">{project.name}</div>
            <div className="text-[11.5px] text-[#5b6885] truncate">{project.tagline}</div>
          </button>
        </td>
        <td className="px-2 py-3 text-right num text-[#cfe0ff]">{formatStars(project.stars)}</td>
        <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(project.growth7d)}<div className="text-[10px] text-[#5b6885]">{formatPct(r7)}</div></td>
        <td className="px-2 py-3 text-right num text-emerald-300">{formatSigned(project.growth30d)}<div className="text-[10px] text-[#5b6885]">{formatPct(r30)}</div></td>
        <td className="px-2 py-3 text-right num text-emerald-300/80">{formatSigned(project.growth90d)}<div className="text-[10px] text-[#5b6885]">{formatPct(r90)}</div></td>
        <td className="px-2 py-3 text-right num">
          <span className="font-bold text-[15px]" style={{ color: metaColor }}>{keyMetric}</span>
        </td>
        <td className="px-2 py-3"><div className="flex justify-end"><Sparkline points={project.growthHistory} width={84} height={28} /></div></td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <Link href={`/projects/${project.slug}`} className="chip chip-accent !text-[11px]">分析</Link>
            <a href={`https://github.com/${project.fullName}`} target="_blank" className="chip !text-[11px]"><GithubIcon size={11} /> GitHub</a>
            <button onClick={() => setOpen((v) => !v)} className="chip !text-[11px] hover:!text-[#7dd3fc]">
              {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />} {open ? "收起" : "逆向拆解"}
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#0a101d] border-b border-[#101a2e]">
          <td colSpan={9} className="px-6 py-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniBlock title="产品功能实现路径" color="#34d399" icon="⚙️">
                <div className="space-y-1">
                  {r.implementationPath.slice(0, 10).map((x, i) => (
                    <div key={i} className="flex gap-1.5 text-[11.5px] leading-snug">
                      <span className="text-[#5b6885] num">{i + 1}.</span>
                      <span className="text-[#cfe0ff]">{x.step}</span>
                      <span className="chip !text-[9px]" style={{ color: EVIDENCE_COLOR[x.evidence], borderColor: EVIDENCE_COLOR[x.evidence] + "55" }}>{x.evidence}</span>
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
                  <div className="pt-1 text-[10.5px] text-[#5b6885]">技术选型：{r.techStackExplained.slice(0, 4).map((t) => t.tech).join(" / ")}</div>
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
              </MiniBlock>
            </div>
            {showExtra && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-[#5b6885]">
                <span className="chip">⚡ {r.learningValue[0]}</span>
                <span className="chip">💰 {r.businessModelDetail.moneyPoint.split("；")[0]}</span>
                <Link href={`/projects/${project.slug}#reverse`} className="chip chip-accent">完整逆向报告 →</Link>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
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
