# AI OSS Intel · GitHub AI 开源情报与产品分析平台

> **AI Open Source Intelligence Platform — Discover. Analyze. Build. Monetize.**
> 发现 AI 开源项目 → 深度理解 → 找到机会 → 开始构建 → 实现商业化

一个把 GitHub 从「代码仓库」转化为「AI 开源项目雷达」的平台：
每天自动发现最热门的 AI 开源项目，用 **Growth Intelligence + 10-Agent 共识评分**，
告诉你哪个项目**现在最值得**学习、复刻、做副业、做 Skill、做简历、做 SaaS。

本地已启动：**http://localhost:3012**（`npm run dev`）

---

## ✨ 核心能力

| 能力 | 说明 |
|------|------|
| 📡 项目发现 | 72 个精选 AI 开源项目，覆盖 30 大分类（Agent / Skill / MCP / Coding / SaaS / RAG…） |
| 📊 Growth Intelligence Engine | 计算每个项目 7 / 30 / 90 天 Star 增长与增长率，生成趋势图 |
| 🏆 9 大排行榜 | Star Top 50 · Growth Top 50 · Opportunity · Money · Side Hustle · Skill · Resume · Self Media · New |
| 🎯 AI Project Score | 8 维加权评分（Popularity 10% + Growth 15% + Innovation 15% + Product 15% + Demand 10% + Commercial 15% + Ecosystem 10% + PersonalDev 10%） |
| 🧠 10-Agent 共识报告 | 每项目生成 25 节 Project Intelligence Report + Should-I-Build Verdict |
| 💡 产品机会生成器 | 每项目自动生成 ≥5 个新产品方向（名称/用户/痛点/MVP/商业模式/壁垒/难度/周期/潜力） |
| 🚀 One Person Startup | 一人创业可行性：开发要求、MVP 周期、成本、变现难度、综合评分 |
| 🔍 AI Open Source Analyst | 自然语言问答，直接查询平台数据与报告，例如「最近30天增长最快适合做副业的AI项目」 |
| ⚖️ Compare | 2-4 项目多指标对比 + AI 最终推荐 |
| 📡 My AI Radar | Watchlist 收藏 + 智能提醒（增长/排名/商业化信号） |

## 🗺 页面

| 路由 | 作用 |
|------|------|
| `/` | Dashboard：Hero + Trending + 排行榜预览 + 分类 |
| `/discover` | Explore：搜索 / 分类 / 语言 / 排序筛选全部项目 |
| `/rankings` | 排行榜体系总览 |
| `/rankings/[stars|growth|opportunity|money|sidehustle|skills|resume|content|new]` | 9 大榜单 |
| `/projects/[slug]` | 项目情报页：Overview / Architecture / Features / Product / Business / Growth / Opportunities / AI Report |
| `/compare` | 项目对比 + AI 最终推荐 |
| `/ask` | AI Open Source Analyst 自然语言分析 |
| `/watchlist` | My AI Radar 收藏与提醒 |
| `/insights` | 每日 AI 洞察与行动雷达 |

## 🚀 快速开始

```bash
cd 05-projects/14-ai-oss-intel
npm install          # 依赖（Next.js 15 / React 19 / Tailwind 4 / TypeScript strict）
npm run data:build   # 数据完整性校验（72 个项目 ALL OK ✅）
npm test             # 引擎单测（评分/排名/查询解析/报告生成）
npm run dev          # http://localhost:3012
```

生产构建：

```bash
npm run build
npm run start        # http://localhost:3012
```

## 📡 拉取 GitHub 实时数据

平台内置 **GitHub Data Collector**（`scripts/sync-github.ts`），通过 GitHub Search API
拉取 AI 相关仓库并合并为快照（`data/github-snapshot.json`）：

```bash
GITHUB_TOKEN=ghp_xxx npm run github:sync   # 推荐：认证后 5000 req/h
npm run github:sync                        # 未认证：10 req/min（受速率限制）
```

数据流：`Scheduler → Collector → Cache(data/cache) → Snapshot → Analytics Engine`
更新策略：高频（Trending/Growth/Stars）> 中频（Repo 元数据）> 低频（深度 AI 报告）。

## 🧩 系统架构

```text
GitHub API
   ↓
GitHub Data Collector (scripts/sync-github.ts)
   ↓
Data Layer (src/data + src/lib/types.ts)
   ↓
Engines (src/lib/engines.ts)
   ├─ Growth Intelligence Engine   (7/30/90 天增长率)
   ├─ Scoring Engine               (AI Project Score + 9 专项分)
   └─ Ranking Engine               (9 大榜单)
   ↓
AI Layer (src/lib/reports.ts + src/lib/query.ts)
   ├─ 10-Agent Consensus Report Generator (25 节报告)
   ├─ Opportunity Generator (≥5 新产品方向)
   └─ NL Query Engine (自然语言 → 结构化意图)
   ↓
Next.js App Router UI (Server Components + 少量 Client Components)
   ├─ Dashboard / Discover / Rankings / Project Detail
   ├─ Compare / Watchlist / Insights / Ask AI
   └─ Dark AI Intelligence Dashboard Design System
```

## 🛠 技术栈

- **框架**：Next.js 15 (App Router, SSG) · React 19 · TypeScript strict
- **样式**：Tailwind CSS 4 · Dark AI Intelligence Dashboard
- **数据**：内置确定性种子数据（72 项目）+ GitHub Sync 可选实时数据
- **测试**：`tsx` 驱动的引擎单测（`tests/engines.test.ts`）
- **质量**：全链路类型安全、纯函数引擎、模块化、可扩展（数据源 Adapter 预留）

## 📚 文档

- [`docs/01-prd.md`](docs/01-prd.md) — 产品需求（定位/用户/场景/MVP Scope）
- [`docs/02-architecture.md`](docs/02-architecture.md) — 信息架构 / Agent 架构 / API 架构 / 数据架构
- [`docs/03-database-schema.md`](docs/03-database-schema.md) — 数据模型与 Schema
- [`docs/04-roadmap.md`](docs/04-roadmap.md) — 版本路线图（V1 / V1.5 / V2 / V3）
- [`docs/05-deployment.md`](docs/05-deployment.md) — 部署策略（本地 / Docker / 服务器）

## 🎯 产品定位

> **不是发现最多的项目，而是发现最值得用户采取行动的项目。**
> 最终进化目标：AI Open Source Opportunity OS
> `GitHub → Discover → Rank → Analyze → Understand → Compare → Find Opportunity → Generate Product → Generate PRD → Generate MVP → Build → Monetize`
