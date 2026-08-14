# Lily-Skills 系统架构

## 1. 定位

Lily-Skills 是一个 **Personal AI Skill Operating System**：
让用户用自然语言描述目标，系统自动完成「意图理解 → Skill 发现 → 推荐 → 规划 → 编排执行 → 沉淀历史 → 自我优化」。

第一性原理：**Skill 是能力，Agent 是大脑，Platform 是操作系统**。三者不写死、可独立扩展。

## 2. 总体架构

```text
                    Lily-Skills OS (Next.js App Router + SQLite)
                         │
              ┌──────────▼──────────┐
              │      AI Agent       │  AgentBrain (agent/agent.ts)
              └──────────┬──────────┘
                         │
                Agent Orchestrator   执行计划 / 失败恢复 / 备选
                         │
              ┌──────────▼──────────┐
              │  Skill Discovery    │  search.ts + recommendation.ts
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │    Skill Registry   │  skill-registry.ts (manifest 自动注册)
              └──────────┬──────────┘
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
  Local Skill        API/HTTP Skill     CLI Skill
  (adapter.ts)       (endpoint)         (command)
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                  Execution Engine
              （审批门禁 → 校验 → 执行 → 重试 → 日志 → 统计）
                         │
              ┌──────────▼──────────┐
              │   Result / Logs     │   execution / audit / usage_stats
              └──────────┬──────────┘
                         ▼
                   Workflow Engine     编排多节点（skill/ai/condition/approval…）
                         │
                  Knowledge Layer      Analytics / 推荐偏好
                         │
                  Personal AI OS
```

## 3. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js 15 (App Router) | 全栈一体、Route Handlers、SSR/CSR 灵活 |
| 语言 | TypeScript 5 (strict) | 强类型、全链路类型安全 |
| 样式 | Tailwind CSS v4 + 自定义 Dark 设计系统 | 快速构建 premium 暗色 UI |
| 数据库 | SQLite (`node:sqlite` 内置) | 零依赖、本地优先、单文件、事务 |
| 校验 | 自研轻量 JSON-Schema validator | 无额外依赖、可控 |
| 搜索 | TF-IDF + 中文 Bigram + Cosine | 离线可用、可升级向量库 |
| 测试 | Vitest + supertest + 自研 E2E | 单测/集成/E2E 全覆盖 |
| 脚本 | tsx | 直接运行 TS 脚本（seed/scan/reset） |

## 4. 模块划分（Modular Monolith）

```text
src/
├── app/                  # Next.js 表现层（页面 + API routes）
│   ├── api/              # REST API（skills/agent/workflows/executions/analytics…）
│   ├── agent/            # AI Agent Workspace 页面
│   ├── skills/           # Skills 列表 + 详情
│   ├── workflows/        # 工作流列表 + Builder
│   ├── executions/       # 执行中心
│   ├── analytics/        # 分析
│   └── developer/        # 开发者中心
├── lib/
│   ├── db/               # SQLite 连接 + Schema（18 张表）
│   ├── core/             # 领域层（不依赖 Next.js，可独立复用）
│   │   ├── skill-registry.ts    # 注册 / 扫描 / 分类 / Tag / 版本
│   │   ├── search.ts            # 混合检索
│   │   ├── recommendation.ts    # 推荐引擎
│   │   ├── execution-engine.ts  # 执行引擎（审批/校验/重试/统计/健康）
│   │   ├── adapters/            # local/http/cli/echo/composite 适配器
│   │   ├── agent/               # AgentBrain（意图/计划/执行/恢复）
│   │   ├── workflow-engine.ts   # 工作流引擎
│   │   ├── permissions.ts       # 风险与权限策略
│   │   ├── analytics.ts         # 指标
│   │   └── schema-validator.ts  # JSON Schema 校验
│   └── skill-sdk/         # Skill 作者 SDK（adapter runner 协议）
├── components/           # UI 组件（AppShell / ui primitives）
skills/                   # Skill 包（skill.json + adapter.ts），运行时自动注册
tests/                    # unit / integration / e2e
scripts/                  # db-reset / seed / scan
docs/                     # 本文档体系
```

