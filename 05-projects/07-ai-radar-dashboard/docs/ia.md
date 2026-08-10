# 信息架构

```
/                 总览看板（数据链 / 能力地图 / 品类柱状图）
/radar            AI 动态雷达日报（5 监控池 + TrendRadar 热点融合 + BuilderPulse 摘要）
/pulse            机会简报（今日构建建议 + Why now + 机会发现题库）
/tools            目录 + 结果区（排序 / 列表·表格 / 多选对比）
/tools/[id]       功能介绍详情 + 来源数据链
/compare?ids=     优劣势对比 + 决策流 / 决策树 / 柱状图
/sources          数据来源报告（资产路径 + 5 监控池矩阵 + 公开源抓取）
/methodology      口径与信任（日更管道）
```

导航：总览 / 动态雷达 / **机会简报** / 目录 / 对比 / 来源报告 / 口径。

状态：`fresh` | `stale` | `missing`（见 FreshnessBadge）。

机会简报数据：`data/builder-pulse-daily.json`（`npm run pulse:sync`）；失败降级 `pulse-seed`。  
TrendRadar 热点：`data/trendradar-hot.json`（`npm run trendradar:sync`）；失败降级 `trendradar-seed`。锚点：`/radar#trendradar-hot`。
