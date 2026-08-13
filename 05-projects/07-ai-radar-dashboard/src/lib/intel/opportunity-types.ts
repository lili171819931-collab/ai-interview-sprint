import type { PulseOpportunity, PulseTrackItem } from "@/lib/pulse-types";

export type OpportunityLensItem = {
  title: string;
  meta: string;
  href: string | null;
  note?: string;
};

export type OpportunityLens = {
  id: string;
  title: string;
  blurb: string;
  items: OpportunityLensItem[];
};

export type OpportunityEvidence = {
  label: string;
  discussion: string;
  meaning: string;
};

/** 对齐 BuilderPulse 中文日报结构的机会分析报告（日更可归档） */
export type OpportunityDailyReport = {
  schemaVersion: 1;
  generatedAt: string;
  reportDate: string;
  timezone: "Asia/Shanghai";
  method: "builderpulse-aligned";
  attribution: string;
  sourceUrl: string;
  editorNote: string;
  plainBrief: string;
  headline: string;
  summary: string;
  buildIdea: {
    title: string;
    whyNow: string;
    timeboxTitle: string;
    timeboxDetail: string;
  };
  topSignals: string[];
  evidence: OpportunityEvidence[];
  lenses: OpportunityLens[];
  opportunities: PulseOpportunity[];
  trackRecord: PulseTrackItem[];
  methodNote: string;
  stats: {
    aiHot: number;
    cnHot: number;
    intlHot: number;
    opportunities: number;
  };
};

export type OpportunityArchiveIndexItem = {
  date: string;
  headline: string;
  whyNow: string;
  href: string;
};
