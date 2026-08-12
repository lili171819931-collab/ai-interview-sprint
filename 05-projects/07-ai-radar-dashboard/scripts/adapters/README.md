# SourceAdapter 插件说明（Phase 2）

统一接口见 `scripts/adapters/types.ts`。

| Adapter | 输入 | 命令依赖 |
|---------|------|----------|
| `trendradar` | `data/trendradar-hot.json` | `npm run trendradar:sync` |
| `global-hot` | `data/global-hot-topics.json` | `npm run hot:sync` |
| `rsshub` | `RSSHUB_BASE`（默认 `http://127.0.0.1:1200`） | 本机 RSSHub 运行中 |

```bash
# 仅跑 ingest（假设上游 JSON 已有）
npm run intel:ingest

# 离线（跳过 RSSHub 网络）
INTEL_OFFLINE=1 npm run intel:ingest

# 指定 adapters
INTEL_ADAPTERS=trendradar,global-hot npm run intel:ingest
```

产物：`data/items/latest.json` · `data/items/YYYY-MM-DD.json` · `.jsonl`
