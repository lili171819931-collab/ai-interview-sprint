import type { GlobalHotTopicsSnapshot } from "@/lib/global-hot-types";

/** 离线演示用最小快照（无网络 / 同步失败时降级） */
export function buildSeedGlobalHotTopics(nowIso: string): GlobalHotTopicsSnapshot {
  const fetched = nowIso;
  return {
    generatedAt: nowIso,
    timezone: "Asia/Shanghai",
    source: "seed",
    methodNote:
      "seed 降级：请运行 npm run hot:sync（调用 08-resources/scrapling-examples/global_hot_topics_dashboard.py，对齐 Agent Reach 多源能力）。",
    agentReachUrl: "https://github.com/Panniantong/Agent-Reach",
    sources: [
      {
        id: "weibo",
        label: "微博热搜",
        region: "国内",
        ok: true,
        mode: "seed",
        hits: 3,
      },
      {
        id: "hacker-news",
        label: "Hacker News",
        region: "海外",
        ok: true,
        mode: "seed",
        hits: 3,
      },
    ],
    platforms: [
      {
        name: "微博热搜",
        region: "国内",
        items: [
          {
            platform: "微博热搜",
            region: "国内",
            rank: 1,
            title: "AI 产品经理学习路径",
            heat: 100,
            url: "https://s.weibo.com/",
            fetched_at: fetched,
            source_id: "weibo",
          },
          {
            platform: "微博热搜",
            region: "国内",
            rank: 2,
            title: "具身智能融资加速",
            heat: 90,
            url: "https://s.weibo.com/",
            fetched_at: fetched,
            source_id: "weibo",
          },
          {
            platform: "微博热搜",
            region: "国内",
            rank: 3,
            title: "开源 Agent 工具链",
            heat: 80,
            url: "https://s.weibo.com/",
            fetched_at: fetched,
            source_id: "weibo",
          },
        ],
      },
      {
        name: "Hacker News",
        region: "海外",
        items: [
          {
            platform: "Hacker News",
            region: "海外",
            rank: 1,
            title: "Show HN: Agent Reach — internet eyes for AI agents",
            heat: 40,
            url: "https://news.ycombinator.com/",
            fetched_at: fetched,
            source_id: "hacker-news",
          },
          {
            platform: "Hacker News",
            region: "海外",
            rank: 2,
            title: "Local-first research dashboards for PMs",
            heat: 35,
            url: "https://news.ycombinator.com/",
            fetched_at: fetched,
            source_id: "hacker-news",
          },
          {
            platform: "Hacker News",
            region: "海外",
            rank: 3,
            title: "Open-source CLI routers for social platforms",
            heat: 30,
            url: "https://news.ycombinator.com/",
            fetched_at: fetched,
            source_id: "hacker-news",
          },
        ],
      },
    ],
    stats: {
      platforms: 2,
      items: 6,
      sourcesOk: 2,
      sourcesTotal: 2,
      byRegion: { 国内: 3, 海外: 3 },
    },
  };
}
