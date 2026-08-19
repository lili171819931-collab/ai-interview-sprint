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
| `/` | 精选 |
| `/all` | 全部动态 |
| `/ranking` | AI 热点榜 |
| `/hot` | 热点分析（国内 / 海外） |
| `/briefs` | AI 日报 |
| `/opportunities` | 机会点分析报告（日更存档） |
| `/leaderboard` | 大模型排行榜 |
| `/ask` | Agent |
| `/items/[id]` | 精选阅读页 |
| `/events/[id]` | 事件详情 |

## 站点体验修复（2026-08-19）

- **未知路径 → 精选**：新增 `src/app/not-found.tsx`，任何未匹配路径（含被误拼的中文路径）自动 `307` 跳回 `/` 精选界面，不再出现 “This page could not be found”。
- **AI 机会报告实时更新**：
  - `scripts/sync-builder-pulse.ts` 从今天向前最多找 10 天，自动取最近一期已发布的 BuilderPulse 日报（上游缺更早日期时不再降级到 seed）；
  - `scripts/generate-opportunity-report.ts` 以简报实际日期为准生成报告；
  - `/opportunities` 页新增「实时更新」按钮（`POST /api/refresh?mode=opp` → 自动重新拉取最新一期并归档）。

### AI 机会报告 · 全平台实时联动

- **BuilderPulse 当天有日报**：对齐其方法生成（builderpulse-aligned）。
- **BuilderPulse 未发布当天**（如上游缺失 8.15+）：自动切到 **实时生成模式（live）**，由智衡全平台实时数据联动合成：
  - AI 热点榜（AIHOT）→ Top 信号与趋势机会
  - GitHub 热点（增速最快仓库）→ 开源缺口机会 + 今日建议（做一款「X」式产品）
  - Product Hunt 热点 → 新品发布（launches）机会
  - 国内外全域热点（NewsNow）→ 信号补充
- 页面展示「实时生成 · 全平台实时联动」标签，并提供「实时更新」按钮（`POST /api/refresh?mode=opp`）。
- 数据全部实时刷新：`npm run aihot:sync && npm run hot:sync && npm run github:sync && npm run github:hot && npm run ph:sync && npm run opp:sync`

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
- [`docs/18-builderpulse-opportunity-archive.md`](docs/18-builderpulse-opportunity-archive.md) ← **机会日报方法与归档**
- [`docs/19-featured-intel-full-loop.md`](docs/19-featured-intel-full-loop.md) ← **精选情报台全闭环（操作/测试/调试/成本/产品付出）**

### 5) 演示与故事化包装
- [`docs/演示脚本.md`](docs/演示脚本.md)
- [`docs/验收清单.md`](docs/验收清单.md)
- [`docs/interview-story.md`](docs/interview-story.md)
- [`docs/08-ai-product-interview-qa.md`](docs/08-ai-product-interview-qa.md)
- [`docs/极致Prompt-AI雷达看板从0到1.md`](docs/极致Prompt-AI雷达看板从0到1.md)
- [`docs/极致Prompt-思维链与风险专家版.md`](docs/极致Prompt-思维链与风险专家版.md)
- [`docs/极致Prompt-AI动态雷达日更.md`](docs/极致Prompt-AI动态雷达日更.md)
- [`docs/极致Prompt-设计自检与功能补全.md`](docs/极致Prompt-设计自检与功能补全.md) ← **设计自检 + 热点分析/机会报告补全**

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
   - AIHOT 精选：每小时自动更新（页面打开时调度 + GitHub Action `0 * * * *` + `npm run hourly`）
   - 离线：`npm run daily:refresh:offline`  
   - 仅机会简报：`npm run pulse:sync`  
   - 机会分析报告（BP 方法 + 归档）：`npm run opp:sync`  
   - 仅热点融合：`npm run trendradar:sync`
   - **情报 ingest（GTI Phase 2）**：`npm run intel:ingest`（统一 Item；离线 `intel:ingest:offline`）
   - **事件聚类 + 热度（Phase 4–5）**：`npm run intel:cluster` · 一键 `npm run intel:refresh`
