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

## 规范 URL

| 资源 | URL |
|------|-----|
| AI 项目集 | https://github.com/lili171819931-collab/ai-projects |
| 微迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 票迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/piaoji-mini |
| AI Radar 源码（ai-projects） | https://github.com/lili171819931-collab/ai-projects/tree/main/products/ai-radar-dashboard |
| WorkBuddy Skill（04） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/04-workbuddy-invoice-reimburse |
| 票易报 Web（05） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/05-invoice-reimburse-web |
| 票迹项目文档（06） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/06-piaoji-product |
| 智衡 AI Radar（07） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/07-ai-radar-dashboard |
| Mac 教学录屏（08） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/08-mac-screen-cam-recorder |

## AI 动态雷达（智衡）

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| 可运行源码 + 完整文档 | `products/ai-radar-dashboard/` | `05-projects/07-ai-radar-dashboard/`（同步副本） |
| 子模块路径 | — | `05-projects/ai-projects/products/ai-radar-dashboard/` |
| 机会简报全流程 | — | `05-projects/07-ai-radar-dashboard/docs/14-opportunity-brief-full-loop.md` |
| TrendRadar 热点融合全流程 | — | `05-projects/07-ai-radar-dashboard/docs/15-trendradar-fusion-full-loop.md` |
| TrendRadar 本地用法 | — | `08-resources/TrendRadar-USAGE.md` |
| 情报研究脚本 | — | `08-resources/scrapling-examples/` |

## Mac 教学录屏（Screen Cam）

| 含义 | 本仓库路径 |
|------|------------|
| 可运行源码 + 全生命周期文档 | `05-projects/08-mac-screen-cam-recorder/` |
| 全流程导航 | `05-projects/08-mac-screen-cam-recorder/docs/12-full-project-loop.md` |
| 调研 / 竞品 | `docs/market-research.md` · `docs/competitive-analysis.md` |

## 关系图

```
领域能力（类目 / 情景 / 合规 CoT）
 ├── 04 WorkBuddy Skill      ← 对话载体
 ├── 05 票易报 Web            ← 多用户审批系统（本仓源码）
 ├── 06 票迹 小程序           ← 员工侧闭环（源码在 ai-projects）
 ├── 07 智衡 AI Radar         ← 情报看板 + 热点融合 + 机会简报（本仓完整包）
 └── 08 Mac Screen Cam       ← 本地教学录屏（调研→成片→文档闭环）
```
