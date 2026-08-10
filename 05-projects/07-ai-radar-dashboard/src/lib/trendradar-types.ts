/** TrendRadar 多平台热点快照（对齐 sansan0/TrendRadar 本地 output） */

export type TrendRadarPlatformStatus = {
  id: string;
  name: string;
  status: "success" | "failed" | "unknown";
  itemCount: number;
};

export type TrendRadarHotItem = {
  id: string;
  title: string;
  platformId: string;
  platformName: string;
  rank: number;
  url: string;
  firstSeen: string;
  lastSeen: string;
  aiRelated: boolean;
};

export type TrendRadarSnapshot = {
  generatedAt: string;
  reportDate: string;
  timezone: "Asia/Shanghai";
  source: "trendradar-local" | "seed";
  sourceUrl: string;
  crawlTime: string;
  totalItems: number;
  successPlatforms: number;
  failedPlatforms: number;
  platforms: TrendRadarPlatformStatus[];
  items: TrendRadarHotItem[];
  htmlReportUrl: string;
  methodNote: string;
};
