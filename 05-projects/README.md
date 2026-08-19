# 05-projects · 项目作品夹

按**项目类别**组织，面试时按这条故事链讲：

```
真实落地闭环（微迹 C 端） → 发票报销闭环（票迹 B 端） → AI 功能方案 → 最小验证
     执行力+上线力              流程/合规/商业付费           产品判断力      评测思维
```

> 源码唯一位置：**[AI 项目集](https://github.com/lili171819931-collab/ai-projects)** → `products/`  
> 本仓源码引用：`05-projects/ai-projects/`（子模块）  
> 跨仓对照：[`PATH-MAP.md`](PATH-MAP.md)

## 目录结构

```
05-projects/
├── README.md
├── PATH-MAP.md
├── ai-projects/                   ← Git 子模块（含微迹 + 票迹源码）
│   └── products/
│       ├── weiji-mini/
│       └── piaoji-mini/
├── 01-weiji-product/              ← A. 微迹完整项目（PRD→上线+商业+面试）
├── 02-ai-weekly-insight/          ← B. AI 功能主作品
├── 03-rag-validation-lab/         ← C. 评测验证 Lab
├── 04-workbuddy-invoice-reimburse/← 发票报销 · WorkBuddy Skill 载体
├── 04-05-06-发票报销三平台合集.md ← 04/05/06 三平台合并总览（同域三载体）
├── 05-invoice-reimburse-web/      ← 发票报销 · Web「票易报」可运行 MVP
├── 06-piaoji-product/             ← 发票报销 · 微信「票迹」包装+商业
├── 07-ai-radar-dashboard/         ← 智衡 AI Radar（源码+文档完整包 · GTI）
├── 09-goal-compiler/             ← Goal Compiler（目标编译）
├── 10-creatoros-platform/        ← CreatorOS 平台
└── 11-lily-skills/               ← Lily-Skills（个人 AI Skill 操作系统）
```

## 类别速览

| 序号 | 类别 | 路径 | 面试作用 | 状态 |
|------|------|------|----------|------|
| **源码** | AI 项目集子模块 | [`ai-projects/`](ai-projects/) | 可运行微迹/票迹/雷达 | ✅ |
| **01** | C 端真实产品闭环 | [`01-weiji-product/`](01-weiji-product/) | 设计→上线怎么讲 | ✅ |
| **02** | AI 功能方案 | [`02-ai-weekly-insight/`](02-ai-weekly-insight/) | 有边界的 AI 产品 | ✅ |
| **03** | 评测验证 Lab | [`03-rag-validation-lab/`](03-rag-validation-lab/) | 评测思维 | ⏳ |
| **04** | 发票 · Skill 载体 | [`04-workbuddy-invoice-reimburse/`](04-workbuddy-invoice-reimburse/) | 领域 Prompt/Skill | ✅ |
| **05** | 发票 · Web 载体 | [`05-invoice-reimburse-web/`](05-invoice-reimburse-web/) | 可运行审批系统 | ✅ |
| **06** | 发票 · 小程序+商业 | [`06-piaoji-product/`](06-piaoji-product/) | 合规交付物+付费叙事 | ✅ |
| **07** | AI 情报看板闭环 | [`07-ai-radar-dashboard/`](07-ai-radar-dashboard/) | 日更+GTI 事件聚类+Agent/MCP+简报推送 | ✅ |
| **11** | 个人 AI Skill 操作系统 | [`11-lily-skills/`](11-lily-skills/) | Skill 注册/检索/Agent/Workflow/权限/分析全闭环 | ✅ |

## 推荐阅读顺序（60 分钟）

0. [`04-05-06-发票报销三平台合集.md`](04-05-06-发票报销三平台合集.md) → 发票报销三平台合并总览
1. [`01-weiji-product/README.md`](01-weiji-product/README.md) → C 端闭环  
2. [`05-invoice-reimburse-web/README.md`](05-invoice-reimburse-web/README.md) → Web 跑通审批  
3. [`06-piaoji-product/README.md`](06-piaoji-product/README.md) → 小程序闭环  
4. [`06-piaoji-product/07-commercial-plan.md`](06-piaoji-product/07-commercial-plan.md) → 商业价值  
5. [`04-workbuddy-invoice-reimburse/README.md`](04-workbuddy-invoice-reimburse/README.md) → Skill 对照  
6. [`02-ai-weekly-insight/prd.md`](02-ai-weekly-insight/prd.md) → AI 加在哪  
7. [`07-ai-radar-dashboard/README.md`](07-ai-radar-dashboard/README.md) → 情报看板日更与 GTI  
7b. [`07-ai-radar-dashboard/docs/16-global-trend-intelligence-architecture.md`](07-ai-radar-dashboard/docs/16-global-trend-intelligence-architecture.md) → 全网热点情报架构  
7c. [`07-ai-radar-dashboard/docs/17-repo-fusion.md`](07-ai-radar-dashboard/docs/17-repo-fusion.md) → 与 GitHub / ai-projects 融合说明  
8. [`07-ai-radar-dashboard/docs/14-opportunity-brief-full-loop.md`](07-ai-radar-dashboard/docs/14-opportunity-brief-full-loop.md) → 机会简报项目制全流程  
9. [`07-ai-radar-dashboard/docs/15-trendradar-fusion-full-loop.md`](07-ai-radar-dashboard/docs/15-trendradar-fusion-full-loop.md) → TrendRadar 热点融合全流程  
10. [`../08-resources/scrapling-examples/README.md`](../08-resources/scrapling-examples/README.md) → 情报研究前置脚本
11. [`11-lily-skills/README.md`](11-lily-skills/README.md) → 个人 AI Skill 操作系统（Agent 自动找 Skill 并执行）

## 克隆含子模块

```bash
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
# 若已克隆：
git submodule update --init --recursive
```

只跑产品源码：

```bash
git clone https://github.com/lili171819931-collab/ai-projects.git
# 微信开发者工具打开：
#   ai-projects/products/weiji-mini
#   ai-projects/products/piaoji-mini
```

## 参考源与开源致谢（各作品 README）

本作品夹内的可运行项目，凡学习了外部开源 / 公开产品方法，均在对应 README 中列出**项目链接、作者与致谢**。请优先阅读：

| 作品 | 致谢文档 |
|------|----------|
| 智衡 AI Radar | [`07-ai-radar-dashboard/README.md`](07-ai-radar-dashboard/README.md) · [`docs/CREDITS.md`](07-ai-radar-dashboard/docs/CREDITS.md) |
| Goal Compiler | [`09-goal-compiler/README.md`](09-goal-compiler/README.md) |
| Scrapling 研究脚本 | [`../08-resources/scrapling-examples/README.md`](../08-resources/scrapling-examples/README.md) |

原则：**署名归原创者；改造与演示责任在本仓；遵守上游许可（尤其 BuilderPulse CC BY-NC、AIHOT 非商业条款）。**
