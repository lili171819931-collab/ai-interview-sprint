# 05-projects · 项目作品夹

按**项目类别**组织，面试时按这条故事链讲：

```
真实落地（微迹） → AI 功能方案（周复盘） → 最小验证（RAG Lab）
     执行力              产品判断力              评测思维
```

> 微迹源码唯一位置：**[AI 项目集](https://github.com/lili171819931-collab/ai-projects)** → `products/weiji-mini/`  
> 本仓通过子模块引用：`05-projects/ai-projects/products/weiji-mini/`  
> 跨仓对照：[`PATH-MAP.md`](PATH-MAP.md)

## 目录结构

```
05-projects/
├── README.md
├── PATH-MAP.md
├── ai-projects/                   ← Git 子模块（含微迹源码）
│   └── products/weiji-mini/
├── 01-weiji-product/              ← A. 微迹面试叙事（无源码副本）
│   ├── README.md
│   └── interview-story.md
├── 02-ai-weekly-insight/          ← B. AI 功能主作品
└── 03-rag-validation-lab/         ← C. 评测验证 Lab
```

## 类别速览

| 序号 | 类别 | 路径 | 面试作用 | 状态 |
|------|------|------|----------|------|
| **源码** | AI 项目集子模块 | [`ai-projects/`](ai-projects/) | 可运行微迹 | ✅ |
| **01** | 真实产品叙事 | [`01-weiji-product/`](01-weiji-product/) | 怎么讲微迹 | ✅ |
| **02** | AI 功能方案 | [`02-ai-weekly-insight/`](02-ai-weekly-insight/) | 有边界的 AI 产品 | ✅ |
| **03** | 评测验证 Lab | [`03-rag-validation-lab/`](03-rag-validation-lab/) | 评测思维 | ⏳ |

## 推荐阅读顺序（30 分钟）

1. [`ai-projects/products/weiji-mini/README.md`](ai-projects/products/weiji-mini/README.md) → 产品是什么  
2. [`01-weiji-product/interview-story.md`](01-weiji-product/interview-story.md) → 怎么讲微迹  
3. [`02-ai-weekly-insight/prd.md`](02-ai-weekly-insight/prd.md) → AI 加在哪  
4. [`02-ai-weekly-insight/story.md`](02-ai-weekly-insight/story.md) → 90 秒口述  
5. [`03-rag-validation-lab/README.md`](03-rag-validation-lab/README.md) → 评测练习

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
