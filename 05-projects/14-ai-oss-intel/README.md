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
| 📡 项目发现 | 169 个精选开源 AI 项目，覆盖 30 大分类（Agent / Skill / MCP / Coding / SaaS / RAG…） |
| 📊 Growth Intelligence Engine | 计算每个项目 7 / 30 / 90 天 Star 增长与增长率，生成趋势图 |
| 🏆 分类 TOP 榜（唯一榜单体系） | 30 个一级分类 × 3 榜：机会 TOP / 收藏榜 / 收藏增长最快榜 · **只展示本分类相关且 2026 年**的开源项目（创建或最近更新在 2026，不做跨分类补齐，小分类数量以实际为准）· 实时 GitHub 数据 + 未认证限流自动降级 · 每项目带 分析 / 产品框图 / 专家实战 / Agent 拆解 / 产品总监视角 / Prompt |
| 🎯 AI Project Score | 8 维加权评分（Popularity 10% + Growth 15% + Innovation 15% + Product 15% + Demand 10% + Commercial 15% + Ecosystem 10% + PersonalDev 10%） |
| 🧠 10-Agent 共识报告 | 每项目生成 25 节 Project Intelligence Report + Should-I-Build Verdict |
| 💡 产品机会生成器 | 每项目自动生成 ≥5 个新产品方向（名称/用户/痛点/MVP/商业模式/壁垒/难度/周期/潜力） |
| 🚀 One Person Startup | 一人创业可行性：开发要求、MVP 周期、成本、变现难度、综合评分 |
| 🔍 AI Open Source Analyst | 自然语言问答，直接查询平台数据与报告，例如「最近30天增长最快适合做副业的AI项目」 |
| 🔍 AI Open Source Analyst | 自然语言问答，直接查询平台数据与报告，例如「最近30天增长最快适合做副业的AI项目」 |
| 🎓 AI PM 学习模式 | Socratic 挑战（Beginner→Expert）+ Hidden Needs + 需求树 + JTBD + 证据驱动 + AI Before/After/Native |
| 🧩 产品拆解模式 | Product DNA 底层逻辑图 + AI 产品五层拆解模型 + PM vs 用户视角 |
| 📱 自媒体模式 | 一键生成 8 平台内容（小红书/公众号/B站/YouTube/X/LinkedIn/抖音/视频号）+ 视频脚本 + 观点注入 + Content Score |
| 💼 求职 Portfolio 模式 | Portfolio Case + Interview Me + AI PM 面试题库 + Rebuild→PRD + If I Were The PM + 产品决策日志 |
| 📈 AI PM 学习中心 | 能力雷达图 + AI PM Score + 能力缺口→项目推荐 + 30 Days AI PM Challenge + 每日任务 |
| 🗓️ 2026 Radar | Project Time Status（🆕 New / 🔥 Rising / 🚀 Active 多因子判定，不用单一时间条件）+ 场景分类系统（A-Q 17 组） |
| 🗄️ 统一数据库 + 实时同步 | 全平台（Discover / Insights / 分类 TOP 榜 / My GitHub / Watchlist）共享一个数据库：本地快照 + GitHub 实时数据按 fullName 合并去重，顶栏「实时同步」一键拉取（缓存 30 分钟），每次打开自动同步 |
| 🔓 仅开源项目 | 全平台只展示开源项目：本地快照过滤非开源 License（160 个开源项目），GitHub 实时抓取带 License 校验（OSI 许可白名单 + 查询 license 限定），非开源自动剔除；项目/榜单均显示 🔓 License 标签 |
| 👤 My GitHub 按分类展示 | 实时同步你的 Star/收藏，按一级分类分组展示，每个项目可 分析 / 逆向拆解 / 产品框图 |
| 🏗️ 产品底层逻辑架构分析 | Project DNA 14 节点 + PM Deep Analysis 15 维 + 如何搭建（五层架构/技术栈/数据流/7·14·30 天路线/复制与不复制/成本/自检清单） |
| ❓ Why AI / AI Native Test | 为什么需要 AI、降低什么成本、创造什么体验；Current / AI Enhanced / AI Native 三态重设计 |
| 👤 My GitHub | 同步 GitHub Stars → 2026 Favorites / Rising / Hidden Gems / My Project Radar + Radar vs Global + 兴趣图谱 |
| 🔒 生产级 GitHub API 数据层 | 服务端 Token（环境变量/本地文件，前端零暴露）+ Rate Limit Manager + 403/429 退避重试 + 缓存 + 请求去重 + 批量分析队列 + Health/Token 管理 API + My GitHub 集成面板 |
| 🏠 WHAT SHOULD I STUDY TODAY | 首页每日学习推荐（🔥 研究 / 🧠 补能力 / 💰 商业 / 🎬 内容 / 💼 Portfolio） |
| 🗂️ 一项目 → 七种资产 | 每项目自动生成 报告 / 学习 Case / Challenge / 观点 / 内容 / Portfolio / Interview |
| 🔬 逆向工程 Lab | 完整用户路径（15 步）+ 核心功能实现路径 + 源码架构逆向 + 代码→功能映射 + 技术选型解释 + 产品设计→技术设计映射 + MVP 逆向 + 产品决策分析 + 40 节情报报告 |
| 🧪 Evidence Mode | 每个技术实现判断标注 Confirmed / Inferred / Hypothesis / Unknown，禁止把推测写成事实 |
| 📂 分类 TOP 榜 | 30 个一级分类各自独立 TOP 榜 + 二级场景拆解（30 页） |
| 🔗 全站关联分类 TOP 榜 | 全部项目（Discover）与智能洞察（Insights）数据全部关联分类 TOP 榜，项目卡片分类标签可直达对应榜单 |
| 🎛️ 分类榜项目操作 | 每个项目支持 分析（🔗 完整链路：用户问题→需求→产品方案→功能→UX→Workflow→AI能力→数据流→技术架构→源码模块→部署→商业模式→增长→可复制性 + 40 节报告 + 全景图 + 三结论 + 技术路线主线）/ 产品框图（功能实现路径框图）/ 产品总监视角（边界考虑 / 痛点分析 / 真实案例预测） |
| 🏠 2026 Radar 首页 | 2026 HOT / RISING / FASTEST GROWING / HIDDEN GEMS + 右侧 MY AI PM SCORE |
| 📑 My Project Report | 每个收藏项目自动生成个人报告：为什么收藏/重点学什么/是否值得自媒体·Portfolio·二开 |
| 📖 Personal AI PM Curriculum | 根据能力短板自动编排 4 周个性化课程 |
| ⚖️ Compare | 2-4 项目多指标对比 + AI 最终推荐 |
| 📡 My AI Radar | Watchlist 收藏 + 智能提醒（增长/排名/商业化信号） |

