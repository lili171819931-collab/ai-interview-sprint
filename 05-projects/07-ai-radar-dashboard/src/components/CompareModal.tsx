"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { ToolRecord } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { averageScore, recommendByScenario } from "@/lib/compare";
import { RadarChart, dimensionWinners } from "@/components/viz/charts/RadarChart";
import { GroupedBarChart } from "@/components/viz/charts/BarChart";
import { COMPARE_KEYS } from "@/lib/compare";
import { SCORE_LABELS } from "@/lib/types";
import { AlertTriangle, CheckCircle2, X, Sparkles, Trophy } from "lucide-react";

const SERIES_COLORS = [
  "var(--viz-bar-a)",
  "var(--viz-bar-b)",
  "var(--viz-bar-c)",
  "var(--viz-bar-d)",
];

type CompareModalProps = {
  open: boolean;
  tools: ToolRecord[];
  onClose: () => void;
  lastUpdatedDate: string;
};

export function CompareModal({ open, tools, onClose, lastUpdatedDate }: CompareModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || tools.length < 2) return null;

  const sameCategory = tools.every((t) => t.category === tools[0].category);
  const tips = recommendByScenario(tools);
  const winners = dimensionWinners(tools);
  const ranked = [...tools].sort((a, b) => averageScore(b) - averageScore(a));
  const bestOverall = ranked[0];
  const bestCost = [...tools].sort((a, b) => b.scores.cost - a.scores.cost)[0];
  const bestEnterprise = [...tools].sort((a, b) => b.scores.compliance - a.scores.compliance)[0];
  const bestEase = [...tools].sort((a, b) => b.scores.ease - a.scores.ease)[0];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="智能对比结果"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel rise">
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--line)] sticky top-0 bg-[var(--ink-2)] z-10">
          <div>
            <div className="flex items-center gap-2 text-[var(--signal)] text-sm mb-1">
              <Sparkles size={16} aria-hidden />
              智能对比图
            </div>
            <h2 className="display text-xl font-semibold">
              {tools.map((t) => t.name).join(" · ")}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              {sameCategory
                ? `同品类：${CATEGORY_LABELS[tools[0].category]}`
                : "跨品类对比（仅供参考）"}
              {" · "}数据截至 {lastUpdatedDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-5 space-y-8 overflow-y-auto max-h-[calc(92vh-72px)]">
          <section className="grid sm:grid-cols-4 gap-3">
            {[
              { label: "综合最强", value: bestOverall.name, tone: "signal" },
              { label: "成本最优", value: bestCost.name, tone: "amber" },
              { label: "企业更稳", value: bestEnterprise.name, tone: "signal" },
              { label: "上手最快", value: bestEase.name, tone: "accent" },
            ].map((item) => (
              <div key={item.label} className="metric-card px-3 py-3">
                <p
                  className={
                    item.tone === "amber"
                      ? "text-xs text-[var(--amber)]"
                      : item.tone === "accent"
                        ? "text-xs text-[#d7ccff]"
                        : "text-xs text-[var(--signal)]"
                  }
                >
                  {item.label}
                </p>
                <p className="display text-xl font-semibold mt-1">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="insight-card p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 text-[var(--signal)] shrink-0" aria-hidden />
              <div>
                <p className="display text-lg font-semibold">智能摘要</p>
                <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
                  如果优先追求整体能力，当前更偏向{" "}
                  <span className="text-[var(--signal)] font-medium">{bestOverall.name}</span>；
                  如果预算敏感，优先看{" "}
                  <span className="text-[var(--amber)] font-medium">{bestCost.name}</span>；
                  企业采购需要额外核对数据边界、地区可用性与合同条款。
                </p>
              </div>
            </div>
          </section>

          <section className="grid lg:grid-cols-[1fr_1fr] gap-6 items-center">
            <RadarChart tools={tools} />
            <div className="space-y-3">
              <h3 className="display text-base font-semibold flex items-center gap-2">
                <Trophy size={16} className="text-[var(--amber)]" aria-hidden />
                综合均分速览
              </h3>
              {ranked.map((t, i) => {
                const avg = averageScore(t);
                const pct = (avg / 5) * 100;
                return (
                  <div key={t.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        <span className="text-[var(--muted)] mr-2">#{i + 1}</span>
                        {t.name}
                      </span>
                      <span className="text-[var(--signal)] font-semibold">{avg.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-[rgba(232,238,245,0.08)] overflow-hidden">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${pct}%`,
                          background: SERIES_COLORS[tools.findIndex((x) => x.id === t.id) % SERIES_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-[var(--muted)] pt-1">
                均分仅作相对参考，场景选型见下方智能建议。
              </p>
            </div>
          </section>

          <section>
            <h3 className="display text-base font-semibold mb-3">维度胜出（智能标注）</h3>
            <div className="flex flex-wrap gap-2">
              {winners.map((w) => (
                <span
                  key={w.key}
                  className="inline-flex items-center gap-1.5 border border-[var(--line)] px-2.5 py-1.5 text-xs"
                >
                  <span className="text-[var(--muted)]">{w.label}</span>
                  <span className="text-[var(--signal)] font-medium">
                    {w.winners.join(" / ")}
                  </span>
                  <span className="text-[var(--muted)]">{w.score}/5</span>
                </span>
              ))}
            </div>
          </section>

          <GroupedBarChart
            title="七维柱状对照"
            categories={COMPARE_KEYS.map((k) => SCORE_LABELS[k].slice(0, 2))}
            series={tools.map((t, i) => ({
              name: t.name,
              color: SERIES_COLORS[i % SERIES_COLORS.length],
              values: COMPARE_KEYS.map((k) => t.scores[k]),
            }))}
            insight="雷达看形态，柱状看分差；两者交叉验证更稳妥。"
          />

          <section className="paper-block p-4 space-y-3">
            <h3 className="display text-base font-semibold">智能选型建议</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { title: "个人创作", body: tips.consumer },
                { title: "工程师", body: tips.developer },
                { title: "企业采购", body: tips.enterprise },
              ].map((card) => (
                <div key={card.title} className="border border-[var(--report-line)] bg-white/60 px-3 py-3">
                  <p className="text-xs font-semibold text-[var(--report-ink)] mb-1">{card.title}</p>
                  <p className="text-xs leading-relaxed text-[var(--report-muted)]">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          {!sameCategory ? (
            <section className="warning-card p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-[var(--amber)] shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium text-[var(--amber)]">跨品类风险提示</p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  当前包含不同品类工具，分数只适合做方向判断。正式选型建议回到同品类或同场景候选集。
                </p>
              </div>
            </section>
          ) : null}

          <section className="grid md:grid-cols-2 gap-4">
            {tools.map((t, i) => (
              <div key={t.id} className="surface p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
                  />
                  <Link href={`/tools/${t.id}`} className="font-semibold hover:text-[var(--signal)]">
                    {t.name}
                  </Link>
                </div>
                <p className="text-xs text-[var(--signal)]">优势</p>
                <ul className="text-xs text-[var(--muted)] space-y-1">
                  {t.pros.slice(0, 3).map((p) => (
                    <li key={p}>· {p}</li>
                  ))}
                </ul>
                <p className="text-xs text-[var(--amber)] pt-1">劣势</p>
                <ul className="text-xs text-[var(--muted)] space-y-1">
                  {t.cons.slice(0, 3).map((c) => (
                    <li key={c}>· {c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
