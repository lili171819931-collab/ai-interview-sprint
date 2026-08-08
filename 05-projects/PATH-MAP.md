# 跨仓库路径对照（微迹完整项目）

> 源码仓：https://github.com/lili171819931-collab/ai-projects  
> 面试仓：https://github.com/lili171819931-collab/ai-interview-sprint  
> 微迹**唯一源码路径**：`ai-projects/products/weiji-mini/`  
> 微迹**完整项目文档**：`ai-interview-sprint/05-projects/01-weiji-product/`

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| 微迹源码 | `products/weiji-mini/` | `05-projects/ai-projects/products/weiji-mini/` |
| 产品→上线完整文档 | （源码内 `docs/` 运维向） | `05-projects/01-weiji-product/` |
| 面试叙事 | — | `05-projects/01-weiji-product/interview-story.md` |
| 极致 Prompt（闭环） | `products/weiji-mini/docs/` | `05-projects/01-weiji-product/极致Prompt-产品到上线闭环.md` |
| AI 周复盘 | — | `05-projects/02-ai-weekly-insight/` |
| 评测 Lab | — | `05-projects/03-rag-validation-lab/` |

## 规范 URL

| 资源 | URL |
|------|-----|
| AI 项目集 | https://github.com/lili171819931-collab/ai-projects |
| 微迹源码（唯一） | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 本仓内微迹源码（子模块） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/ai-projects/products/weiji-mini |
| 完整项目文档（01） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/01-weiji-product |

## 关系图

```
ai-projects（唯一源码仓）
 └── products/weiji-mini/          ← 可运行小程序 + docs/

ai-interview-sprint
 └── 05-projects/
      ├── ai-projects/             ← Git 子模块 → ai-projects
      │    └── products/weiji-mini/
      └── 01-weiji-product/        ← PRD→上线闭环 + 面试叙事（无源码副本）
```
