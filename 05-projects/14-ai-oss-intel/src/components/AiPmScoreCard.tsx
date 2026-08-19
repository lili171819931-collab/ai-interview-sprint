"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge } from "lucide-react";
import { averageAbility, abilityGapRecommendation } from "@/lib/learning";
import { computeAbilities, subscribe } from "@/lib/learningStore";

export function AiPmScoreCard() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  const abilities = computeAbilities();
  const avg = averageAbility(abilities);
  const started = Object.values(abilities).some((v) => v > 0);
  const gap = abilityGapRecommendation(abilities);

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-3"><Gauge size={15} className="text-[#7dd3fc]" /><span className="text-[14px] font-bold text-white">MY AI PM SCORE</span></div>
      {!started ? (
        <div className="text-[12.5px] text-[#5b6885]">
          还没有学习记录。去任意项目页进入「AI PM 学习模式」，完成 Challenge 后这里会显示你的能力分。
          <div className="mt-2"><Link href="/learn" className="chip chip-accent">去学习中心 →</Link></div>
        </div>
      ) : (
        <>
          <div className="text-center py-1">
            <span className="text-4xl font-extrabold num glow-text">{avg}</span>
            <span className="text-sm text-[#5b6885]">/100</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              ["产品思维", abilities.productThinking],
              ["需求分析", abilities.requirementAnalysis],
              ["AI 理解", abilities.aiUnderstanding],
              ["Agent 理解", abilities.agentUnderstanding],
              ["商业", abilities.businessModel],
              ["表达", abilities.communication],
            ].map(([label, v]) => (
              <div key={label as string} className="flex items-center gap-2">
                <span className="text-[11px] text-[#8b98b3] w-16">{label as string}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[#141e33] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#4f8cff] to-[#7c5cff]" style={{ width: `${v}%` }} />
                </div>
                <span className="text-[11px] num text-[#aab6cd] w-7 text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#16213a] text-[12px] text-[#5b6885]">
            短板：<b className="text-[#f87171]">{gap.weakness}</b> · <Link href={`/rankings/category/${gap.recommended[0]?.category ?? "agent"}`} className="text-[#7dd3fc] hover:underline">去分类 TOP 榜补齐</Link>
          </div>
        </>
      )}
    </div>
  );
}
