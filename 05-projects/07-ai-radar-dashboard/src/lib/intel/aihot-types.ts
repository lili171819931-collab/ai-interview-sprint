import type { FeedCategory } from "./categories";

export type AihotLinks = {
  aihot: string | null;
  original: string | null;
  story?: string | null;
  api?: string | null;
};

export type AihotItem = {
  id: string;
  title: string;
  originalTitle?: string | null;
  summary?: string | null;
  source: { name: string };
  links: AihotLinks;
  publishedAt?: string | null;
  discoveredAt: string;
  category?: string | null;
  score?: number | null;
  selected?: boolean;
  /** AIHOT 详情页「推荐理由」；同步时抓取或本地生成 */
  recommendReason?: string | null;
  attribution?: { name: string; url: string };
};

export type AihotHotTopic = {
  rank: number;
  id: string;
  title: string;
  source: { name: string };
  links: AihotLinks;
  sourceCount: number;
  signalCount?: number;
  sourceNames: string[];
  latestAt: string;
};

export type AihotDailyEntry = {
  title: string;
  summary?: string | null;
  source: { name: string };
  links: AihotLinks;
};

export type AihotDailySection = {
  label: string;
  items: AihotDailyEntry[];
};

export type AihotDailyReport = {
  date: string;
  generatedAt: string;
  windowStart?: string;
  windowEnd?: string;
  links: { aihot: string };
  attribution?: { name: string; url: string };
  lead?: string | null;
  sections: AihotDailySection[];
  flashes?: AihotDailyEntry[];
};

export type AihotItemsSnapshot = {
  schemaVersion: number;
  fetchedAt: string;
  query: {
    mode: string;
    window: string;
    category: string | null;
    q: string | null;
  };
  items: AihotItem[];
};

export type AihotHotSnapshot = {
  schemaVersion: number;
  fetchedAt: string;
  count: number;
  items: AihotHotTopic[];
};

export type AihotDailySnapshot = {
  schemaVersion: number;
  fetchedAt: string;
  report: AihotDailyReport | null;
};

export type AihotDailyIndexItem = {
  date: string;
  generatedAt: string;
  leadTitle: string | null;
  leadParagraph?: string | null;
  links: { aihot: string };
};

export type AihotDailyIndexSnapshot = {
  schemaVersion: number;
  fetchedAt: string;
  count: number;
  items: AihotDailyIndexItem[];
};

export type FeedItem = {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  originalUrl: string;
  localHref: string;
  publishedAt: string | null;
  discoveredAt: string;
  category: FeedCategory;
  selected: boolean;
  origin: "aihot" | "intel" | "event" | "twitter" | "hot";
  score: number | null;
  recommendReason: string;
  eventId?: string;
  attribution?: { name: string; url: string };
};

export type HotStatus = "new" | "fermenting" | "hot" | null;

export type HotRankItem = {
  rank: number;
  id: string;
  title: string;
  sourceName: string;
  sourceCount: number;
  signalCount: number;
  sourceNames: string[];
  latestAt: string;
  href: string;
  /** 本地故事线页（/story/{publicId}） */
  storyHref?: string | null;
  /** 第三方原始报道链接 */
  originalUrl?: string | null;
  /** AIHOT 原站故事/条目链接（仅作署名） */
  externalUrl?: string | null;
  origin: "aihot" | "event";
  heat: number;
  status: HotStatus;
  attribution?: { name: string; url: string };
};
