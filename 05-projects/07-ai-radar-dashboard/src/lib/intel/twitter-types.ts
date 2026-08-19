export type TwitterLiveKind = "tweet" | "trend";

export type TwitterLiveItem = {
  id: string;
  author: string;
  handle: string;
  text: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
  kind: TwitterLiveKind;
  source: string;
};

export type TwitterLiveSnapshot = {
  schemaVersion: 1;
  fetchedAt: string;
  source: string;
  count: number;
  items: TwitterLiveItem[];
};
