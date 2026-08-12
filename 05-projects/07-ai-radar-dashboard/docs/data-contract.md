# 数据契约与日更规则

## ToolRecord / DailyBundle

见 `src/lib/types.ts` 与 Zod：`src/lib/schema.ts`。  
`DailyBundle.liveFetch` 记录最近一次公开源抓取结果（可选）。

## 日更流程

```
编辑 seed.ts（事实/评分人工底座）
  → 登记 scripts/live-sources.ts（公开 RSS/Atom/Changelog）
  → npm run data:refresh
  → 并行抓取（单路失败跳过）
  → 合并 changelogSummary / highlights / sources
  → Zod 校验 + 极端分护栏
  → 原子写入 data/daily-bundle.json
  → 同步 data/live-fetch-report.json
  → 校验失败则保留旧快照
```

离线：`npm run data:refresh:offline`（不请求外网）。

## 公开信息源原则

- 只用无需登录的官方 RSS、GitHub Atom Releases、公开 Changelog 页
- Anthropic 无官方 RSS 时，使用可信社区镜像，标记 `secondary`
- **禁止**自动改写七维分数；抓取只更新变更摘要与看点
- User-Agent 标明研究用途；尊重站点可用性，超时即失败降级

日更抓取清单：`src/data/live-sources.ts`（`scripts/live-sources.ts` 再导出）。

## 情报雷达信息源（5 监控池）

- 登记表：`src/data/research-sources.ts`
- 监控池：模型榜单 / 工具目录 / 新闻快讯 / 论文研究 / 官方发布
- 展示页：`/sources`（矩阵）· `/radar`（日报看板）
- 日报契约：`src/lib/radar-types.ts` + `src/lib/radar-schema.ts`
- 日报产物：`data/radar-daily-report.json`（`npm run radar:daily`）
- 看板字段：名称、类别、热度、排名、可信度、更新时间、来源链接、PM 机会点
- 情报站点**不全部**进入自动抓取；`data:refresh` 会在抓取后级联生成雷达日报
- **不自动改七维分数**
- 方法论：`docs/12-ai-radar-research-system.md`
- Prompt：`docs/极致Prompt-AI动态雷达日更.md`

## 评分口径

| 字段 | 含义 |
|------|------|
| breadth | 能力广度 |
| quality | 质量上限 |
| cost | 越划算分越高 |
| speed | 速度与可用性 |
| ecosystem | 生态集成 |
| compliance | 数据与合规友好度 |
| ease | 上手容易度 |

## 来源等级

`official` > `first_hand` > `secondary` > `inferred`  
仅 `inferred` 时禁止单独支撑 1 分或 5 分。

## 新鲜度

| 状态 | 条件 |
|------|------|
| fresh | bundle 日期 = 上海时区今天 |
| stale | 有 bundle 但非今天 |
| missing | 无合法 bundle，降级 seed |

## 日更归档与历史留存

```
npm run daily:refresh
  → 归档当前 data/*.json 到 data/archive/{报告日期}/
  → 刷新 bundle / radar / pulse / trendradar / hot
  → 再归档「今天」最新快照
  → 重写 data/history/index.json
```

| 产物 | 路径 |
|------|------|
| 当日最新 | `data/*.json`（页面默认读取） |
| 历史快照 | `data/archive/YYYY-MM-DD/*.json` |
| 历史索引 | `data/history/index.json` |
| 浏览页 | `/history` · `/history/[date]` |
| API | `POST /api/refresh?mode=quick\|hot\|full` |

规则：
- 归档日期取各文件 `reportDate` 或 `generatedAt`（Asia/Shanghai）
- 同日重复日更覆盖该日归档，不删除其他日期
- 刷新失败时保留上一次最新 `data/*.json`
- 极致 Prompt：`docs/极致Prompt-日更实时更新与历史留存.md`

## Global Trend Intelligence（Phase 2+）

| 产物 | 路径 |
|------|------|
| Item schema | `src/lib/intel/schema.ts` |
| Adapters | `scripts/adapters/*` |
| Ingest | `npm run intel:ingest` → `data/items/latest.json` |
| Cluster + TrendScore | `npm run intel:cluster` → `data/events/latest.json` |
| 一键 | `npm run intel:refresh`（含 briefs + 可选 push） |
| 兴趣配置 | `data/user-interests.json`（影响 `user_relevance`） |
| 每日简报 | `data/briefs/latest.json` · `/briefs` · `GET /api/briefs/daily` |
| 推送 | `INTEL_FEISHU_WEBHOOK` / `INTEL_PUSH_WEBHOOK`（可选） |
| QA | `npm run intel:qa` |
| MCP | `npm run mcp:intel` |

架构全文：[`docs/16-global-trend-intelligence-architecture.md`](./16-global-trend-intelligence-architecture.md)。  
原则不变：合法公开源、分析引用必须来自真实 URL、校验失败不覆盖昨日快照。
