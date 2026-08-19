# Invoice Reimburse Trio · 发票报销三平台合集

> 同一个报销领域能力（费用类目 · 情景模式 · 合规思维链），在三种不同平台上实现报销流程：
> **04 WorkBuddy Skill（对话出包）** · **05 票易报 Web（审批系统）** · **06 票迹微信小程序（员工收票闭环）**

本文件夹是 04 / 05 / 06 三个项目的**聚合副本**（复制自 `05-projects/` 下的最新更新版本），便于把三平台报销流程作为一个整体查看、演示与分享。

## 入口

| 文件 | 说明 |
|------|------|
| [`04-05-06-发票报销三平台合集.md`](04-05-06-发票报销三平台合集.md) | **先读这里**：三平台合并总览（共享领域模型 → 全流程对照 → 各平台详解 → 对比矩阵 → 商业方案） |

## 结构（三个平台的完整项目）

| 平台 | 子目录 | 载体 | 角色 |
|------|--------|------|------|
| 04 | [`04-workbuddy-invoice-reimburse/`](04-workbuddy-invoice-reimburse/) | WorkBuddy Skill / Prompt | 对话整理票据 → 输出报销包 |
| 05 | [`05-invoice-reimburse-web/`](05-invoice-reimburse-web/) | Next.js Web「票易报」 | 多用户单据 + 审批 + 导出 + 留痕 |
| 06 | [`06-piaoji-product/`](06-piaoji-product/) | 微信小程序「票迹」 | 员工收票 → 对账 → 合规 → HR 报销包 |

> 子目录内的相对链接（如 04 ↔ 05 ↔ 06 互指、三平台合集）在本文件夹内均可直接解析。
> 「票迹」可运行源码仍以仓库子模块为准：`05-projects/ai-projects/products/piaoji-mini/`（本文件夹仅含 06 的产品/设计/商业文档）。

## 快速体验

```bash
# 05 Web（审批系统）
cd 05-invoice-reimburse-web
cp .env.example .env && npm install && npm run setup && npm run dev
# → http://localhost:3000（报销人 lili@demo.com / 审批人 manager@demo.com，密码 demo123）

# 06 小程序：微信开发者工具打开 ../../ai-projects/products/piaoji-mini
# 04 Skill：把 04-workbuddy-invoice-reimburse 下的 SKILL.md / 极致Prompt 导入 WorkBuddy
```

## 与 05-projects 根目录的关系

| 本文件夹 | 根目录原项目 |
|----------|--------------|
| `invoice-reimburse-trio/` | [`../04-workbuddy-invoice-reimburse/`](../04-workbuddy-invoice-reimburse/) · [`../05-invoice-reimburse-web/`](../05-invoice-reimburse-web/) · [`../06-piaoji-product/`](../06-piaoji-product/) |

面试一句：**领域能力一次建模，Skill / Web / 小程序三载体交付**；本文件夹即三载体的聚合入口。
