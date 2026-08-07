# 跨仓库路径对照（微迹已迁入 AI 项目集）

> 项目集 / 源码仓：https://github.com/lili171819931-collab/ai-projects  
> **原独立仓库 `weiji-mini` 已删除**；微迹唯一路径为 `ai-projects/products/weiji-mini/`

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| 微迹源码 | `products/weiji-mini/` | `05-projects/ai-projects/products/weiji-mini/` |
| 微迹面试叙事 | — | `05-projects/01-weiji-product/interview-story.md` |
| AI 周复盘 | — | `05-projects/02-ai-weekly-insight/` |
| 评测 Lab | — | `05-projects/03-rag-validation-lab/` |

## 规范 URL

| 资源 | URL |
|------|-----|
| AI 项目集 | https://github.com/lili171819931-collab/ai-projects |
| 微迹（唯一） | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 本仓内微迹（经子模块） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/ai-projects/products/weiji-mini |

## 关系图

```
ai-projects（唯一源码仓）
 └── products/weiji-mini/

ai-interview-sprint
 └── 05-projects/ai-projects/   ← Git 子模块 → ai-projects
      └── products/weiji-mini/
 └── 05-projects/01-weiji-product/  ← 仅面试叙事文档
```
