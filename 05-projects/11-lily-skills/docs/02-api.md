# Lily-Skills REST API

Base URL：`http://localhost:3210`

所有接口返回 JSON。错误格式：`{ "error": "...", "ok": false }`。

## Skills

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/skills` | 列表（支持 `q / categoryId / tag / status / executionType / favorite / sort / limit / offset`） |
| POST | `/api/skills` | 以 Manifest 创建 Skill |
| GET | `/api/skills/:id` | 详情（含分类/Tags/权限/依赖） |
| PUT | `/api/skills/:id` | 更新 |
| DELETE | `/api/skills/:id` | 删除 |
| POST | `/api/skills/:id/execute` | 执行（body: `{ input, skipApproval }`） |
| POST | `/api/skills/register` | Manifest 注册（upsert） |
| POST | `/api/skills/scan` | 扫描 `skills/` 目录自动注册 |

**示例：注册一个 Skill**

```bash
curl -X POST http://localhost:3210/api/skills/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Skill",
    "version": "1.0.0",
    "description": "…",
    "category": "Productivity",
    "tags": ["my"],
    "execution_type": "echo",
    "input_schema": { "type": "object", "properties": { "message": { "type": "string", "required": true } }, "required": ["message"] },
    "permissions": ["read"],
    "risk_level": "low"
  }'
```

**示例：执行 Skill**

```bash
curl -X POST http://localhost:3210/api/skills/<skill_id>/execute \
  -H "Content-Type: application/json" \
  -d '{"input": {"expression": "(2+3)*6"}, "skipApproval": true}'
```

## Categories / Tags / Search

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/categories` | 分类列表（动态分类体系） |
| POST | `/api/categories` | 新增分类 |
| GET | `/api/tags` | Tag 列表（按使用量排序） |
| GET | `/api/search?q=...` | 混合检索（语义 + 关键词），返回 Top-K + 匹配词 |

## AI Agent

| Method | Path | 说明 |
|---|---|---|
| POST | `/api/agent/chat` | 对话：`{ sessionId?, message, autoExecute? }` → 理解 + 推荐 + 计划 |
| POST | `/api/agent/plan` | 仅生成计划 |
| POST | `/api/agent/execute` | 执行计划：`{ planId }` |
| POST | `/api/agent/resume` | 审批后继续：`{ planId }` |
| GET | `/api/agent/sessions` | 会话列表 |
| GET | `/api/agent/sessions/:id/messages` | 会话消息 |

**示例：Agent 对话**

```bash
curl -X POST http://localhost:3210/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "帮我分析 TikTok 上 AI Agent 的热点并生成 3 个选题"}'
```

返回 `plan.recommendations[]`（含 reasons）与 `plan.steps[]`；执行计划：
`POST /api/agent/execute {"planId": "<plan.id>"}`。

## Executions（执行中心）

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/executions?status=&limit=` | 执行记录列表 |
| GET | `/api/executions/:id` | 单条记录（含日志） |
| POST | `/api/executions/:id/approve` | 批准待审批执行 |
| POST | `/api/executions/:id/cancel` | 取消执行 |

## Workflows

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/workflows` | 列表（含节点） |
| POST | `/api/workflows` | 创建 |
| GET | `/api/workflows/:id` | 详情 |
| PUT | `/api/workflows/:id` | 更新（含 nodes） |
| DELETE | `/api/workflows/:id` | 删除 |
| POST | `/api/workflows/:id/run` | 运行：`{ input }` |
| GET | `/api/workflow-runs` | 运行记录 |
| POST | `/api/workflow-runs/:id/approve` | 审批后继续 |

**节点类型**：`trigger / skill / ai / condition / loop / transform / input / output / webhook / human_approval`

- `skill`：`config.skill_id` + `config.input`（支持 `{{input.x}}` / `{{output.node.x}}` 模板）
- `condition`：`config.field / op / value / branches[{when,to}]`
- `human_approval`：`config.message`，运行暂停为 `awaiting_approval`
- `ai`：`config.query`，自动检索并执行 Top-1 Skill

## Analytics / Misc

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/analytics` | 平台指标（成功率/耗时/Top Skills/趋势/推荐采纳率） |
| POST | `/api/favorites` | 收藏/取消：`{ skillId }` |
| GET | `/api/status` | 健康检查 |
