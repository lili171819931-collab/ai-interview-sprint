# 智衡 AI Radar · AI 平台与工具看板（完整项目闭环）

日更数据、功能介绍、可追溯优劣势对比的 Web 看板。  
本目录已补齐从**需求 → 设计 → 项目管理 → 研发测试 → 上线运维 → 复盘闭环**的完整项目文档。

> **演进中：** 目标升级为 [Global Trend Intelligence](docs/16-global-trend-intelligence-architecture.md)。  
> **Phase 2–12 已交付**：ingest → 聚类 → Dashboard → Agent → MCP → 简报推送 → QA → Docker Compose（可选）。  
> 本地：`npm run intel:refresh && npm run dev` → http://localhost:3010  
> Docker：见 [`docs/docker.md`](docs/docker.md) · `docker compose up -d --build`
>
> **仓库权威路径（面试仓）**：[ai-interview-sprint/…/07-ai-radar-dashboard](https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/07-ai-radar-dashboard)  
> 融合说明：[`docs/17-repo-fusion.md`](docs/17-repo-fusion.md) · 跨仓对照：[`../PATH-MAP.md`](../PATH-MAP.md)  
> 可选镜像：[ai-projects/products/ai-radar-dashboard](https://github.com/lili171819931-collab/ai-projects/tree/main/products/ai-radar-dashboard)（勿用子模块覆盖本目录）

## 一分钟上手

```bash
cd 05-projects/07-ai-radar-dashboard
npm install
npm run pulse:install  # 安装 BuilderPulse 本地副本（vendor/）
npm run data:refresh   # 生成 daily-bundle + radar + pulse JSON
npm run dev            # http://localhost:3010  → 看 /pulse
```

## 页面

| 路由 | 作用 |
|------|------|
| `/` | 总览：数据链、能力地图、品类柱状图、今日看点 |
| `/radar` | AI 动态雷达日报：5 监控池 + TrendRadar 热点融合 + 信号看板 |
| `/hot` | 国内外实时热点：Agent Reach + NewsNow/RSS/OpenCLI 多源看板 |
| `/history` | 历史报告：日更归档回看（`data/archive/YYYY-MM-DD`） |
| `/pulse` | BuilderPulse 风格机会简报：今日构建建议 + 机会发现题库 |
| `/tools` | 目录：筛选 + 结果区（排序/视图/多选对比） |
| `/tools/[id]` | 功能介绍 + 优劣势 + 来源数据链 |
| `/compare` | 维度对比 + 决策流/树 + 柱状图 + 场景建议 |
| `/sources` | 数据来源报告：资产路径 + 5 监控池矩阵 + 公开源抓取 |
| `/methodology` | 评分口径与日更管道 |

## 完整项目文档地图

### 0) 立项与需求
- [`docs/00-project-charter.md`](docs/00-project-charter.md)
- [`docs/01-requirements-freeze.md`](docs/01-requirements-freeze.md)
- [`docs/prd.md`](docs/prd.md)

### 1) 产品设计
- [`docs/ia.md`](docs/ia.md)
- [`docs/02-product-design-spec.md`](docs/02-product-design-spec.md)
- [`docs/design-system.md`](docs/design-system.md)
- [`docs/data-contract.md`](docs/data-contract.md)

### 2) 项目管理与研发
- [`docs/03-project-management-plan.md`](docs/03-project-management-plan.md)
- [`docs/04-rd-implementation-plan.md`](docs/04-rd-implementation-plan.md)

### 3) 测试、发布与复盘
- [`docs/05-test-and-qa-report.md`](docs/05-test-and-qa-report.md)
- [`docs/06-release-ops-runbook.md`](docs/06-release-ops-runbook.md)
- [`docs/07-project-closure.md`](docs/07-project-closure.md)

### 4) 商业价值与 AI PM 视角
- [`docs/09-commercial-value-and-landing.md`](docs/09-commercial-value-and-landing.md)
- [`docs/10-ai-pm-perspective.md`](docs/10-ai-pm-perspective.md)
- [`docs/11-thinking-chain-and-risks.md`](docs/11-thinking-chain-and-risks.md)
- [`docs/12-ai-radar-research-system.md`](docs/12-ai-radar-research-system.md)
- [`docs/13-ai-radar-source-matrix.md`](docs/13-ai-radar-source-matrix.md)
- [`docs/14-opportunity-brief-full-loop.md`](docs/14-opportunity-brief-full-loop.md) ← **机会简报迭代全流程**
- [`docs/15-trendradar-fusion-full-loop.md`](docs/15-trendradar-fusion-full-loop.md) ← **TrendRadar 热点融合全流程**
- [`docs/16-global-trend-intelligence-architecture.md`](docs/16-global-trend-intelligence-architecture.md) ← **全网热点情报系统架构（Phase 1）**
- [`docs/极致Prompt-全网热点情报系统.md`](docs/极致Prompt-全网热点情报系统.md) ← **GTI 极致 Prompt 归档**
- [`docs/极致Prompt-日更实时更新与历史留存.md`](docs/极致Prompt-日更实时更新与历史留存.md) ← **日更实时 + 历史归档 Prompt**

### 5) 演示与故事化包装
- [`docs/演示脚本.md`](docs/演示脚本.md)
- [`docs/验收清单.md`](docs/验收清单.md)
- [`docs/interview-story.md`](docs/interview-story.md)
- [`docs/08-ai-product-interview-qa.md`](docs/08-ai-product-interview-qa.md)
- [`docs/极致Prompt-AI雷达看板从0到1.md`](docs/极致Prompt-AI雷达看板从0到1.md)
- [`docs/极致Prompt-思维链与风险专家版.md`](docs/极致Prompt-思维链与风险专家版.md)
- [`docs/极致Prompt-AI动态雷达日更.md`](docs/极致Prompt-AI动态雷达日更.md)

## 日更（真实公开源 + 动态雷达日报）

1. 编辑 `src/data/seed.ts`（事实与评分，人工底座）
2. 维护 5 监控池：`src/data/research-sources.ts`
3. 需要时扩展 `scripts/live-sources.ts`（RSS / GitHub Atom / 公开 Changelog）
4. **推荐日更（先归档再刷新，保留过往报告）**  
   ```bash
   npm run daily:refresh          # 全量：归档 → bundle/radar/pulse/trend/hot
   npm run daily:refresh:quick    # 快速：雷达 + 热点
   npm run daily:refresh:hot      # 仅热点
   ```
   页面也可点「立即日更」（`POST /api/refresh`）。历史回看：`/history`。  
   - 兼容旧命令：`npm run data:refresh`（不自动归档）  
   - 仅日报：`npm run radar:daily`  
   - 周报：`npm run radar:weekly`  
   - 实时热点：`npm run hot:sync`  
   - 离线：`npm run daily:refresh:offline`  
   - 仅机会简报：`npm run pulse:sync`  
   - 仅热点融合：`npm run trendradar:sync`
   - **情报 ingest（GTI Phase 2）**：`npm run intel:ingest`（统一 Item；离线 `intel:ingest:offline`）
   - **事件聚类 + 热度（Phase 4–5）**：`npm run intel:cluster` · 一键 `npm run intel:refresh`
5. 校验失败**不会**覆盖昨日 `data/daily-bundle.json`
6. 看板看 `/radar`（含 `#trendradar-hot`）；机会简报看 `/pulse`；抓取明细看 `/sources` 与 `data/live-fetch-report.json`

**不会**因 RSS / 雷达日报 / 热搜同步自动改七维分数。

## BuilderPulse 能力映射

参考 [BuilderPulse 中文说明](https://github.com/BuilderPulse/BuilderPulse#chinese)，本项目新增：

| BuilderPulse 能力 | 本项目落点 |
|-------------------|------------|
| 今日建议 + Why now | `/pulse` 顶部「今日构建建议」；`/radar` 摘要卡 |
| 2 小时构建 | `buildIdea.timebox*` |
| Top 3 信号 / 白话简报 | `/pulse` 对应区块 |
| 发现机会题库（发布/搜索/开源缺口/抱怨/行动） | `/pulse` 机会卡片 |
| 7 天命中记录 | `trackRecord` |
| 本地安装日报仓 | `npm run pulse:install` → `vendor/BuilderPulse` |

内容解析自公开中文日报，遵循其 **CC BY-NC 4.0**（非商业用途）；商业转载需联系原作者。

## TrendRadar 热点融合

参考 [TrendRadar](https://github.com/sansan0/TrendRadar)，本项目新增：

| TrendRadar 能力 | 本项目落点 |
|-----------------|------------|
| 多平台热搜聚合 | `npm run trendradar:sync` → `data/trendradar-hot.json` |
| 平台状态 / Top 榜 | `/radar#trendradar-hot` |
| AI 相关速览 | 标题关键词标签（辅助发现，不改评分） |
| HTML 报告 | 外链本机 `8080`（可选） |
| 本地安装 | `08-resources/TrendRadar/`（gitignore）+ [`TrendRadar-USAGE.md`](../../08-resources/TrendRadar-USAGE.md) |

## 文档

见 [`docs/`](docs/)（已覆盖完整项目生命周期）。

## 非目标

实时行情爬虫、账号社区、伪科学总榜、密钥进仓、把 TrendRadar 源码/venv 提交进仓。