## 🗺 页面

| 路由 | 作用 |
|------|------|
| `/` | Dashboard：Hero + Trending + 排行榜预览 + 分类 |
| `/discover` | Explore：搜索 / 分类 / 语言 / 排序筛选全部项目 |
| `/rankings` | 重定向到分类 TOP 榜 |
| `/rankings/[stars|growth|opportunity|money|sidehustle|skills|resume|content|new]` | 9 大榜单 |
| `/projects/[slug]` | 项目情报页：Overview / Architecture / Features / Product / Business / Growth / Opportunities / AI Report |
| `/compare` | 项目对比 + AI 最终推荐 |
| `/ask` | AI Open Source Analyst 自然语言分析 |
| `/watchlist` | My AI Radar 收藏与提醒 |
| `/insights` | 每日 AI 洞察与行动雷达 |
| `/learn` | AI PM 学习中心：能力雷达 + 30 天挑战 + 每日任务 + 能力缺口推荐 |
| `/interview` | AI PM 面试模式 + 全项目面试题库（8 类 × 72 项目） |
| `/portfolio` | My AI PM Portfolio：案例 / 决策日志 / 观点 / 内容 / 导出 |
| `/projects/[slug]` | 项目页新增 4 大模式：AI PM 学习 / 产品拆解 / 自媒体 / 求职 Portfolio |
| `/projects/[slug]#build` | 产品底层逻辑架构分析：DNA 14 节点 + 15 维拆解 + 如何搭建 + Why AI + AI Native Test |
| `/my-github` | 实时同步 GitHub Stars + 按分类分组展示（分析/逆向拆解/产品框图）+ 2026 雷达 / 兴趣图谱 / 个人报告 |
| `/add-project` | ➕ 添加 GitHub 项目：粘贴链接一键抓取仓库+源码，生成 三件套（分析/产品框图/产品总监视角）+ 全项目报告（Markdown 复制/下载），并联动全平台数据库（Discover / Insights / My GitHub / 分类榜可见） |
| `/rankings/categories` | 30 个一级分类独立 TOP 榜索引 · `/rankings/category/[id]` 含 机会/收藏/收藏增长 三榜（实时） |
| `/projects/[slug]` | 深度分析：AI Report = 40 节逆向工程报告 + 产品框图·功能实现路径 + 产品总监视角 |
| `/projects/[slug]/report` | 📄 完整报告页（打印/导出 PDF）：完整链路 + 技术路线主线 + 三结论 + 全景图 + 事实表 + 40 节报告 + 总监视角；分析面板支持 复制/下载 Markdown |

## 🚀 快速开始

