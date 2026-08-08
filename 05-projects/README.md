# 05-projects · 项目作品夹

按**项目类别**组织，面试时按这条故事链讲：

```
真实落地闭环（微迹） → AI 功能方案（周复盘） → 最小验证（RAG Lab）
     执行力+上线力           产品判断力              评测思维
```

> 微迹源码唯一位置：**[AI 项目集](https://github.com/lili171819931-collab/ai-projects)** → `products/weiji-mini/`  
> 微迹完整项目文档（产品→上线）：[`01-weiji-product/`](01-weiji-product/)  
> 本仓源码引用：`05-projects/ai-projects/products/weiji-mini/`（子模块）  
> 跨仓对照：[`PATH-MAP.md`](PATH-MAP.md)

## 目录结构

```
05-projects/
├── README.md
├── PATH-MAP.md
├── ai-projects/                   ← Git 子模块（含微迹源码）
│   └── products/weiji-mini/
├── 01-weiji-product/              ← A. 微迹完整项目（PRD→上线+面试）
├── 02-ai-weekly-insight/          ← B. AI 功能主作品
├── 03-rag-validation-lab/         ← C. 评测验证 Lab
├── 04-workbuddy-invoice-reimburse/
└── 05-invoice-reimburse-web/
```

## 类别速览

| 序号 | 类别 | 路径 | 面试作用 | 状态 |
|------|------|------|----------|------|
| **源码** | AI 项目集子模块 | [`ai-projects/`](ai-projects/) | 可运行微迹 | ✅ |
| **01** | 真实产品完整闭环 | [`01-weiji-product/`](01-weiji-product/) | 设计→上线怎么讲 | ✅ |
| **02** | AI 功能方案 | [`02-ai-weekly-insight/`](02-ai-weekly-insight/) | 有边界的 AI 产品 | ✅ |
| **03** | 评测验证 Lab | [`03-rag-validation-lab/`](03-rag-validation-lab/) | 评测思维 | ⏳ |

## 推荐阅读顺序（40 分钟）

1. [`01-weiji-product/README.md`](01-weiji-product/README.md) → 完整项目地图  
2. [`ai-projects/products/weiji-mini/README.md`](ai-projects/products/weiji-mini/README.md) → 跑起来  
3. [`01-weiji-product/05-ops-local-to-online.md`](01-weiji-product/05-ops-local-to-online.md) → 上线闭环  
4. [`01-weiji-product/interview-story.md`](01-weiji-product/interview-story.md) → 怎么讲  
5. [`02-ai-weekly-insight/prd.md`](02-ai-weekly-insight/prd.md) → AI 加在哪  

## 克隆含子模块

```bash
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
# 若已克隆：
git submodule update --init --recursive
```

只跑微迹产品：

```bash
git clone https://github.com/lili171819931-collab/ai-projects.git
# 微信开发者工具打开：ai-projects/products/weiji-mini
```
