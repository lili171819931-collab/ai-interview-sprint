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
├── 05-invoice-reimburse-web/      ← 发票报销 · Web「票易报」可运行 MVP
├── 06-piaoji-product/             ← 发票报销 · 微信「票迹」包装+商业
└── 07-ai-radar-dashboard/         ← 智衡 AI Radar（源码+文档完整包）
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
| **07** | AI 情报看板闭环 | [`07-ai-radar-dashboard/`](07-ai-radar-dashboard/) | 日更数据+对比+来源可追溯+热点融合+机会简报 | ✅ |

## 推荐阅读顺序（60 分钟）

1. [`01-weiji-product/README.md`](01-weiji-product/README.md) → C 端闭环  
2. [`05-invoice-reimburse-web/README.md`](05-invoice-reimburse-web/README.md) → Web 跑通审批  
3. [`06-piaoji-product/README.md`](06-piaoji-product/README.md) → 小程序闭环  
4. [`06-piaoji-product/07-commercial-plan.md`](06-piaoji-product/07-commercial-plan.md) → 商业价值  
5. [`04-workbuddy-invoice-reimburse/README.md`](04-workbuddy-invoice-reimburse/README.md) → Skill 对照  
6. [`02-ai-weekly-insight/prd.md`](02-ai-weekly-insight/prd.md) → AI 加在哪  
7. [`07-ai-radar-dashboard/README.md`](07-ai-radar-dashboard/README.md) → 情报看板日更与来源报告  
8. [`07-ai-radar-dashboard/docs/14-opportunity-brief-full-loop.md`](07-ai-radar-dashboard/docs/14-opportunity-brief-full-loop.md) → 机会简报项目制全流程  
9. [`07-ai-radar-dashboard/docs/15-trendradar-fusion-full-loop.md`](07-ai-radar-dashboard/docs/15-trendradar-fusion-full-loop.md) → TrendRadar 热点融合全流程  
9. [`../08-resources/scrapling-examples/README.md`](../08-resources/scrapling-examples/README.md) → 情报研究前置脚本

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