```bash
cd 05-projects/14-ai-oss-intel
npm install          # 依赖（Next.js 15 / React 19 / Tailwind 4 / TypeScript strict）
npm run data:build   # 数据完整性校验（169 个项目 ALL OK ✅）
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
AI PM Learning OS (src/lib/learning.ts + src/components/learn/)
   ├─ Product DNA / 五层拆解 / Hidden Needs / 需求树 / JTBD / 证据
   ├─ Socratic Challenge (Beginner→Expert) / Interview Me / 面试题库
   ├─ 自媒体内容生成（8 平台）+ 视频脚本 + 观点注入 + Content Score
   ├─ Rebuild→PRD / If I Were The PM / 产品决策日志
   └─ 能力评估（雷达图 / AI PM Score / 缺口→项目推荐）+ localStorage 学习状态
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
- [`docs/06-ai-pm-learning-os.md`](docs/06-ai-pm-learning-os.md) — AI PM 学习与内容情报 OS（战略补充）
- [`docs/07-2026-radar-build-os.md`](docs/07-2026-radar-build-os.md) — 2026 Radar · 产品底层逻辑架构分析 · 如何搭建
- [`docs/08-reverse-engineering-os.md`](docs/08-reverse-engineering-os.md) — AI 产品逆向工程 OS · 40 节情报报告 · Evidence Mode
- [`docs/GITHUB_API_ARCHITECTURE.md`](docs/GITHUB_API_ARCHITECTURE.md) — 生产级 GitHub API Client 架构（Token/RateLimit/Retry/Cache/Queue/Health）
- [`docs/GITHUB_API_SECURITY.md`](docs/GITHUB_API_SECURITY.md) — GitHub API 安全模型（Token 零前端暴露 / 密钥审计）
- [`docs/GITHUB_API_RATE_LIMIT.md`](docs/GITHUB_API_RATE_LIMIT.md) — 限流策略 / 缓存 TTL / 批量队列 / 友好错误
- [`docs/GITHUB_API_TEST_REPORT.md`](docs/GITHUB_API_TEST_REPORT.md) — GitHub API 层测试与冒烟验证报告

## 🏗️ 工程资产

- [`CHANGELOG.md`](CHANGELOG.md) — 版本变更记录（Keep a Changelog）
- [`ROADMAP.md`](ROADMAP.md) — 版本路线图（V0.7 → V3）
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — 贡献指南（环境 / 结构 / 约定 / CI）
- [`SECURITY.md`](SECURITY.md) — 安全模型（Token 处理 / 密钥审计 / 漏洞报告）
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — CI（typecheck + tests + build）

## 🎯 产品定位

> **不是发现最多的项目，而是发现最值得用户采取行动的项目。**
> 最终进化目标：AI Open Source Opportunity OS
> `GitHub → Discover → Rank → Analyze → Understand → Compare → Find Opportunity → Generate Product → Generate PRD → Generate MVP → Build → Monetize`


## 📸 演示截图（Demo）

点击「分析」/「完整报告页」中的技术路线主线与产品全景图节点，可展开详细分析解释：

| 截图 | 说明 |
|------|------|
| [`docs/demo/01-report-chain.png`](docs/demo/01-report-chain.png) | 完整报告页 · 完整链路（用户问题→可复制性） |
| [`docs/demo/02-mainline-expanded.png`](docs/demo/02-mainline-expanded.png) | 技术路线主线 · 「用户」节点展开详细分析 |
| [`docs/demo/03-mainline-workflow.png`](docs/demo/03-mainline-workflow.png) | 技术路线主线 · 「WORKFLOW」节点展开 |
| [`docs/demo/04-panorama-expanded.png`](docs/demo/04-panorama-expanded.png) | 产品全景图 · 「USER」节点展开 |
| [`docs/demo/05-panorama-workflow.png`](docs/demo/05-panorama-workflow.png) | 产品全景图 · 「WORKFLOW」节点展开 |
| 🧑‍⚖️ 行业专家实战报告 | 每个项目新增独立「专家实战」动作：行业专家联合评审（按领域自动切换身份）+ 27 节业务向专家报告（行业背景/真实客户画像/业务场景/案例推演/JTBD/痛点 P0-P2/替代方案/价值链/核心价值/商业 ROI/付费意愿/功能价值排序/AI·Agent·Workflow 机会/竞争/开源商业化/机会矩阵/专家重设计/MVP/验证/商业化/一页纸结论/“真正解决的是什么”最终判断） |
| 🤖 AI AGENT 拆解驾驶舱 | 每个项目新增两层独立分析：REPORT A · AI AGENT PRODUCT DIRECTOR REPORT（24 节，Agent 必要性矩阵/职责边界/自主等级/人在回路/Memory/Agent 2.0）+ REPORT B · WORKFLOW REVERSE ENGINEERING REPORT（26 节，完整 Workflow/失败路径/成本/延迟/优化/Workflow 2.0）+ 可点击 AI AGENT MASTER MAP + 「一键自媒体拆解」入口 |
| ⚡ 项目 Prompt 展示/复制 | 实时（源码驱动）项目分析面板新增 Prompt 展示与复制（完整 Master Prompt）；已收录项目有独立 /prompt 页 |
| 💡 产品自问答案 | 产品全景图 / 技术路线主线 / 总监全景图的每个节点展开后，自问问题均附带项目专属答案（用户/护城河/数据/增长/时机/开源等，源码驱动版带 Evidence） |
| [`docs/demo/06-director-report.png`](docs/demo/06-director-report.png) | AI 产品总监视角：Executive Review + Verdict + 13 维评分 + 总监结论 |
