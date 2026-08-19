"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { MapNode } from "@/lib/master";

export function InteractiveMap({ title, nodes, accent = "#7dd3fc", defaultOpen = 0 }: {
  title?: string;
  nodes: MapNode[];
  accent?: string;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const current = open !== null ? nodes[open] : null;
  return (
    <div>
      {title && <div className="text-[12px] font-bold mb-2" style={{ color: accent }}>{title} <span className="text-[#5b6885] font-normal">· 点击节点查看详细分析</span></div>}
      <div className="flex flex-wrap items-center gap-1">
        {nodes.map((n, i) => (
          <div key={n.node + i} className="flex items-center gap-1">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className={`rounded-lg border px-2 py-1.5 text-center transition-colors ${open === i ? "bg-[#16233d] border-[#4f8cff]" : "bg-[#0c1322] border-[#2c4370] hover:border-[#4f8cff]"}`}
              title={`点击查看「${n.node}」详细分析`}
            >
              <div className="text-[10px] font-bold text-white">{n.node}</div>
              <div className="text-[9px] text-[#8b98b3] max-w-[120px] truncate">{n.detail}</div>
              {open === i && <ChevronUp size={10} className="mx-auto mt-0.5" style={{ color: accent }} />}
            </button>
            {i < nodes.length - 1 && <span className="text-[#4f8cff] text-[10px]">→</span>}
          </div>
        ))}
      </div>

      {current && (
        <div className="mt-3 rounded-xl bg-[#101a2e] border border-[#2c4370] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-bold text-white">🔍 {current.node} · 详细分析</span>
            <span className="chip !text-[10px]" style={{ color: accent, borderColor: accent + "55" }}>{current.evidence}</span>
            <button onClick={() => setOpen(null)} className="ml-auto text-[#5b6885] hover:text-white"><X size={14} /></button>
          </div>
          <div className="text-[12px] text-[#cfe0ff] mb-2">{current.detail}</div>
          <div className="space-y-1">
            {current.explain.map((x, i) => (
              <div key={i} className="text-[12px] text-[#aab6cd] leading-relaxed">· {x}</div>
            ))}
          </div>
          {current.questions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[#16213a]">
              <div className="text-[11px] font-bold text-[#fbbf24] mb-1.5">产品经理自问 · 答案补充</div>
              <div className="space-y-1.5">
                {current.questions.map((q, i) => (
                  <div key={q} className="rounded-lg bg-[#0c1322] border border-[#16213a] p-2">
                    <div className="text-[11.5px] font-semibold text-[#fbbf24]">Q：{q}</div>
                    <div className="text-[11.5px] text-[#cfe0ff] leading-relaxed mt-0.5">A：{current.answers?.[i] ?? "见详细分析"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
