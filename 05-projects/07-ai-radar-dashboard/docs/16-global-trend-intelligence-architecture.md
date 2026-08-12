# Global Trend Intelligence · 架构与演进方案（Phase 1）

> 状态：**Phase 1 已确认 · Phase 2 SourceAdapter 已落地**  
> 基线项目：`05-projects/07-ai-radar-dashboard`（智衡 AI Radar）  
> 诉求 Prompt：[`极致Prompt-全网热点情报系统.md`](./极致Prompt-全网热点情报系统.md)  
> 更新日期：2026-08-12

### 已确认决策（2026-08-12）

| # | 选择 |
|---|------|
| D1 | A 情报为主，工具目录次级 |
| D2 | A Next.js + tsx |
| D3 | A MVP 先规则聚类 |
| D4 | A 品牌仍为智衡 AI Radar |
| D5 | A RSSHub → `http://127.0.0.1:1200` |
| D6 | A 单用户 `data/user-interests.json` |
| D7 | 从 Phase 2 开始编码 |

### Phase 2 交付

- `src/lib/intel/{types,schema,id}.ts`
- `scripts/adapters/{types,registry,trendradar,global-hot,rsshub}.ts`
- `scripts/pipeline/ingest.ts` → `npm run intel:ingest`
- 产物：`data/items/latest.json`

### Phase 8–12 摘要

- Agent：`/ask` + `POST /api/agent/ask`
- MCP：`npm run mcp:intel`
- 简报/推送：`/briefs` · 可选飞书/通用 webhook
- QA：`npm run intel:qa`
- Docker（可选）：[`docs/docker.md`](./docker.md)

---

## 0. 需求摘要（As-Is → To-Be）

| 维度 | 当前（As-Is） | 目标（To-Be） |
|------|---------------|---------------|
| 定位 | AI 工具/平台看板 + 日更雷达 + 热点融合演示 | **个人全球热点情报系统**（5～10 分钟掌握核心变化） |
| 数据 | JSON 文件快照、脚本拉取 | 可插拔 SourceAdapter + 持久化事件库 |
| 处理 | 平台榜单并列展示 | URL/相似度/Embedding **事件聚类** |
| 评分 | 工具七维 + 简单热度字段 | **TrendScore**（Heat×Velocity×CrossPlatform×Authority×Recency×UserRelevance） |
| AI | 机会简报 / 雷达摘要（偏规则+模板） | What/Why/Who/Impact/Trend/Confidence + 引用来源 |
| 交互 | Dashboard 多页 | Dashboard + Agent 问答 + MCP |
| 部署 | `npm run dev` 或 Docker Compose（可选） | 见 `docs/docker.md` |

**不变的护栏（继承本项目）：**

- 仅合法公开源；禁止绕过登录/验证码/访问控制
- 不自动改写工具七维评分（工具目录能力可保留）
- API Key 仅环境变量；校验失败不覆盖昨日快照

---

