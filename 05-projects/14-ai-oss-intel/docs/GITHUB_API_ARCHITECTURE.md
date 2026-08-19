# GitHub API Architecture（生产级数据层）

## 旧架构（问题）
- 所有 GitHub 请求由浏览器直连 `api.github.com`（CORS）
- 无 Token → 未认证限流：Search 10 次/分钟、Core 60 次/小时
- 无 Rate Limit 管理 / Retry / 队列；仅 localStorage 粗粒度缓存

## 新架构
```
业务层（分类榜 / Discover / My GitHub / add-project / source 分析）
   ↓  /api/github/*（同源代理）
GitHub Service（src/lib/server/githubClient.ts）
   ├─ Authentication（GITHUB_TOKEN 环境变量 或 data/github-token 文件，仅服务器）
   ├─ Rate Limit Manager（X-RateLimit-* 追踪 + 持久化 + 门控）
   ├─ Retry（403/429 自动等待 + 指数退避 + Jitter，MAX_RETRIES=3）
   ├─ Cache（内存 + data/cache/github 文件，按端点 TTL）
   ├─ Request Dedup（in-flight 合并）
   ├─ Queue（批量分析，按剩余配额动态并发 5/3/1/0）
   └─ Logging（请求/状态/耗时/缓存命中，绝不打印 Token）
   ↓
GitHub API
```

## API Routes
| 路由 | 说明 |
|------|------|
| `/api/github/health` | 健康/认证/限流/缓存/队列状态 |
| `/api/github/rate` | 限流详情 |
| `/api/github/search?q=` | Search 代理（缓存 10 分钟） |
| `/api/github/repos/:owner/:repo` | 仓库详情（缓存 1 小时） |
| `/api/github/trees/:owner/:repo` | 目录树（缓存 1 小时） |
| `/api/github/starred?user=` | Star 列表（缓存 15 分钟） |
| `/api/github/token` | POST 保存 Token / POST action=test / DELETE 断开 |
| `/api/github/analyze` | POST repos[] 批量入队分析 |
| `/api/github/queue` | 队列状态 + 日志 |

## 改造的文件
- 新增：`src/lib/server/githubClient.ts`、`src/lib/githubProxy.ts`、`src/components/GithubStatus.tsx`、`src/app/api/github/*`
- 接入代理：`src/lib/live.ts`、`src/lib/db.ts`、`src/lib/source.ts`、`src/app/my-github/page.tsx`、`src/app/add-project/page.tsx`（均保留直连降级）

## Token 配置
1. 服务器环境变量 `GITHUB_TOKEN=ghp_xxx`（推荐）
2. 或平台内「GitHub Integration」页面保存到 `data/github-token`（gitignore，0600 权限）
