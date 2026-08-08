# 跨仓库路径对照（微迹 + 发票报销族）

> 源码仓：https://github.com/lili171819931-collab/ai-projects  
> 面试仓：https://github.com/lili171819931-collab/ai-interview-sprint

## 微迹 Weiji

| 含义 | ai-projects | 本仓库 ai-interview-sprint |
|------|-------------|----------------------------|
| 微迹源码 | `products/weiji-mini/` | `05-projects/ai-projects/products/weiji-mini/` |
| 完整项目文档 | （源码内 `docs/`） | `05-projects/01-weiji-product/` |
| 商业方案 | — | `05-projects/01-weiji-product/07-commercial-plan.md` |

## 发票报销三载体

| 载体 | 本仓库路径 | 说明 |
|------|------------|------|
| WorkBuddy Skill | `05-projects/04-workbuddy-invoice-reimburse/` | Prompt/Skill 包（对话出包） |
| Web 平台「票易报」 | `05-projects/05-invoice-reimburse-web/` | Next.js 可运行 MVP（审批/导出） |
| 微信小程序「票迹」源码 | `ai-projects/products/piaoji-mini/`（子模块） | 员工侧收票/对账/HR 包 |
| 票迹项目包装+商业 | `05-projects/06-piaoji-product/` | PRD→上线→商业价值 |
| 三载体对比报告 | `05-projects/06-piaoji-product/08-trio-comparison-report.md` | Skill / Web / 小程序对照 |

## 规范 URL

| 资源 | URL |
|------|-----|
| AI 项目集 | https://github.com/lili171819931-collab/ai-projects |
| 微迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 票迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/piaoji-mini |
| WorkBuddy Skill（04） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/04-workbuddy-invoice-reimburse |
| 票易报 Web（05） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/05-invoice-reimburse-web |
| 票迹项目文档（06） | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/06-piaoji-product |

## 关系图

```
领域能力（类目 / 情景 / 合规 CoT）
 ├── 04 WorkBuddy Skill      ← 对话载体
 ├── 05 票易报 Web            ← 多用户审批系统（本仓源码）
 └── 06 票迹 小程序           ← 员工侧闭环（源码在 ai-projects）
```