## 1. 完整系统架构

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation (Next.js)                       │
│  / 今日全球热点 │ /events/[id] │ /trends │ /briefs │ /ask │ /settings │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST / RSC
┌───────────────────────────────▼─────────────────────────────────┐
│                    API Gateway (Next Route Handlers)             │
│  /api/trends /api/events /api/search /api/briefs /api/agent      │
│  /api/mcp/*  (或独立 MCP server 进程)                             │
└───────┬───────────────────────────────┬─────────────────────────┘
        │                               │
┌───────▼────────┐              ┌───────▼────────┐
│ Trend Agent    │              │ Brief Generator│
│ tools:*        │              │ daily/weekly   │
└───────┬────────┘              └───────┬────────┘
        │                               │
┌───────▼───────────────────────────────▼─────────────────────────┐
│                     Intelligence Core (TypeScript first)         │
│  Normalize → Dedup → Cluster → Score → Classify → Analyze        │
└───────┬───────────────────────────────┬─────────────────────────┘
        │                               │
┌───────▼────────┐              ┌───────▼────────────────────────┐
│ Source Adapters│              │ Store                           │
│ TrendRadar     │              │ Phase A: JSON + SQLite          │
│ RSSHub         │              │ Phase B: Postgres+pgvector+Redis│
│ RSS/Atom       │              └─────────────────────────────────┘
│ Agent Reach    │
│ GitHub/arXiv…  │
└────────────────┘
```

**演进策略（推荐）：在现有 Next.js 单体上渐进增强，而不是立刻拆 FastAPI。**

| 阶段 | 运行时 | 存储 |
|------|--------|------|
| MVP（Phase 2–7） | Next.js + tsx scripts（与现网一致） | `data/*.json` + 可选 `data/intel.sqlite` |
| Scale（Phase 8–12） | 可选抽出 `services/intel-worker`（Python/FastAPI） | Postgres + Redis + pgvector |

理由：本机此前无 Docker；仓库已有完整日更/归档/热点链路；先把「事件聚类 + TrendScore + 简报」做对，再上重基建。

---

## 2. 目标目录结构（演进后）

在现有结构上增量，不推倒重来：

```text
07-ai-radar-dashboard/
├── docs/
│   ├── 16-global-trend-intelligence-architecture.md  ← 本文件
│   └── 极致Prompt-全网热点情报系统.md
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 演进为「今日全球热点」总览
│   │   ├── events/[id]/page.tsx     # 事件详情（新增）
│   │   ├── trends/page.tsx          # Emerging…Fading 雷达（新增）
│   │   ├── briefs/page.tsx          # 日/周/领域简报（新增）
│   │   ├── ask/page.tsx             # Trend Agent UI（新增）
│   │   ├── hot/ · radar/ · pulse/ · history/ · tools/ …（保留）
│   │   └── api/
│   │       ├── refresh/
│   │       ├── trends/ · events/ · briefs/ · agent/（新增）
│   ├── components/
│   ├── lib/
│   │   ├── intel/
│   │   │   ├── types.ts             # Item / Event / TrendScore
│   │   │   ├── schema.ts
│   │   │   ├── score.ts
│   │   │   ├── cluster.ts
│   │   │   └── analyze.ts
│   │   └── …（现有 radar/trendradar/hot）
│   └── data/
│       └── user-interests.ts        # 个性化关注领域
├── scripts/
│   ├── adapters/                    # SourceAdapter 插件
│   │   ├── types.ts
│   │   ├── trendradar.ts
│   │   ├── rsshub.ts
│   │   ├── rss.ts
│   │   ├── github-trending.ts
│   │   └── registry.ts
│   ├── pipeline/
│   │   ├── ingest.ts
│   │   ├── cluster-events.ts
│   │   ├── score-events.ts
│   │   └── generate-briefs.ts
│   └── daily-refresh.ts             # 扩展接入 pipeline
├── mcp/                             # Phase 9
│   └── server.ts
├── data/
│   ├── events/                      # 事件快照（MVP）
│   ├── briefs/
│   └── archive/
└── docker-compose.yml               # Phase 12（可选）
```

---

## 3. 数据库 / 存储 Schema

### 3.1 标准 Item（所有源 normalize 后）

```json
{
  "id": "sha1(platform+url|title)",
  "source": "rsshub:weibo/search/hot",
  "platform": "weibo",
  "title": "",
  "url": "",
  "author": "",
  "published_at": "ISO-8601",
  "fetched_at": "ISO-8601",
  "category": "ai|tech|business|…",
  "keywords": [],
  "summary": "",
  "raw_content": "",
  "engagement": { "rank": 1, "hot": 120000, "comments": null },
  "rank": 1,
  "source_reliability": 0.7,
  "language": "zh",
  "country": "CN",
  "entities": [{ "name": "OpenAI", "type": "org" }],
  "embedding": null
}
```

### 3.2 Event（聚类后）

```json
{
  "id": "evt_…",
  "representative_title": "",
  "related_items": ["item_id…"],
  "platforms": ["weibo", "zhihu", "reuters"],
  "countries": ["CN", "US"],
  "first_seen": "",
  "last_seen": "",
  "source_count": 12,
  "platform_count": 6,
  "heat_score": 92,
  "velocity": 0.48,
  "trend_status": "rising|hot|emerging|stable|cooling|fading",
  "categories": ["ai"],
  "analysis": {
    "one_liner": "",
    "what": "",
    "why": "",
    "who": [],
    "impact": "",
    "trend": "",
    "confidence": 0.0,
    "sources": [{ "title": "", "url": "", "platform": "" }]
  },
  "user_relevance": 0.0
}
```

### 3.3 MVP 存储

| 表/文件 | 用途 |
|---------|------|
| `data/items/YYYY-MM-DD.jsonl` | 当日原始 Item |
| `data/events/latest.json` | 最新事件榜 |
| `data/briefs/daily-YYYY-MM-DD.json` | 日简报 |
| `data/archive/…` | 沿用现有归档 |
| （可选）`data/intel.sqlite` | items / events / embeddings |

### 3.4 Phase B（Postgres）

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL,
  category TEXT,
  payload JSONB NOT NULL,
  embedding vector(1536)
);
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  representative_title TEXT NOT NULL,
  heat_score REAL,
  velocity REAL,
  trend_status TEXT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  analysis JSONB,
  payload JSONB NOT NULL
);
CREATE TABLE event_items (
  event_id TEXT REFERENCES events(id),
  item_id TEXT REFERENCES items(id),
  PRIMARY KEY (event_id, item_id)
);
CREATE TABLE user_interests (
  user_id TEXT PRIMARY KEY,
  categories TEXT[],
  keywords TEXT[],
  updated_at TIMESTAMPTZ
);
```

---

## 4. API 设计（MVP）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/trends?window=24h&region=global&category=ai` | 热点事件列表（已聚类） |
| GET | `/api/events/:id` | 事件详情 + 跨平台文章 + AI 分析 |
| GET | `/api/search?q=` | 全文/关键词搜索 |
| GET | `/api/briefs/daily?date=` | 今日全球热点简报 |
| GET | `/api/briefs/category/:cat` | 领域简报 |
| GET | `/api/radar/stages` | Emerging…Fading |
| POST | `/api/agent/ask` | `{ question }` → 结构化回答 + 引用 |
| POST | `/api/refresh?mode=full\|quick\|hot\|intel` | 扩展日更（兼容现有） |
| GET | `/api/health` | 源健康度 |

响应统一：

```json
{ "ok": true, "generatedAt": "", "data": {}, "meta": { "source": "live|cache|seed" } }
```

---

## 5. SourceAdapter 设计

```ts
interface SourceAdapter {
  id: string;
  meta: { platform: string; country: string; reliability: number; kind: "rss"|"api"|"html"|"db" };
  fetch(ctx: FetchContext): Promise<RawPayload>;
  normalize(raw: RawPayload): Promise<Item[]>;
  validate(items: Item[]): Item[];
  // deduplicate 可在 adapter 内做「源内去重」，跨源去重在 pipeline
  getMetadata(): AdapterMetadata;
}
```

### 5.1 第一阶段接入优先级（复用现有）

| Adapter | 实现路径 | 状态 |
|---------|----------|------|
| `trendradar` | `scripts/sync-trendradar.ts` → 包一层 | ✅ 已有数据 |
| `global-hot` / Agent Reach | `scripts/sync-global-hot-topics.ts` | ✅ 已有 |
| `rss` / live-sources | `scripts/live-sources.ts` + `lib/feeds.ts` | ✅ 已有 |
| `rsshub` | 本机 `http://127.0.0.1:1200` | 🟡 已装 RSSHub，待接 adapter |
| `builder-pulse` | `sync-builder-pulse.ts` | ✅ 机会简报，不进事件主链亦可 |
| `github-trending` | 新增（公开页/Atom） | ⬜ |
| `hn` / `arxiv` | RSS | ⬜ |
| X/Reddit/YouTube | 仅官方/RSSHub 合法路由；无凭证则降级 | ⬜ |

**明确不做：** 破解登录、滑块、Cookie 盗用、反爬对抗。

---

## 6. 去重 / 聚类 / 评分（算法纲要）

### 6.1 去重层次

1. **URL canonical**（去 tracking 参数）
2. **标题规范化**（大小写、标点、繁简可选）+ Jaccard / edit distance
3. **实体重叠**（公司/产品名）
4. **Embedding cosine**（同 24–48h 窗口，阈值 ≥ 0.82 可调）
5. **人工黑名单/合并规则**（配置文件）

### 6.2 TrendScore

```text
TrendScore =
  Heat            # 归一化互动/排名
× Velocity        # dHeat/dt（爆发识别）
× CrossPlatform   # 1 + log(platform_count)
× SourceAuthority # 权威源加权（Reuters/官方 > 社区）
× Recency         # 时间衰减
× UserRelevance   # 与用户关注领域匹配
```

`trend_status` 映射：

| 状态 | 规则（示意） |
|------|----------------|
| emerging | heat 低 + velocity 高 |
| rising | velocity > 阈值 |
| hot | heat 高 + 多平台 |
| stable | heat 中高 + velocity ≈ 0 |
| cooling | velocity 负且持续 |
| fading | heat 低 + 持续降温 |

### 6.3 AI 分析契约

每个 Top 事件输出 What/Why/Who/Impact/Trend/Confidence；  
`sources[]` **只能**来自 `related_items` 的真实 URL——禁止编造。

无 LLM Key 时：模板摘要 + `confidence` 下调 + 标注 `analysisMode: heuristic`。

---

## 7. AI Agent 架构

```text
User Question
  → Intent Router（trends|event|compare|report|advice）
  → Tool Calls
      search_news / get_trending_topics / get_event
      compare_period / compare_regions / compare_platforms
      analyze_topic / generate_report
  → Grounded Answer（强制附 sources）
```

实现选项：

- **MVP：** Next.js `/api/agent/ask` + 本地工具函数（读 `events/latest.json`）
- **后期：** 独立 Agent 运行时；通过 MCP 暴露给 Cursor/Claude

### MCP Tools（Phase 9）

`get_latest_trends` · `search_trends` · `get_topic_detail` · `compare_trends` ·  
`get_platform_trends` · `get_category_trends` · `get_fastest_rising` ·  
`generate_daily_report` · `generate_weekly_report`（周报为今日+period 近似）

```bash
npm run mcp:intel          # stdio MCP
npx tsx mcp/smoke.ts       # 冒烟：listTools + get_latest_trends
```

Cursor `mcp.json` 示例（绝对路径按本机改）：

```json
{
  "mcpServers": {
    "ai-radar-intel": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/Users/YOU/Projects/ai-interview-sprint/05-projects/07-ai-radar-dashboard"
    }
  }
}
```

### Phase 8 交付

- `src/lib/intel/agent-tools.ts` · `agent.ts`
- `POST /api/agent/ask` · 页面 `/ask`
- 意图路由 + 工具调用（无需 LLM 即可答）；可选 `INTEL_LLM_URL` 润色
- Sources 仅来自事件真实链接

样例问题：今天全球AI发生了什么？ / 对比中国和美国AI热点 / 增长最快的AI话题

### Phase 9 交付

- `mcp/server.ts` 暴露上表工具（复用 `agent-tools`）
- `mcp/smoke.ts` 冒烟
- 依赖：`@modelcontextprotocol/sdk`

### Phase 10 交付

- `npm run intel:briefs` → `data/briefs/latest.json` + `daily-YYYY-MM-DD.json`
- 页面 `/briefs` · `GET /api/briefs/daily`
- 推送：`INTEL_FEISHU_WEBHOOK` / `INTEL_PUSH_WEBHOOK`（未配置则跳过）
- `INTEL_PUSH_DRY_RUN=1` · `INTEL_PUSH_SKIP=1` · `INTEL_DASHBOARD_URL`
- `intel:refresh` 末尾自动 briefs + push

### Phase 11 交付

- `npm run intel:qa`：schema 校验 · intent 黄金样例 · tools · brief 构建

### Phase 12 交付

- `Dockerfile`（`web` standalone + `tools` refresh）
- `docker-compose.yml` · profile `with-rsshub` / `tools`
- 说明：[`docs/docker.md`](./docker.md) · `.env.docker.example`
- 本机无 Docker 时不影响 `npm run dev` 工作流

---

## 8. 开发 Roadmap（对齐 Prompt Phase 1–12）

| Phase | 内容 | 验收 |
|-------|------|------|
| **1** | 架构/Schema/API/决策（本文） | ✅ 已确认 |
| **2** | SourceAdapter 框架 + 包装现有 3 源 | ✅ `npm run intel:ingest` |
| **3** | 统一 Item schema 写入 jsonl | ✅（与 Phase 2 一并） |
| **4** | URL/标题去重 + 基础聚类 | ✅ `npm run intel:cluster` |
| **5** | TrendScore + trend_status | ✅（与 Phase 4 一并） |
| **6** | AI 分析（可降级启发式） | ✅ `analyze.ts` · top40 预计算 |
| **7** | Dashboard：首页/事件/趋势 | ✅ `/` `/events/[id]` `/trends` |
| **8** | Trend Agent `/ask` | ✅ `/ask` + `POST /api/agent/ask` |
| **9** | MCP server | ✅ `npm run mcp:intel` · `mcp/server.ts` |
| **10** | 推送（邮件/飞书 webhook，可选） | ✅ `intel:briefs` + 可选 webhook |
| **11** | 测试与 QA | ✅ `npm run intel:qa` |
| **12** | Docker Compose（可选） | ✅ `docker-compose.yml` · [`docs/docker.md`](./docker.md) |

每 Phase：跑测试 → 修错 → 更新 README → 再进入下一阶段。

---

## 9. MVP 范围（建议 2 周可交付）

**做：**

1. Adapter 框架 + TrendRadar / global-hot / RSS(RSSHub) 三源 ingest  
2. 事件聚类（URL + 标题相似；Embedding 可选）  
3. TrendScore + Emerging…Fading  
4. 首页改版：今日全球热点 TOP10 + AI/科技分区  
5. 事件详情页（跨平台来源 + AI 分析卡片）  
6. 每日简报 JSON + `/briefs`  
7. 用户关注领域配置（本地 JSON）影响排序  
8. 保留现有 `/radar` `/hot` `/pulse` `/tools` `/history`（不删能力）

**不做（MVP 外）：**

- Postgres/Redis/Elasticsearch  
- 全量 Prompt 里海外商业媒体抓取  
- 自动推送  
- 完整 MCP  
- 绕过平台登录的源

---

## 10. 需要你确认的关键决策

请直接回复选项（可改）：

### D1. 产品定位
- **A（推荐）**：演进为「全球热点情报」为主，工具目录/对比降为次级导航  
- B：双产品并列（Radar Tools + Trend Intelligence）  
- C：仅增加情报模块，首页仍保持工具总览

### D2. 后端形态
- **A（推荐）**：继续 Next.js + tsx pipeline（最快落地）  
- B：立刻加 FastAPI + Postgres（更接近 Prompt 原文，工期长，需 Docker/本机服务）

### D3. Embedding
- **A**：MVP 先标题/实体规则聚类；有 Key 再开 embedding  
- B：MVP 就接 OpenAI-compatible embedding（需你提供 Key）

### D4. 品牌命名
- **A**：对外仍叫「智衡 AI Radar」，对内模块名 Global Trend Intelligence  
- B：产品改名（请给新名字）

### D5. RSSHub
- **A（推荐）**：默认对接本机 `http://127.0.0.1:1200`（你已安装）  
- B：仅用公网/自建远程实例（请给 base URL）

### D6. 个性化
- **A**：单用户本地 `data/user-interests.json`  
- B：多用户账号体系（超出 MVP）

### D7. 编码启动
确认以上后，从 **Phase 2（SourceAdapter 框架）** 开始改代码。

---

## 11. 与现有文档的关系


| 现有文档 | 关系 |
|----------|------|
| `data-contract.md` | 保留工具七维；新增 Item/Event / briefs 契约 |
| `ia.md` | 导航含今日热点 / 趋势 / 简报 / Agent |
| `12/13/15` | 监控池与 TrendRadar 融合继续作为 Adapter 实现细节 |
| `17-repo-fusion.md` | 本仓与 GitHub / ai-projects 权威路径与同步约定 |
| `gtm-cofounder/*` | 产品叙事可升级为「个人全球趋势情报」 |
| `docker.md` | Phase 12 可选 Compose |

---

## 12. 成功标准（复述）

系统最终必须能回答：

1. **What happened?**  
2. **Why does it matter?**  
3. **What is changing?**  
4. **What is likely next?**  
5. **What should I pay attention to?**  
6. **What can I do?**

而不是「抓到了很多新闻」。
