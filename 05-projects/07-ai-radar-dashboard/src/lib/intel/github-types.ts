export const GITHUB_CATEGORY_ORDER = [
  "coding",
  "agent-office",
  "content",
  "intel",
  "growth",
  "learn",
  "infra",
  "other",
] as const;

export type GithubCategory = (typeof GITHUB_CATEGORY_ORDER)[number];

export type GithubStarItem = {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  author: string;
  authorUrl: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  category: GithubCategory;
  starredAt: string;
  pushedAt: string | null;
  /** Product / docs site when the project ships a mature web product. */
  homepage: string | null;
  /** SPDX or short license name; GitHub stars are public repos. */
  license: string | null;
  openSource: boolean;
  /** Concrete capabilities the repo implements. */
  features: string[];
};

export type GithubStarsSnapshot = {
  schemaVersion: 1;
  fetchedAt: string;
  login: string;
  profileUrl: string;
  count: number;
  items: GithubStarItem[];
};

export type GithubHotItem = GithubStarItem & {
  rank: number;
  list: "rising" | "top";
  /** Stars gained today / this week when known (trending). */
  starsDelta: number | null;
};

export type GithubHotCategoryBucket = {
  id: GithubCategory;
  top: GithubHotItem[];
  rising: GithubHotItem[];
};

export type GithubHotSnapshot = {
  schemaVersion: 1 | 2;
  fetchedAt: string;
  categories: GithubHotCategoryBucket[];
  /** @deprecated schema 1 flat lists; kept for old files */
  rising?: GithubHotItem[];
  top?: GithubHotItem[];
};
