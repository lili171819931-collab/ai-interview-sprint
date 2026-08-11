/** 国内外实时热点快照（对齐 Agent Reach + Scrapling 聚合脚本） */

export type GlobalHotRegion = "国内" | "海外";

export type GlobalHotItem = {
  platform: string;
  region: GlobalHotRegion;
  rank: number;
  title: string;
  heat: string | number | null;
  url: string;
  fetched_at: string;
  source_id?: string;
};

export type GlobalHotSourceStatus = {
  id: string;
  label: string;
  region: string;
  ok: boolean;
  mode: string;
  hits: number;
  error?: string;
};

export type GlobalHotPlatformGroup = {
  name: string;
  region: GlobalHotRegion;
  items: GlobalHotItem[];
};

export type GlobalHotTopicsSnapshot = {
  generatedAt: string;
  timezone: "Asia/Shanghai";
  source: "agent-reach-scrapling" | "seed";
  methodNote: string;
  agentReachUrl: string;
  sources: GlobalHotSourceStatus[];
  platforms: GlobalHotPlatformGroup[];
  stats: {
    platforms: number;
    items: number;
    sourcesOk: number;
    sourcesTotal: number;
    byRegion: { 国内: number; 海外: number };
  };
};
