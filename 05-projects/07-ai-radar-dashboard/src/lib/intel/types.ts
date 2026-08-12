/** Global Trend Intelligence — unified Item / Event types (Phase 2–5) */

export type IntelEntity = {
  name: string;
  type: "org" | "person" | "product" | "place" | "other";
};

export type IntelEngagement = {
  rank?: number | null;
  hot?: number | string | null;
  comments?: number | null;
  likes?: number | null;
};

export type IntelItem = {
  id: string;
  source: string;
  platform: string;
  title: string;
  url: string;
  author: string;
  published_at: string;
  fetched_at: string;
  category: string;
  keywords: string[];
  summary: string;
  raw_content: string;
  engagement: IntelEngagement;
  rank: number | null;
  source_reliability: number;
  language: string;
  country: string;
  entities: IntelEntity[];
  embedding: number[] | null;
};

export type TrendStatus = "emerging" | "rising" | "hot" | "stable" | "cooling" | "fading";

export type EventScoreBreakdown = {
  heat: number;
  velocity: number;
  crossPlatform: number;
  sourceAuthority: number;
  recency: number;
  userRelevance: number;
};

export type EventAnalysis = {
  one_liner: string;
  what: string;
  why: string;
  who: string[];
  impact: string;
  trend: string;
  confidence: number;
  analysisMode: "heuristic" | "llm";
  sources: { title: string; url: string; platform: string }[];
};

export type IntelEvent = {
  id: string;
  representative_title: string;
  related_items: string[];
  platforms: string[];
  countries: string[];
  categories: string[];
  first_seen: string;
  last_seen: string;
  source_count: number;
  platform_count: number;
  heat_score: number;
  velocity: number;
  trend_status: TrendStatus;
  score_breakdown: EventScoreBreakdown;
  user_relevance: number;
  sample_items: {
    id: string;
    title: string;
    url: string;
    platform: string;
    country: string;
  }[];
  analysis?: EventAnalysis;
};

export type EventsSnapshot = {
  generatedAt: string;
  reportDate: string;
  timezone: "Asia/Shanghai";
  methodNote: string;
  itemCount: number;
  eventCount: number;
  thresholds: {
    titleSimilarity: number;
  };
  events: IntelEvent[];
};

export type UserInterests = {
  updatedAt?: string;
  categories: string[];
  keywords: string[];
  notes?: string;
};

export type AdapterMetadata = {
  id: string;
  platform: string;
  country: string;
  reliability: number;
  kind: "rss" | "api" | "html" | "db" | "file";
  description: string;
};

export type FetchContext = {
  root: string;
  now: Date;
  offline?: boolean;
};

export type AdapterResult = {
  adapterId: string;
  ok: boolean;
  items: IntelItem[];
  error?: string;
  fetchedAt: string;
  rawCount?: number;
};

export type IngestSnapshot = {
  generatedAt: string;
  reportDate: string;
  timezone: "Asia/Shanghai";
  adapters: {
    id: string;
    ok: boolean;
    itemCount: number;
    error?: string;
  }[];
  totalItems: number;
  items: IntelItem[];
};

export type DailyBriefItem = {
  id: string;
  title: string;
  heat_score: number;
  velocity: number;
  trend_status: TrendStatus;
  platforms: string[];
  one_liner: string;
  sources: { title: string; url: string; platform: string }[];
};

export type DailyBrief = {
  kind: "daily" | "ai";
  generatedAt: string;
  reportDate: string;
  timezone: "Asia/Shanghai";
  headline: string;
  summary: string;
  statusCounts: Record<string, number>;
  top: DailyBriefItem[];
  rising: DailyBriefItem[];
  aiTop: DailyBriefItem[];
  dashboardPath: string;
  eventCount: number;
  itemCount: number;
};
