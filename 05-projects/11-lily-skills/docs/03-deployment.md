# 部署指南

## 环境要求

- Node.js ≥ 22.13（推荐 24+，使用内置 `node:sqlite`）
- 无需外部数据库 / Redis / 对象存储（本地优先）

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3210
```

首次启动会自动：
1. 创建 SQLite 数据库 `data/lily-skills.db`
2. 建表（18 张表）
3. 创建默认分类 + 用户
4. 扫描 `skills/` 目录自动注册全部内置 Skill
5. 若没有工作流，写入演示工作流

## 生产构建

```bash
npm run build
npm start          # http://localhost:3210
```

## 环境变量（.env）

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | 3210 | 服务端口 |
| `DATABASE_PATH` | `./data/lily-skills.db` | SQLite 文件路径 |
| `AGENT_OFFLINE_ONLY` | false | `true` 时禁止所有外部网络执行 |
| `SKILL_TIMEOUT_MS` | 60000 | Skill 子进程超时 |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | 空 | 可选：接入 OpenAI 兼容 LLM 增强 Agent 理解（默认全离线） |

## 数据维护

```bash
npm run db:reset    # 删除并重建数据库（危险操作，会清空数据）
npm run db:seed     # 写入默认分类/用户/演示工作流
npm run skills:scan # 重新扫描 skills/ 目录
```

## 备份

SQLite 单文件备份：

```bash
sqlite3 data/lily-skills.db ".backup backup-$(date +%Y%m%d).db"
```

## Docker（可选，规划）

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3210
CMD ["npm", "start"]
```

## 扩展部署形态（V2+）

- 多实例：SQLite 单写限制 → 可平滑迁移 PostgreSQL（`connection.ts` 已隔离，改动面小）
- 云端：`DATABASE_PATH` 指向挂载卷，`AGENT_OFFLINE_ONLY` 按环境配置
- 定时工作流：当前为手动触发 + 计划字段预留，V2 接入 cron / webhook
