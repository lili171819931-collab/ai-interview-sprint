import type { GithubCategory } from "./github-types";

export type ProductHuntItem = {
  rank: number;
  title: string;
  /** 一句话简介（NewsNow hover） */
  tagline: string;
  /** 当日票数 */
  votes: number;
  /** 票数增量（最近一次对比首次记录），用于「增长最快」 */
  delta?: number;
  /** Product Hunt 产品页（下载链接） */
  url: string;
  slug: string;
  category: GithubCategory;
  /** 爬取库内匹配到的开源仓库（若有） */
  github: {
    url: string;
    name: string;
    stars: number;
    homepage: string | null;
  } | null;
  /** 未匹配时的 GitHub 源码搜索地址 */
  githubSearchUrl: string;
};

export type ProductHuntSnapshot = {
  schemaVersion: 1;
  fetchedAt: string;
  source: string;
  count: number;
  items: ProductHuntItem[];
};