## 5. 核心设计

### 5.1 Skill 标准（Manifest + Adapter 协议）

每个 Skill 是一个目录：

```text
skills/<name>/
├── skill.json     # Manifest：元数据 + 输入输出 Schema + 权限 + 风险
└── adapter.ts     # 纯函数 execute(input, ctx)，零框架依赖
```

执行协议：Execution Engine 通过 `node src/lib/skill-sdk/runner.ts <adapter>` 以子进程方式运行，
stdin 传入 `{ input, skillId, executionId, trigger }`，stdout 返回 `{ ok, output }` 或 `{ ok:false, error }`。
→ **任何语言只要遵守 JSON-over-stdio 协议即可接入平台。**

### 5.2 自动接入闭环

```text
新增 skills/<name>/skill.json + adapter.ts
        ↓
POST /api/skills/scan（或启动时自动扫描）
        ↓
解析 Manifest → 自动分类（find-or-create）→ 自动打 Tag → 建版本 → 建搜索索引
        ↓
自动进入 Agent Tool Registry（无需改 Agent 代码）
        ↓
立即可搜索 / 可执行 / 可被 Agent 推荐
```

### 5.3 执行引擎状态机

```text
queued → (风险/权限检查) → awaiting_approval ──approve──> running → completed
   └──────────────────────────────────────────→ running ──失败──> retry(≤2) ──> failed
```

执行后自动更新：`usage_count / success_count / failure_count / last_used_at / health_status / usage_stats / audit_logs`。

### 5.4 Agent 能力分层

| 层级 | 实现 |
|---|---|
| L1 对话 | agent_sessions / agent_messages |
| L2 意图理解 | 关键词 + 中文 Bigram + 实体/动作/分类识别 |
| L3 Skill 推荐 | 语义 + 使用率 + 成功率 + 新鲜度 + 收藏 |
| L4 任务规划 | 按「研究 → 创作 → 报告」链构建多步骤计划 |
| L5 执行 | Execution Engine（审批门禁） |
| L6 多 Skill 编排 | 顺序执行 + 结果传递 |
| L7 自适应恢复 | 瞬时错误重试 + 备选 Skill（按备选 Schema 重建输入） |
| L8 工作流生成 | Workflow Builder + 组合 Skill |
| L9 个性化 | 推荐历史 + 采纳率沉淀（usage_stats.ai_accepted_count） |
| L10 自主优化 | 健康监控降权（health_status → 推荐权重） |

### 5.5 检索架构（防 Tool Explosion）

```text
User Intent
   ↓
Intent Parser（分类/动作/实体）
   ↓
Keyword 检索 + Semantic 检索（TF-IDF+Bigram+Cosine）+ 元数据过滤 + 使用加权
   ↓
Top-K Skills（只加载这些 Skill 的 Schema 给 Agent）
   ↓
Agent 选择与执行
```

未来升级路径（V3）：Embedding → 向量库 → Reranker → 知识图谱，均只需替换 `search.ts` 内部实现。

## 6. 数据库（18 张表）

users, skills, skill_versions, skill_categories, skill_tags, skill_tag_map, skill_dependencies,
skill_permissions, skill_executions, skill_usage_stats, workflows, workflow_nodes, workflow_runs,
agent_sessions, agent_messages, agent_plans, agent_tool_calls, recommendations, favorites,
audit_logs, system_settings

（完整 DDL 见 `src/lib/db/schema.ts`）

## 7. 扩展路线

| 阶段 | 内容 |
|---|---|
| MVP（已交付） | Dashboard / Registry / 分类 / 搜索 / 详情 / 注册 / Agent / 推荐 / 单 Skill 执行 / 执行日志 |
| V2 | 语义搜索增强（向量）、Skill Import 多源、权限系统细化、Skill 自动包装器、Analytics 深化 |
| V3 | Skill Graph、个人偏好模型、自主工作流生成、健康监控告警、多 Agent、插件市场 |

架构已为 V2/V3 预留：Adapter 协议（多语言）、模块化单体（可拆分微服务）、
检索抽象（可换向量库）、审批/权限模型（可扩展双人审批与租户隔离）。
