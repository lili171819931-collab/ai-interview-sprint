# 信息架构

> 演进说明：确认 [GTI 架构 D1](./16-global-trend-intelligence-architecture.md) 后，首页将升级为「今日全球热点」；下表为**当前主航**。

```
/                   精选
/all                全部动态
/ranking            AI 热点榜（精选事件热度）
/hot                热点分析（国内 / 海外分版）
/briefs             AI 日报
/opportunities      机会点分析报告
/leaderboard        大模型排行榜
/ask                Agent
/items/[id]         精选条目
/events/[id]        事件详情
```

侧栏：内容（精选 / 全部 / 热点榜 / 热点分析 / 日报）· 洞察（机会报告）· 模型（模型榜）· 更多（Agent）。  
品牌标记：`public/zhiheng-mark.svg`（聚焦雷达）。每小时自动更新。

离航但保留：`/pulse` `/radar` `/history` `/sources` `/goal` `/trends`。

状态：`fresh` | `stale` | `missing`（见 FreshnessBadge）。

机会简报数据：`data/builder-pulse-daily.json`（`npm run pulse:sync`）。  
机会分析报告（BuilderPulse 方法 + 日切存档）：`data/opportunity-report-daily.json` · `data/opportunities/YYYY-MM-DD.json`（`npm run opp:sync`）。  
方法说明：[`18-builderpulse-opportunity-archive.md`](./18-builderpulse-opportunity-archive.md)。
TrendRadar 热点：`data/trendradar-hot.json`（`npm run trendradar:sync`）；失败降级 `trendradar-seed`。  
国内外实时热点：`data/global-hot-topics.json`（`npm run hot:sync`）；失败降级 `global-hot-seed`。  
日更入口：`npm run daily:refresh` · `POST /api/refresh`。  
历史归档：`data/archive/YYYY-MM-DD/` + `data/history/index.json`。

自检 Prompt：[`极致Prompt-设计自检与功能补全.md`](./极致Prompt-设计自检与功能补全.md)。
