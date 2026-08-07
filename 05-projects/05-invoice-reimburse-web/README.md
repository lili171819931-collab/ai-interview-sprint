# 05 · 票易报 · 发票报销 Web 平台

> 独立项目作品：可运行 Web MVP + 完整产品文档  
> 定位：把散落的发票变成一张财务愿意批的报销单

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

## 项目结构

```
05-invoice-reimburse-web/
├── README.md                 ← 本文件
├── docs/
│   ├── prd.md                ← 产品需求
│   ├── architecture.md       ← 架构
│   ├── metrics.md            ← 指标与闸门
│   ├── user-journey.md       ← 用户旅程
│   ├── competitive-analysis.md
│   ├── story.md              ← 面试口述
│   ├── 演示脚本.md
│   ├── 验收清单.md
│   └── 极致Prompt-发票报销Web平台从0到1.md
├── src/                      ← Next.js 应用
├── prisma/                   ← Schema + Seed
└── tests/                    ← 合规单测
```

## 产品文档阅读顺序（20 分钟）

1. [`docs/story.md`](docs/story.md) — 90 秒怎么讲  
2. [`docs/prd.md`](docs/prd.md) — 做不做、做什么  
3. [`docs/user-journey.md`](docs/user-journey.md) — 谁怎么用  
4. [`docs/architecture.md`](docs/architecture.md) — 如何可信  
5. [`docs/competitive-analysis.md`](docs/competitive-analysis.md) — 和费控/WorkBuddy/Cursor 的关系  
6. [`docs/metrics.md`](docs/metrics.md) — 如何证明有效  

## 已实现能力

- 报销单创建（情景模式 A/B/C/D/F）
- 上传发票 Mock OCR + 手动录入
- 类目归类、去重、金额勾稽、合规分桶
- 提交 / 审批 / 驳回重提
- 导出 CSV 与审批摘要
- 种子演示数据（酒店超标、招待人均、小票拒报）

## 同源资产

WorkBuddy Skill / 极致 Prompt：  
[`../04-workbuddy-invoice-reimburse/`](../04-workbuddy-invoice-reimburse/)

## 技术栈

Next.js 15 · TypeScript · Prisma · SQLite · Tailwind CSS 4 · Vitest
