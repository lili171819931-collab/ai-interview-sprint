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

源清单：`scripts/live-sources.ts`。

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
