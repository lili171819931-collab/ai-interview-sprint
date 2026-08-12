# 智衡 AI Radar · 仓库融合说明

> 更新：2026-08-12 · Global Trend Intelligence（Phase 1–12）合入本仓

## 权威路径（本仓）

| 项 | 路径 / URL |
|----|------------|
| 可运行完整包 | [`05-projects/07-ai-radar-dashboard/`](./) |
| GitHub | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/07-ai-radar-dashboard |
| 架构 | [`docs/16-global-trend-intelligence-architecture.md`](./16-global-trend-intelligence-architecture.md) |
| Docker | [`docs/docker.md`](./docker.md) |
| 跨仓对照 | [`../PATH-MAP.md`](../PATH-MAP.md) |

**面试仓 `ai-interview-sprint` 的 `07-ai-radar-dashboard` 为当前交付与文档权威副本**（含 GTI Phase 1–12：ingest → 聚类 → Dashboard → Agent → MCP → 简报推送 → QA → Docker）。

## 与 ai-projects 的关系

| 位置 | 角色 |
|------|------|
| `ai-interview-sprint/05-projects/07-ai-radar-dashboard/` | **主交付**（本说明所在仓） |
| `ai-projects/products/ai-radar-dashboard/` | 历史镜像 / 产品集副本（需时手工同步） |
| `05-projects/ai-projects/` 子模块 | 引用 ai-projects；**不以子模块覆盖 07 目录** |

同步建议（可选，向 ai-projects 回写）：

```bash
# 在确认 07 已合入 main 后，按需 rsync 源码（勿覆盖对方 .git）
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude vendor \
  05-projects/07-ai-radar-dashboard/ \
  /path/to/ai-projects/products/ai-radar-dashboard/
```

## 本次融合内容摘要（GTI）

- 事件流水线：`npm run intel:ingest|cluster|refresh|briefs|qa`
- UI：`/` 今日热点 · `/trends` · `/briefs` · `/ask` · `/events/[id]`
- Agent：`POST /api/agent/ask` · MCP：`npm run mcp:intel`
- 推送：可选 `INTEL_FEISHU_WEBHOOK` / `INTEL_PUSH_WEBHOOK`
- 容器：`docker compose up -d --build`（见 `docs/docker.md`）

## 文档索引更新

合入后请同时维护：

1. 本文件 · `07` 的 `README.md`
2. `05-projects/PATH-MAP.md`（AI 动态雷达表）
3. `05-projects/README.md`（类别速览 / 阅读顺序）
4. `docs/ia.md` · `docs/data-contract.md` · `docs/16-…architecture.md`
