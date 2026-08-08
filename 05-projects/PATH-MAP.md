# 跨仓库路径对照（微迹 + 票迹）

> 源码仓：https://github.com/lili171819931-collab/ai-projects  
> 面试仓：https://github.com/lili171819931-collab/ai-interview-sprint

## 微迹 Weiji

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| 微迹源码 | `products/weiji-mini/` | `05-projects/ai-projects/products/weiji-mini/` |
| 完整项目文档 | （源码内 `docs/`） | `05-projects/01-weiji-product/` |
| 面试叙事 | — | `05-projects/01-weiji-product/interview-story.md` |
| 商业方案 | — | `05-projects/01-weiji-product/07-commercial-plan.md` |

## 票迹 Piaoji

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| 票迹源码（唯一） | `products/piaoji-mini/` | `05-projects/ai-projects/products/piaoji-mini/` |
| 完整项目文档 | （源码内 `docs/`） | `05-projects/06-piaoji-product/` |
| 面试叙事 | — | `05-projects/06-piaoji-product/interview-story.md` |
| 商业价值分析 | — | `05-projects/06-piaoji-product/07-commercial-plan.md` |
| 极致 Prompt（闭环） | `products/piaoji-mini/docs/` | `05-projects/06-piaoji-product/极致Prompt-产品到上线闭环.md` |
| 商业 Prompt | — | `05-projects/06-piaoji-product/极致Prompt-票迹商业价值专用版.md` |

## 规范 URL

| 资源 | URL |
|------|-----|
| AI 项目集 | https://github.com/lili171819931-collab/ai-projects |
| 微迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 票迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/piaoji-mini |
| 微迹项目文档（01） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/01-weiji-product |
| 票迹项目文档（06） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/06-piaoji-product |

## 关系图

```
ai-projects（唯一源码仓）
 ├── products/weiji-mini/     ← C 端微习惯
 └── products/piaoji-mini/    ← B 端发票报销

ai-interview-sprint
 └── 05-projects/
      ├── ai-projects/        ← Git 子模块 → ai-projects
      ├── 01-weiji-product/   ← 微迹 PRD→上线→商业
      └── 06-piaoji-product/  ← 票迹 PRD→上线→商业
```

## 相邻实验目录（非唯一源码）

| 目录 | 说明 |
|------|------|
| `04-workbuddy-invoice-reimburse/` | WorkBuddy/技能向探索 |
| `05-invoice-reimburse-web/` | Web 向实验；**可运行小程序源码以 piaoji-mini 为准** |
