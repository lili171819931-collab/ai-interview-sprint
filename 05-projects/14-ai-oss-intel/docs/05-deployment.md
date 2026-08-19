# 部署策略

## 本地开发
```bash
npm run dev        # http://localhost:3012
```

## 生产构建
```bash
npm run build
npm run start      # next start --port 3012（已配置 output: standalone）
```

## Standalone 部署（服务器）
```bash
npm run build
node .next/standalone/server.js   # 端口 3012
# 将 .next/static 与 public 复制到 standalone 目录
```

## Docker（推荐）
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3012
CMD ["node", "server.js"]
```

## 数据更新调度（cron）
```bash
# 每 6 小时拉取 GitHub 实时数据
0 */6 * * * cd /path/14-ai-oss-intel && GITHUB_TOKEN=xxx npm run github:sync
```

## 环境变量
| 变量 | 用途 |
|------|------|
| `GITHUB_TOKEN` | GitHub API 认证（sync 脚本） |
| `PORT` | 服务端口（默认 3012） |

## Standalone 启动（含 GitHub Token）

```bash
# 1. 构建
npm run build
# 2. 拷贝静态资源（Next standalone 不自动拷贝 .next/static）
cp -r .next/static .next/standalone/05-projects/14-ai-oss-intel/.next/static
# 3. 启动（必须指定 AIOSS_DATA_DIR，否则 Token/缓存写入 .next 被构建清空）
AIOSS_DATA_DIR=/path/to/14-ai-oss-intel/data HOSTNAME=0.0.0.0 PORT=3012 node .next/standalone/05-projects/14-ai-oss-intel/server.js
```
