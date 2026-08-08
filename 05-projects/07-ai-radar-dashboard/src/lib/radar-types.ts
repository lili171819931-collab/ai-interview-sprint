import type { MonitorPool } from "@/data/research-sources";

export type RadarSignalCategory =
  | "model"
  | "tool"
  | "paper"
  | "news"
  | "official"
  | "funding"
  | "ranking";

export type FactKind = "confirmed" | "inferred" | "rumor" | "official";

export type Confidence = "high" | "medium" | "low";

export type Heat = 1 | 2 | 3 | 4 | 5;

/** 看板字段：名称、类别、热度、排名、可信度、更新时间、来源链接、PM 机会点 */
export type RadarSignal = {
  id: string;
  name: string;
  category: RadarSignalCategory;
  pool: MonitorPool;
  heat: Heat;
  rank?: string;
  confidence: Confidence;
  updatedAt: string;
  sourceUrl: string;
  sourceName: string;
  pmOpportunity: string;
  summary: string;
  entities?: string[];
  factKind: FactKind;
  riskNote?: string;
};

export type RadarAction = {
  title: string;
  detail: string;
  priority: "P0" | "P1" | "P2";
};

export type RadarDailyReport = {
  generatedAt: string;
  timezone: "Asia/Shanghai";
  reportDate: string;
  kind: "daily" | "weekly";
  executiveSummary: string[];
  signals: RadarSignal[];
  rankingNotes: string[];
  riskAlerts: string[];
  opportunities: string[];
  actions: RadarAction[];
  monitorPools: {
    pool: MonitorPool;
    label: string;
    sourceCount: number;
  }[];
  methodNote: string;
};
