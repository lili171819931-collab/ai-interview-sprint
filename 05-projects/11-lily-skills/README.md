# Lily-Skills · Personal AI Skill Operating System

> **Lily 的个人 AI 能力操作系统** —— 不再记住「哪个 Skill 在哪里」，
> 只需要告诉 AI Agent「我想完成什么」，系统自动找到、组合并执行正确的能力。

![status](https://img.shields.io/badge/status-MVP%20%E5%8F%AF%E8%BF%90%E8%A1%8C-green)
![tests](https://img.shields.io/badge/tests-23%20unit%20%2B%2026%20e2e-blue)
![stack](https://img.shields.io/badge/stack-Next.js%2015%20%2B%20TypeScript%20%2B%20SQLite-purple)

## 这是什么

Lily-Skills 是一个从 0 到 1 构建的 **个人 AI Skill 集成与智能调用平台**，围绕以下闭环设计：

```text
用户自然语言需求 → AI Agent（意图理解/规划）→ Skill Discovery（搜索/推荐）
→ Skill Orchestrator（多 Skill 编排）→ Execution（执行/结果）
→ Knowledge/History（沉淀）→ 使用数据优化推荐
```

核心承诺（第一性原理）：
- **Skill 是能力**：标准化 `skill.json + adapter.ts`，任何能力 10 分钟接入
- **Agent 是大脑**：理解需求 → 发现 → 推荐 → 规划 → 执行 → 恢复
- **Platform 是操作系统**：注册/分类/搜索/权限/审批/统计/健康，全部自动化

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3210
```

首次启动自动建库 + 注册 12 个内置 Skill + 创建演示工作流。无需任何外部服务。

## 功能总览

| 模块 | 能力 |
|---|---|
| 🏠 Dashboard | Agent 主入口、Quick Actions、AI 推荐、最近活动、收藏 |
| 🤖 AI Agent | 意图理解、Skill 推荐（含原因）、任务规划、多 Skill 执行、失败恢复 |
| 🧩 Skills | 卡片/列表视图、分类、Tag、语义搜索、详情、直接运行 |
| 🔄 Workflows | 可视化 Builder（skill/ai/condition/approval 节点）、运行、审批、历史 |
| ⚡ Execution Center | 全部执行记录、日志、审批/取消 |
| 📊 Analytics | 成功率、耗时、Top Skills、14 天趋势、推荐采纳率 |
| 🛠️ Developer Center | 创建 Skill、Manifest 导入、测试控制台、自动扫描 |

## 一键体验（推荐）

```bash
npm run build && npm start
# 浏览器打开 http://localhost:3210
# 在首页输入：帮我分析 TikTok 上 AI Agent 的热点并生成 5 个选题
# Agent 会自动推荐 Skill → 生成计划 → 确认执行
```

## Skill 接入（开发者 10 分钟上手）

```text
skills/my-skill/
├── skill.json     # Manifest（分类/Tags/Schema/权限/风险）
└── adapter.ts     # execute(input) 纯函数，零框架依赖
```

```bash
npm run skills:scan     # 自动注册：分类 / Tag / 搜索索引 / Agent Tool Registry
```

详细说明见 [`docs/04-developer-guide.md`](docs/04-developer-guide.md)。

## 测试

```bash
npm run typecheck   # TS strict
npm test            # 23 个单元/集成测试
npm run test:e2e    # 26 项全链路 E2E（真实 HTTP + 审批 + Agent + Workflow）
```

## 文档

| 文档 | 说明 |
|---|---|
| [`docs/00-expert-supplement.md`](docs/00-expert-supplement.md) | **专家补充点**：安全/可靠性/可观测性/测试/成本/合规等被忽略的关键问题 |
| [`docs/01-architecture.md`](docs/01-architecture.md) | 系统架构与设计决策 |
| [`docs/02-api.md`](docs/02-api.md) | REST API 文档 |
| [`docs/03-deployment.md`](docs/03-deployment.md) | 部署与环境变量 |
| [`docs/04-developer-guide.md`](docs/04-developer-guide.md) | 开发者指南（新增 Skill） |
| [`docs/05-acceptance.md`](docs/05-acceptance.md) | DoD 验收报告 |

## 技术栈

Next.js 15 (App Router) · TypeScript 5 · Tailwind CSS v4 · SQLite (`node:sqlite`) ·
Vitest · 自研 Adapter Runner（JSON-over-stdio 子进程协议）

## 路线图

- **MVP（已交付）**：Dashboard / Registry / 分类 / 语义搜索 / 详情 / 注册 / Agent / 推荐 / 执行 / 日志 / Workflow 基础 / 权限 / Analytics / Developer Center / 测试 / 文档
- **V2**：向量检索、Skill 多源导入、定时工作流、权限细化、容器沙箱
- **V3**：Skill Graph、个人偏好模型、自主工作流生成、多 Agent、插件市场

架构已为 V2/V3 预留（模块化单体 + Adapter 协议 + 检索抽象），详见 [`docs/01-architecture.md`](docs/01-architecture.md)。

## 演示数据说明

内置 Skill 中 `Trend Scanner` 等使用本地离线数据源（`source: offline-demo`），
用于演示完整的「注册 → 检索 → 推荐 → 执行 → 日志」链路；
接入真实 API 只需把执行类型改为 `http` 并配置 endpoint。