5. 校验失败**不会**覆盖昨日 `data/daily-bundle.json`
6. 看板看 `/radar`（含 `#trendradar-hot`）；机会简报看 `/pulse`；抓取明细看 `/sources` 与 `data/live-fetch-report.json`

**不会**因 RSS / 雷达日报 / 热搜同步自动改七维分数。

## AIHOT 站点复刻

参考 [AIHOT](https://aihot.virxact.com) / [khazix-skills aihot](https://github.com/KKKKhazix/khazix-skills/tree/main/aihot) 与 [leader](https://github.com/KKKKhazix/khazix-skills#-leader领导)：

| AIHOT / leader 能力 | 本项目落点 |
|---------------------|------------|
| 精选时间窗 24h/7d + 主题 + 搜索 | `/` |
| 热点榜（按名次，不展示热度值） | `/ranking` · `GET /api/v1/hot-topics` |
| 日切日报 sections | `/briefs` · `GET /api/v1/dailies/latest` |
| 全部动态 | `/all` |
| Agent 匿名 v1 | `/agent` · `/api/v1/items` |
| leader 目标七问 | `/goal` 生成可复制任务书 |
| 公开精选同步 | `npm run aihot:sync` → `data/aihot/` |
| 事件故事线（图 2 模式：搜索逻辑 + 热度计算 + 推荐理由 + 报道时间线） | `/story/[publicId]`（热点榜点击直达，不跳外部链接） |

AIHOT 数据仅用于个人非商业 / 面试演示，遵守 [公开使用规则](https://aihot.virxact.com/terms)，不是公开镜像。

### 事件故事线（本站自建，不再外跳）

点击 `/ranking` 热点榜任意条目，进入本站 **`/story/[publicId]`** 故事线页（对齐 AIHOT story 页的信息架构，但搜索与热度为本项目本地实现）：

- **搜索逻辑**：从标题抽取实体关键词（模型名 / 产品名），标注检索范围（X / 公众号 / 博客 RSS / 官方渠道 / 媒体）、匹配策略与完整信源清单；
- **热度计算**：`热度 = (信源数 × 10 + 信号数 × 4) × 2^(−小时/24)`，24 小时半衰期衰减，渲染本地 24h 热度曲线（峰值 / 当前值 / 趋势）；
- **推荐理由**：总述（优先复用 AIHOT 精选推荐理由，否则本地生成）+ 逐篇报道理由；
- **报道故事线**：时间倒序时间线（官方一手标记 + 原文外链）+ 相关故事线互链。

数据经 `npm run aihot:sync` 缓存至 `data/aihot/stories/{publicId}.json`；`GET /api/v1/hot-topics` 的 `links.story` 已指向本站故事线页，`links.original` 保留第三方原文、`links.aihot` 仅作署名。

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

## Product Hunt 热点

- 位置：集成在 `/github-hot` 页内「Product Hunt 热点」区块（无独立页面）
- 数据：`npm run ph:sync` → `data/producthunt-hot.json`（NewsNow 转推 PH 官方 API v2 + 历史档案回填，个人非商业；**44 款**，近 14 天滚动）
- 能力：**按场景分类**展示 Product Hunt 热门 App，每类弹窗含**「收藏最多」（票数降序）与「增速最快」（票数增量降序）两个 Tab**，与 GitHub 热点同一套展示逻辑；每款 App 附**简介、票数、PH 下载链接、GitHub 源码地址**（爬取库匹配同名开源仓库直接给源码，未匹配给 GitHub 全库搜索）
- 弹窗统一为**可拖动 / 可最小化 / 可关闭**（`DraggableModal`），GitHub 热点、收藏、搜索、Product Hunt 共用

## GitHub 搜索推荐（中英双语）

- `/github-hot` 与 `/github` 顶部「搜索推荐」：对爬取库（收藏 + 热点，去重后约 220 个项目）按关键字检索
- **中英文自动互译**：输入中文自动翻译成英文、输入英文自动翻译成中文，同时命中中英文项目（走本站 `/api/v1/translate`）
- 推荐弹窗两个 Tab：**收藏最多**（stars 降序）/ **增长最快**（starsDelta 降序），展示场景分类标签 + GitHub / 产品站链接 + 「GitHub 全库搜索」外链

## 文档

见 [`docs/`](docs/)（已覆盖完整项目生命周期）。  
参考源与作者致谢全文：[`docs/CREDITS.md`](docs/CREDITS.md)。

## 参考源与诚恳致谢

本项目是学习 / 面试作品，**站在开源与公开情报工作之上**。信息架构、机会分析方法、热点聚合能力均大量参考下列项目与作者；没有他们的公开工作，智衡无法成形。在此致以诚挚感谢。

| 参考 / 开源项目 | 作者 / 维护者 | 链接 | 本项目如何学习与引用 |
|-----------------|---------------|------|----------------------|
| **BuilderPulse** | [Liu Xiaopai（刘小排）](https://github.com/liuxiaopai-ai) | [BuilderPulse/BuilderPulse](https://github.com/BuilderPulse/BuilderPulse#chinese) | 机会日报方法（今日建议 / Why now / 信号·白话·判断·反方）；`/pulse` · `/opportunities` |
| **AIHOT** | [Virxact / AIHOT](https://aihot.virxact.com) | [aihot.virxact.com](https://aihot.virxact.com) · [使用条款](https://aihot.virxact.com/terms) | 精选 / 热点榜 / 日报信息架构与公开 v1 数据学习 |
| **khazix-skills · aihot / leader** | [KKKKhazix](https://github.com/KKKKhazix) | [aihot](https://github.com/KKKKhazix/khazix-skills/tree/main/aihot) · [leader](https://github.com/KKKKhazix/khazix-skills) | Agent / 目标书与热点技能设计参考 |
| **TrendRadar** | [sansan0](https://github.com/sansan0) | [sansan0/TrendRadar](https://github.com/sansan0/TrendRadar) | 多平台热搜聚合与融合流程 |
| **Agent-Reach** | [Panniantong](https://github.com/Panniantong) | [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | 多源公开抓取能力对齐（OpenCLI / 可选社交源） |
| **NewsNow** | [ourongxing](https://github.com/ourongxing) | [ourongxing/newsnow](https://github.com/ourongxing/newsnow) · [newsnow.busiyi.world](https://newsnow.busiyi.world) | 公开热点聚合 API（微博/抖音/知乎等） |
| **Scrapling** | [D4Vinci](https://github.com/D4Vinci) | [D4Vinci/Scrapling](https://github.com/D4Vinci/Scrapling) | 研究脚本与公开页抓取实验 |
| **Next.js** | [Vercel](https://github.com/vercel) | [vercel/next.js](https://github.com/vercel/next.js) | Web 看板运行时 |

**许可与边界（请务必阅读）：**

- BuilderPulse 报告内容为 **[CC BY-NC 4.0](https://github.com/BuilderPulse/BuilderPulse/blob/main/LICENSE.md)**：本仓仅做结构化学习展示与署名，**非商业转载**；商业用途请先联系 [刘小排](https://github.com/liuxiaopai-ai)。
- AIHOT 公开数据仅用于**个人非商业 / 面试演示**，遵守其公开使用规则，**不是**官方镜像站。
- TrendRadar / Agent-Reach / NewsNow / Scrapling 等按各自仓库许可证使用；本仓不提交其 venv/源码整包，仅学习能力并链接致谢。

若您是上表任一项目作者，发现署名有误或希望调整引用方式，欢迎开 Issue，我们会尽快更正。

## 非目标

实时行情爬虫、账号社区、伪科学总榜、密钥进仓、把 TrendRadar 源码/venv 提交进仓。
