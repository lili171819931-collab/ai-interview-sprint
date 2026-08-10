import type { TrendRadarSnapshot } from "@/lib/trendradar-types";

export function buildSeedTrendRadarSnapshot(
  generatedAt = new Date().toISOString(),
): TrendRadarSnapshot {
  const reportDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(generatedAt));

  return {
    generatedAt,
    reportDate,
    timezone: "Asia/Shanghai",
    source: "seed",
    sourceUrl: "https://github.com/sansan0/TrendRadar",
    crawlTime: "seed",
    totalItems: 3,
    successPlatforms: 0,
    failedPlatforms: 0,
    platforms: [],
    items: [
      {
        id: "seed-1",
        title: "（示例）运行 npm run trendradar:sync 同步本地 TrendRadar 热点",
        platformId: "seed",
        platformName: "本地同步",
        rank: 1,
        url: "https://github.com/sansan0/TrendRadar",
        firstSeen: reportDate,
        lastSeen: reportDate,
        aiRelated: true,
      },
      {
        id: "seed-2",
        title: "（示例）先 uv run python -m trendradar 生成 output/news/*.db",
        platformId: "seed",
        platformName: "本地同步",
        rank: 2,
        url: "https://trendradar.sandev.cc/zh/docs/quick-start/",
        firstSeen: reportDate,
        lastSeen: reportDate,
        aiRelated: false,
      },
      {
        id: "seed-3",
        title: "（示例）多平台热搜聚合后将在此展示 Top 榜单与 AI 相关条目",
        platformId: "seed",
        platformName: "本地同步",
        rank: 3,
        url: "http://127.0.0.1:8080/html/latest/current.html",
        firstSeen: reportDate,
        lastSeen: reportDate,
        aiRelated: true,
      },
    ],
    htmlReportUrl: "http://127.0.0.1:8080/html/latest/current.html",
    methodNote:
      "对齐 TrendRadar：多平台热搜 + RSS → 本地 SQLite → 同步为 JSON 嵌入智衡 /radar。未同步时使用 seed。",
  };
}
