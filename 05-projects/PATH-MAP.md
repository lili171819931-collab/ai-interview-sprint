# 跨仓库路径对照（与 AI 项目集同步）

> 项目集入口：https://github.com/lili171819931-collab/ai-projects  
> 权威对照也可看项目集内：https://github.com/lili171819931-collab/ai-projects/blob/main/docs/path-map.md

| 含义 | AI 项目集 `ai-projects` | 上游独立仓 | 本仓库 `ai-interview-sprint` |
|------|-------------------------|------------|------------------------------|
| 微迹源码 | `products/weiji-mini/` | [weiji-mini](https://github.com/lili171819931-collab/weiji-mini) 根目录 | `05-projects/01-weiji-product/weiji-mini/` |
| 微迹面试叙事 | — | 产品 README/docs | `05-projects/01-weiji-product/interview-story.md` |
| AI 周复盘 | — | — | `05-projects/02-ai-weekly-insight/` |
| 评测 Lab | — | — | `05-projects/03-rag-validation-lab/` |

## 规范 URL

| 资源 | URL |
|------|-----|
| AI 项目集 | https://github.com/lili171819931-collab/ai-projects |
| 微迹（项目集内） | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 微迹（上游源码） | https://github.com/lili171819931-collab/weiji-mini |
| 本仓库内微迹 | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/01-weiji-product/weiji-mini |

## 关系图

```
ai-projects（AI 项目集入口）
 └── products/weiji-mini ──submodule──► weiji-mini（源码真相）
                                            ▲
ai-interview-sprint                         │
 └── 05-projects/01-weiji-product/weiji-mini ┘ 同一上游子模块
```
