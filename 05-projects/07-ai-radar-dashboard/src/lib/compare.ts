import type { ScoreKey, ToolRecord } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";

export const COMPARE_KEYS: ScoreKey[] = [
  "breadth",
  "quality",
  "cost",
  "speed",
  "ecosystem",
  "compliance",
  "ease",
];

export function averageScore(tool: ToolRecord): number {
  const vals = COMPARE_KEYS.map((k) => tool.scores[k]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function recommendByScenario(tools: ToolRecord[]) {
  if (tools.length === 0) {
    return {
      consumer: "请先选择至少 2 款同品类工具",
      developer: "请先选择至少 2 款同品类工具",
      enterprise: "请先选择至少 2 款同品类工具",
    };
  }

  const pick = (score: (t: ToolRecord) => number, reason: (t: ToolRecord) => string) => {
    const sorted = [...tools].sort((a, b) => score(b) - score(a));
    const top = sorted[0];
    return `${top.name} — ${reason(top)}`;
  };

  return {
    consumer: pick(
      (t) => t.scores.ease * 2 + t.scores.quality + (t.audience.includes("consumer") ? 2 : 0),
      (t) => `上手 ${t.scores.ease}/5，质量 ${t.scores.quality}/5；${t.oneLiner}`,
    ),
    developer: pick(
      (t) =>
        t.scores.ecosystem * 2 +
        t.scores.quality +
        (t.integration.includes("api") || t.integration.includes("ide") ? 2 : 0),
      (t) => `生态 ${t.scores.ecosystem}/5；集成：${t.integration.join("/")}`,
    ),
    enterprise: pick(
      (t) =>
        t.scores.compliance * 2 +
        t.scores.ecosystem +
        (t.audience.includes("enterprise") ? 2 : 0),
      (t) => `合规 ${t.scores.compliance}/5；${t.pricingSummary}`,
    ),
  };
}

export function dimensionRows(tools: ToolRecord[]) {
  return COMPARE_KEYS.map((key) => ({
    key,
    label: SCORE_LABELS[key],
    cells: tools.map((t) => ({
      toolId: t.id,
      score: t.scores[key],
      evidence: t.scoreEvidence[key] ?? "（未填证据，仅供相对参考）",
    })),
  }));
}
