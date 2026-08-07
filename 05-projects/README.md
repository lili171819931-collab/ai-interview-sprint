# 05-projects · 项目作品夹

按**项目类别**组织，面试时按这条故事链讲：

```
真实落地（微迹） → AI 功能方案（周复盘） → 最小验证（RAG Lab） → B 端 AI 报销（票易报）
     执行力              产品判断力              评测思维              系统闭环 + AI 边界
```

> 微迹源码唯一位置：**[AI 项目集](https://github.com/lili171819931-collab/ai-projects)** → `products/weiji-mini/`  
> 本仓通过子模块引用：`05-projects/ai-projects/products/weiji-mini/`  
> 跨仓对照：[`PATH-MAP.md`](PATH-MAP.md)

## 目录结构

```
05-projects/
├── README.md
├── PATH-MAP.md
├── ai-projects/                         ← Git 子模块（含微迹源码）
├── 01-weiji-product/                    ← A. 微迹面试叙事
├── 02-ai-weekly-insight/                ← B. AI 功能主作品
├── 03-rag-validation-lab/               ← C. 评测验证 Lab
├── 04-workbuddy-invoice-reimburse/      ← D1. 报销 Agent Skill / 极致 Prompt
└── 05-invoice-reimburse-web/            ← D2. 票易报 Web MVP（可运行 + 产品文档）
```

## 类别速览

| 序号 | 类别 | 路径 | 面试作用 | 状态 |
|------|------|------|----------|------|
| **源码** | AI 项目集子模块 | [`ai-projects/`](ai-projects/) | 可运行微迹 | ✅ |
| **01** | 真实产品叙事 | [`01-weiji-product/`](01-weiji-product/) | 怎么讲微迹 | ✅ |
| **02** | AI 功能方案 | [`02-ai-weekly-insight/`](02-ai-weekly-insight/) | 有边界的 AI 产品 | ✅ |
| **03** | 评测验证 Lab | [`03-rag-validation-lab/`](03-rag-validation-lab/) | 评测思维 | ⏳ |
| **04** | 办公 Agent Skill | [`04-workbuddy-invoice-reimburse/`](04-workbuddy-invoice-reimburse/) | Prompt/Skill 设计 | ✅ |
| **05** | B 端报销 Web | [`05-invoice-reimburse-web/`](05-invoice-reimburse-web/) | 可运行系统 + PRD | ✅ |

## 推荐阅读顺序（40 分钟）

1. [`ai-projects/products/weiji-mini/README.md`](ai-projects/products/weiji-mini/README.md) → 产品是什么  
2. [`01-weiji-product/interview-story.md`](01-weiji-product/interview-story.md) → 怎么讲微迹  
3. [`02-ai-weekly-insight/prd.md`](02-ai-weekly-insight/prd.md) → AI 加在哪  
4. [`03-rag-validation-lab/README.md`](03-rag-validation-lab/README.md) → 评测练习  
5. [`05-invoice-reimburse-web/docs/story.md`](05-invoice-reimburse-web/docs/story.md) → B 端 AI 系统口述  
6. [`05-invoice-reimburse-web/README.md`](05-invoice-reimburse-web/README.md) → 跑起来看演示  

## 克隆含子模块

```bash
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
# 若已克隆：
git submodule update --init --recursive
```

跑票易报：

```bash
cd 05-projects/05-invoice-reimburse-web
npm install && npm run setup && npm run dev
```
