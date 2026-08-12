# 信息架构

> 演进说明：确认 [GTI 架构 D1](./16-global-trend-intelligence-architecture.md) 后，首页将升级为「今日全球热点」；下表含 **规划中** 路由。

```
/                 今日全球热点 TOP10（GTI）+ 次级工具看板
/events/[id]      跨平台事件详情 + AI What/Why/Who/Impact/Trend/Sources
/trends           Emerging / Rising / Hot / Cooling / Fading
/ask              Trend Intelligence Agent（自然语言问趋势）
/briefs           每日简报（聚类 TOP + AI 分区；可 webhook 推送）
/radar            AI 动态雷达日报（5 监控池 + TrendRadar 热点融合 + BuilderPulse 摘要）
/hot              国内外实时热点（原始平台榜）
/history          历史报告列表（data/archive 日更归档）
/history/[date]   某日快照（雷达/热点/Pulse 摘录）
/pulse            机会简报（今日构建建议 + Why now + 机会发现题库）
/tools            目录 + 结果区（排序 / 列表·表格 / 多选对比）
/tools/[id]       功能介绍详情 + 来源数据链
/compare?ids=     优劣势对比 + 决策流 / 决策树 / 柱状图
/sources          数据来源报告（资产路径 + 5 监控池矩阵 + 公开源抓取）
/methodology      口径与信任（日更管道）
```

导航：今日热点 / 趋势雷达 / 每日简报 / 问问 Agent / 动态雷达 / 平台榜 / 历史 / 机会简报 / 工具目录 / 对比 / 来源 / 口径。

状态：`fresh` | `stale` | `missing`（见 FreshnessBadge）。

机会简报数据：`data/builder-pulse-daily.json`（`npm run pulse:sync`）；失败降级 `pulse-seed`。  
TrendRadar 热点：`data/trendradar-hot.json`（`npm run trendradar:sync`）；失败降级 `trendradar-seed`。锚点：`/radar#trendradar-hot`。  
国内外实时热点：`data/global-hot-topics.json`（`npm run hot:sync`，对齐 [Agent Reach](https://github.com/Panniantong/Agent-Reach)）；失败降级 `global-hot-seed`。  
日更入口：`npm run daily:refresh`（先归档再刷新）· 页面「立即日更」· `POST /api/refresh`。  
历史归档：`data/archive/YYYY-MM-DD/` + `data/history/index.json`。
