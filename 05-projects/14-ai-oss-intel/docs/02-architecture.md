# 系统架构 · Information Architecture / Agent / API / Data

## 1. 信息架构
```text
GitHub 数据源
  → 项目发现系统（GitHub Collector / Seed）
  → 项目分类系统（30 类多标签）
  → 数据清洗
  → Growth Analytics（7/30/90 天）
  → AI Agent 深度分析（10-Agent Consensus）
  → 项目评分系统（AI Project Score）
  → 排行榜（9 大榜单）
  → 项目详情页
  → 商业机会分析（Opportunity Generator）
  → 用户行动建议（Recommended Actions）
```

## 2. 10-Agent 架构
| Agent | 职责 |
|-------|------|
| 01 Discovery | 搜索/获取项目、Trending、Stars、Growth |
| 02 Classification | 自动分类、打标签 |
| 03 Repository Analysis | 结构、代码、README、依赖、架构 |
| 04 Product Analysis | 用户、需求、功能、产品逻辑 |
| 05 Business Analysis | 商业模式、机会、变现路径 |
| 06 Growth | Star/贡献者/社区活跃度、趋势检测 |
| 07 Startup | 二次开发、SaaS、副业、创业机会 |
| 08 Content | 自媒体/视频/小红书/YouTube 选题 |
| 09 Portfolio | 简历价值、面试价值、技术展示 |
| 10 Chief | Multi-Agent Consensus，输出 Project Intelligence Report |

> V1 实现为确定性规则引擎（`src/lib/reports.ts`），通过 `src/lib/ai/provider` 抽象可替换为真实 LLM。

## 3. API 架构（数据层）
- `src/lib/store.ts` — 读模型：`discoverProjects` / `topBy` / `projectBySlug` / `relatedProjects`
- `src/lib/engines.ts` — 纯函数：`computeScores` / `growthRate` / `rankProjects`
- `src/lib/reports.ts` — `generateReport(project) → ProjectReport`
- `src/lib/query.ts` — `answerQuery(text) → QueryAnswer`
- `scripts/sync-github.ts` — GitHub REST API 采集 → `data/github-snapshot.json`

数据源 Adapter 预留：Hugging Face / Product Hunt / Reddit / Hacker News / npm / PyPI / AI Directory。

## 4. 评分算法
```text
AI Project Score =
  Popularity×10% + Growth×15% + Innovation×15% + Product×15%
  + Demand×10% + Commercial×15% + Ecosystem×10% + PersonalDev×10%

Opportunity Score =
  Growth×25% + Demand×20% + Commercial×20% + Innovation×15%
  + Ecosystem×10% + LowCompetition×10%

专项分：Technical / Product / Growth / Commercial / SideHustle / Skill / Resume / Content / Startup / Money / Health
```
