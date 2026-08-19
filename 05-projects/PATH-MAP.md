# 跨仓库路径对照（微迹 + 发票报销族）

> 源码仓：https://github.com/lili171819931-collab/ai-projects  
> 面试仓：https://github.com/lili171819931-collab/ai-interview-sprint

## 微迹 Weiji

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| 微迹源码 | `products/weiji-mini/` | `05-projects/ai-projects/products/weiji-mini/` |
| 完整项目文档 | （源码内 `docs/`） | `05-projects/01-weiji-product/` |
| 商业方案 | — | `05-projects/01-weiji-product/07-commercial-plan.md` |

## 发票报销三载体

| 载体 | 本仓库路径 | 说明 |
|------|------------|------|
| WorkBuddy Skill | `05-projects/04-workbuddy-invoice-reimburse/` | Prompt/Skill 包（对话出包） |
| Web 平台「票易报」 | `05-projects/05-invoice-reimburse-web/` | Next.js 可运行 MVP（审批/导出） |
| 微信小程序「票迹」源码 | `ai-projects/products/piaoji-mini/`（子模块） | 员工侧收票/对账/HR 包 |
| 票迹项目包装+商业 | `05-projects/06-piaoji-product/` | PRD→上线→商业价值 |
| 三载体对比报告 | `05-projects/06-piaoji-product/08-trio-comparison-report.md` | Skill / Web / 小程序对照 |
| **三平台合并总览** | `05-projects/04-05-06-发票报销三平台合集.md` | **04/05/06 合并成一份：报销流程在三种平台上的实现** |
| **三平台聚合副本** | `05-projects/invoice-reimburse-trio/` | **04/05/06 复制更新后的聚合文件夹（Skill/Web/小程序）** |

## 规范 URL

| 资源 | URL |
|------|-----|
| AI 项目集 | https://github.com/lili171819931-collab/ai-projects |
| 微迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 票迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/piaoji-mini |
| AI Radar 源码（ai-projects 可选镜像） | https://github.com/lili171819931-collab/ai-projects/tree/main/products/ai-radar-dashboard |
| WorkBuddy Skill（04） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/04-workbuddy-invoice-reimburse |
| 票易报 Web（05） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/05-invoice-reimburse-web |
| 票迹项目文档（06） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/06-piaoji-product |
| 三平台合并总览（04/05/06） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/04-05-06-发票报销三平台合集.md |
| 三平台聚合副本（文件夹） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/invoice-reimburse-trio |
| 智衡 AI Radar（07 · 主交付） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/07-ai-radar-dashboard |

## AI 动态雷达（智衡）

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| **权威可运行源码 + 文档（GTI Phase 1–12）** | `products/ai-radar-dashboard/`（可选镜像） | **`05-projects/07-ai-radar-dashboard/`（主交付）** |
| 子模块路径 | — | `05-projects/ai-projects/products/ai-radar-dashboard/`（引用用，不覆盖 07） |
| 仓库融合说明 | — | `05-projects/07-ai-radar-dashboard/docs/17-repo-fusion.md` |
| GTI 架构 | — | `…/docs/16-global-trend-intelligence-architecture.md` |
| 机会简报全流程 | — | `…/docs/14-opportunity-brief-full-loop.md` |
| TrendRadar 热点融合全流程 | — | `…/docs/15-trendradar-fusion-full-loop.md` |
| Docker 一键（可选） | — | `…/docs/docker.md` |
| TrendRadar 本地用法 | — | `08-resources/TrendRadar-USAGE.md` |
| 情报研究脚本 | — | `08-resources/scrapling-examples/` |

**规范 URL（07）**：https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/07-ai-radar-dashboard

## Lily-Skills（11 · 个人 AI Skill 操作系统）

| 含义 | 路径 |
|------|------|
| 完整可运行源码 + 文档 | `05-projects/11-lily-skills/`（Next.js 15 + TS + SQLite） |
| 专家补充点 | `…/docs/00-expert-supplement.md` |
| 架构 / API / 部署 / 开发者指南 | `…/docs/01-architecture.md` `…/02-api.md` `…/03-deployment.md` `…/04-developer-guide.md` |
| DoD 验收报告 | `…/docs/05-acceptance.md` |

**规范 URL（11）**：https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/11-lily-skills

## 关系图

```
领域能力（类目 / 情景 / 合规 CoT）
 ├── 04 WorkBuddy Skill      ← 对话载体
 ├── 05 票易报 Web            ← 多用户审批系统（本仓源码）
 ├── 06 票迹 小程序           ← 员工侧闭环（源码在 ai-projects）
 └── 07 智衡 AI Radar         ← 情报看板 + GTI 事件聚类/Agent/MCP（本仓完整包，见 docs/17）
```

## AI OSS Intel（14 · 新交付）

| 含义 | 本仓库路径 | 说明 |
|------|------------|------|
| AI 开源情报平台源码+文档 | `05-projects/14-ai-oss-intel/` | Next.js 可运行：9 大榜单 / 10-Agent 共识报告 / 机会生成器 / Compare / Ask AI / Watchlist / Insights |
| 本地启动 | `cd 05-projects/14-ai-oss-intel && npm run dev` → http://localhost:3012 |
| 实时数据 | `GITHUB_TOKEN=xxx npm run github:sync` |

| 资源 | URL |
|------|-----|
| AI OSS Intel（面试仓） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/14-ai-oss-intel |
