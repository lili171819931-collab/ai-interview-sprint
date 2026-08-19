# 05 · 票易报 · 发票报销 Web 平台

> 独立项目作品：**可运行 Web MVP** + 完整产品文档  
> 定位：把散落的发票变成一张财务愿意批的报销单  
> 品牌（Web）：票易报 · 与微信小程序「票迹」同域不同载体

## 在作品集中的位置

| 项目 | 载体 | 作用 |
|------|------|------|
| [`04-workbuddy-invoice-reimburse`](../04-workbuddy-invoice-reimburse/) | WorkBuddy Skill | 对话式快速出报销包 |
| **05（本目录）** | Next.js Web | 多用户单据 + 审批 + 导出 + 留痕 |
| [`06-piaoji-product`](../06-piaoji-product/) + [`piaoji-mini`](../ai-projects/products/piaoji-mini/) | 微信小程序 | 员工侧收票/对账/HR 包；含商业价值分析 |
| [**04/05/06 三平台合集**](../04-05-06-发票报销三平台合集.md) | 合并文档 | 同一报销流程在 Skill / Web / 小程序三平台的实现对照 |

面试一句：领域能力（类目/情景/合规 CoT）一次建模，**Skill / Web / 小程序** 三载体交付。

---

## 快速开始

```bash
cd 05-projects/05-invoice-reimburse-web
cp .env.example .env
npm install
npm run setup    # prisma generate + db push + seed
npm run dev
```

打开 http://localhost:3000  

| 角色 | 账号 | 密码 |
|------|------|------|
| 报销人 | `lili@demo.com` | `demo123` |
| 审批人 | `manager@demo.com` | `demo123` |

可选：`npm test` 跑合规单测。

---

## 项目结构

```
05-invoice-reimburse-web/
├── README.md
├── docs/                     ← PRD / 架构 / 指标 / 旅程 / 竞品 / 口述
├── src/                      ← Next.js App Router
├── prisma/                   ← Schema + Seed
├── tests/                    ← 合规单测
├── Dockerfile / vercel.json / render.yaml  ← 部署示意
└── package.json
```

## 产品文档阅读顺序（20 分钟）

1. [`docs/story.md`](docs/story.md) — 90 秒怎么讲  
2. [`docs/prd.md`](docs/prd.md) — 做不做、做什么  
3. [`docs/user-journey.md`](docs/user-journey.md) — 谁怎么用  
4. [`docs/architecture.md`](docs/architecture.md) — 如何可信  
5. [`docs/competitive-analysis.md`](docs/competitive-analysis.md) — 和费控/WorkBuddy 的关系  
6. [`docs/metrics.md`](docs/metrics.md) — 如何证明有效  

## 已实现能力

- 报销单创建（情景模式）
- 上传发票 Mock OCR + 手动录入
- 类目归类、去重、金额勾稽、合规分桶
- 提交 / 审批 / 驳回重提
- 导出 CSV 与审批摘要
- 种子演示数据（酒店超标、招待人均、小票拒报）

## 技术栈

Next.js 15 · TypeScript · Prisma · SQLite · Tailwind CSS 4 · Vitest

## 安全说明

- 不提交 `.env` / `node_modules` / `.next` / `*.db`  
- 演示账号仅本地；生产需换密钥与鉴权
