/** AIHOT 故事线（事件）公开 API v1 数据类型 + 本地分析派生类型 */

export type AihotStoryReportSource = {
  name: string;
  firstParty?: boolean;
};

export type AihotStoryReport = {
  id: string;
  title: string;
  summary: string | null;
  source: AihotStoryReportSource;
  publishedAt: string;
  links: {
    aihot: string | null;
    original: string | null;
  };
};

export type AihotStoryLink = {
  publicId: string;
  title: string;
  relation?: string;
  links: {
    aihot: string | null;
    api?: string | null;
  };
};

export type AihotStory = {
  publicId: string;
  title: string;
  status: string;
  sourceCount: number;
  reportCount: number;
  firstReportAt: string;
  latestAt: string;
  latest: string | null;
  digest: string | null;
  digestUpdatedAt: string | null;
  links: {
    aihot: string | null;
  };
  reports: AihotStoryReport[];
  storyline: AihotStoryLink[];
  related: AihotStoryLink[];
};

export type AihotStorySnapshot = {
  schemaVersion: number;
  fetchedAt: string;
  story: AihotStory;
};

/** 本地搜索逻辑：检索词 / 检索范围 / 匹配策略 / 信源清单 */
export type StorySearchLogic = {
  keywords: string[];
  scope: string;
  strategy: string;
  windowLabel: string;
  sourceBreakdown: { kind: string; count: number }[];
  sources: string[];
};

/** 本地热度计算：公式 / 输入 / 曲线 */
export type StoryHeatPoint = {
  at: string;
  heat: number;
  gapBefore?: boolean;
};

export type StoryHeatAnalysis = {
  formula: string;
  inputs: { sourceCount: number; signalCount: number; latestAt: string; halfLifeHours: number };
  current: number;
  peak: number;
  peakAt: string;
  trend: "up" | "flat" | "down";
  points: StoryHeatPoint[];
};

/** 本地推荐理由：总述 + 每篇报道 */
export type StoryRecommendation = {
  overall: string;
  overallBasis: string;
  perReport: { id: string; title: string; reason: string }[];
};

/** 组装后的完整故事视图 */
export type StoryView = {
  topic: {
    rank: number | null;
    itemId: string | null;
    title: string;
    sourceName: string;
    sourceCount: number;
    signalCount: number;
    sourceNames: string[];
    latestAt: string;
  } | null;
  story: AihotStory;
  search: StorySearchLogic;
  heat: StoryHeatAnalysis;
  recommendation: StoryRecommendation;
  fetchedAt: string;
};
