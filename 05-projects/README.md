# 05-projects · 项目作品夹

按**项目类别**组织，面试时按这条故事链讲：

```
真实落地（微迹） → AI 功能方案（周复盘） → 最小验证（RAG Lab）
     执行力              产品判断力              评测思维
```

> 微迹同时收录于 **[AI 项目集 ai-projects](https://github.com/lili171819931-collab/ai-projects)**：`products/weiji-mini/`  
> 跨仓库路径对照：[`PATH-MAP.md`](PATH-MAP.md)

## 目录结构

```
05-projects/
├── README.md                      ← 你在这里
├── PATH-MAP.md                    ← 与 ai-projects 路径对照
├── 01-weiji-product/              ← A. 真实产品（∈ AI 项目集）
│   ├── README.md
│   ├── interview-story.md
│   └── weiji-mini/                ← Git 子模块 → 上游 weiji-mini
├── 02-ai-weekly-insight/          ← B. AI 功能主作品
│   ├── README.md / prd.md / architecture.md / metrics.md / story.md
└── 03-rag-validation-lab/         ← C. 辅作品 · 评测验证
    └── README.md / hypothesis / eval-sheet / lessons
```

## 类别速览

| 序号 | 类别 | 路径 | 面试作用 | 状态 |
|------|------|------|----------|------|
| **01** | 真实产品 | [`01-weiji-product/`](01-weiji-product/) | 证明从 0 到 1 能交付 | ✅ 已嵌入；已入 AI 项目集 |
| **02** | AI 功能方案 | [`02-ai-weekly-insight/`](02-ai-weekly-insight/) | 证明会做有边界的 AI 产品 | ✅ PRD 已完成 |
| **03** | 评测验证 Lab | [`03-rag-validation-lab/`](03-rag-validation-lab/) | 证明懂评测，不只会写文档 | ⏳ 待补黄金集练习 |

## 推荐阅读顺序（30 分钟）

1. [`01-weiji-product/README.md`](01-weiji-product/README.md) → 产品是什么  
2. [`01-weiji-product/interview-story.md`](01-weiji-product/interview-story.md) → 怎么讲微迹  
3. [`02-ai-weekly-insight/prd.md`](02-ai-weekly-insight/prd.md) → AI 加在哪、为何这样加  
4. [`02-ai-weekly-insight/story.md`](02-ai-weekly-insight/story.md) → 90 秒口述  
5. [`03-rag-validation-lab/README.md`](03-rag-validation-lab/README.md) → 如何用评测证明学会了

## 克隆含子模块

```bash
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
# 若已克隆：
git submodule update --init --recursive
```

浏览产品全集（含微迹）：

```bash
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-projects.git
```
