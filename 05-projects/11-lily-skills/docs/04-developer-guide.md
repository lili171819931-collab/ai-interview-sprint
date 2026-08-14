# 开发者指南 —— 如何新增一个 Skill

> 目标：未来完全不了解本项目的人，也能在 10 分钟内把一个新能力接入 Lily-Skills，
> 并立即被分类、搜索、Agent 发现和调用。

## 一、Skill 包结构

在项目根目录新建一个目录：

```text
skills/my-skill/
├── skill.json     # Skill Manifest（标准元数据）
└── adapter.ts     # 执行逻辑（纯函数，零框架依赖）
```

## 二、skill.json 字段

```json
{
  "name": "My Skill",
  "version": "1.0.0",
  "description": "一句话描述这个能力",
  "category": "Productivity",
  "tags": ["my", "skill"],
  "icon": "🧩",
  "execution_type": "local",
  "risk_level": "low",
  "permissions": ["read"],
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "required": true, "description": "查询内容" }
    },
    "required": ["query"]
  },
  "output_schema": { "type": "object", "properties": {} },
  "ai_description": "给 Agent 看的说明：什么时候用、什么时候不用",
  "use_cases": ["场景1", "场景2"],
  "examples": ["示例输入"]
}
```

| 字段 | 说明 |
|---|---|
| `execution_type` | `local`（adapter.ts）/ `echo` / `http`（endpoint）/ `cli`（command）/ `composite`（组合） |
| `risk_level` | `low` 自动执行；`medium` 敏感能力需审批；`high/critical` 必须审批 |
| `permissions` | `read/write/external_api/file/browser/social_media/email/database/payment/network` |

## 三、adapter.ts（local 类型）

```ts
export async function execute(input, ctx) {
  const query = String(input.query ?? "");
  return { result: `你搜索了: ${query}` };
}
```

- 不需要 `import` 任何框架
- `input` 是经过 Schema 校验后的参数对象
- 返回对象会被序列化为 JSON 结果
- 抛错会进入失败恢复链路（重试 → 备选 → 提示用户）

### 协议（进阶）

平台用子进程运行你的 adapter：

```text
stdin:  { "input": {...}, "skillId": "...", "executionId": "...", "trigger": "manual" }
stdout: { "ok": true, "output": {...} } | { "ok": false, "error": "..." }
```

任何语言（Python / Node / Shell）只要实现这个 JSON-over-stdio 协议，
把入口文件命名为 `adapter.ts`（或改执行类型为 `cli` 指向命令）即可接入。

## 四、非 local 类型快速接入

- **echo**：无需 adapter，返回输入本身（调试/测试用）
- **http / api**：`endpoint` 指向 URL，平台 POST JSON 调用
- **cli**：`command` 模板 + `{{key}}` 占位符
- **composite**：`config.steps` 组合多个 Skill，支持 `{{input.x}}`、`{{step0.x}}`、`{{prev.x}}`

## 五、注册

```bash
npm run skills:scan        # 自动扫描 skills/ 目录
# 或在 Developer Center → 自动扫描 页面点击
```

注册后平台自动完成：
1. 建/改分类（按名称 find-or-create）
2. 自动打 Tag
3. 记录版本
4. 建立搜索索引（关键词 + 语义）
5. 加入 Agent Tool Registry

> 无需开发任何页面、无需修改 Agent 核心代码。

## 六、最佳实践

- `ai_description` 写清楚「何时用 / 何时不用」，Agent 推荐质量直接依赖它
- `input_schema` 尽量精确（required / enum / min-max），执行前会强校验
- 敏感能力（发邮件/发布/写文件）务必设 `high/critical`，让审批门禁生效
- 用 `examples` 提供示例输入，便于 Agent 构建参数

## 七、测试你的 Skill

```bash
# 用 Developer Center → 测试控制台 选择 Skill 直接执行
# 或
curl -X POST http://localhost:3210/api/skills/<skill_id>/execute \
  -H "Content-Type: application/json" \
  -d '{"input": {"query": "hello"}, "skipApproval": true}'
```

## 八、测试与质量

```bash
npm run typecheck   # TS 严格检查
npm test            # Vitest 单测 + 集成
npm run test:e2e    # 全链路 E2E（会重置数据库）
```

新增 Skill 后建议至少跑一次 `npm test`（注册/搜索/执行测试会自动覆盖到你的 Skill）。
