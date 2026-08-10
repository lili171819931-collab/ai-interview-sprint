/** BuilderPulse 风格：每日机会简报（非商业转载需遵守其 CC BY-NC） */

export type PulseOpportunityCategory =
  | "launches"
  | "search_trends"
  | "oss_gap"
  | "complaints"
  | "tech_choice"
  | "competition"
  | "trends"
  | "action";

export type PulseOpportunity = {
  id: string;
  category: PulseOpportunityCategory;
  title: string;
  signal: string;
  plainSpeak: string;
  judgment?: string;
  counterpoint?: string;
};

export type PulseBuildIdea = {
  title: string;
  whyNow: string;
  timeboxTitle: string;
  timeboxDetail: string;
};

export type PulseTrackItem = {
  date: string;
  summary: string;
  reportPath?: string;
};

export type BuilderPulseBrief = {
  generatedAt: string;
  reportDate: string;
  timezone: "Asia/Shanghai";
  source: "builderpulse-local" | "builderpulse-remote" | "seed";
  sourceUrl: string;
  attribution: string;
  editorNote: string;
  plainBrief: string;
  buildIdea: PulseBuildIdea;
  topSignals: string[];
  opportunities: PulseOpportunity[];
  trackRecord: PulseTrackItem[];
  methodNote: string;
};
