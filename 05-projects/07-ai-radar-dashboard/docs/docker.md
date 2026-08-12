# Docker Compose 一键启动（Phase 12 · 可选）

本机若未安装 Docker，继续用本地：

```bash
npm install
npm run intel:refresh:offline   # 或 intel:refresh
npm run dev                     # http://localhost:3010
```

## 前置

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)（macOS）或 Docker Engine + Compose v2
- 本仓路径：`05-projects/07-ai-radar-dashboard`

## 服务

| 服务 | Profile | 说明 |
|------|---------|------|
| `web` | 默认 | Next.js standalone · 端口 **3010** · 挂载 `./data` |
| `rsshub` | `with-rsshub` | 官方镜像 `diygod/rsshub` · 端口 **1200** |
| `refresh` | `tools` | 一次性跑 `intel:refresh:offline`，写回 `./data` |

## 常用命令

```bash
cd 05-projects/07-ai-radar-dashboard

# 仅看板（用已有 data/ 快照）
docker compose up -d --build
open http://localhost:3010

# 看板 + RSSHub
docker compose --profile with-rsshub up -d --build

# 容器内刷新情报（离线默认）
docker compose --profile tools run --rm refresh

# 联 RSSHub 在线 ingest（需 with-rsshub 已起）
INTEL_OFFLINE=0 docker compose --profile with-rsshub --profile tools run --rm refresh

docker compose down
```

环境变量示例见 [`.env.docker.example`](../.env.docker.example)。推送相关与本地相同：`INTEL_FEISHU_WEBHOOK` / `INTEL_PUSH_WEBHOOK`。

## 镜像结构

- `Dockerfile` target `web`：Next `output: "standalone"` 精简运行时
- target `tools`：带 `scripts/` + `tsx` 依赖，供 refresh / 后续 cron

## 注意

- MCP（`npm run mcp:intel`）仍建议在宿主机 / Cursor 侧跑 stdio，不进 Compose
- 首次 `docker compose build` 需能拉 `node:22` /（可选）`diygod/rsshub`
- 构建失败时优先检查磁盘与 Docker 是否已启动；无 Docker 时不影响本地 npm 工作流
