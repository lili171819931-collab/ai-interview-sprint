# GitHub API Rate Limit

## 管理策略
- 每次响应读取 `X-RateLimit-Limit / Remaining / Reset / Used`，持久化到 `data/cache/github/ratelimit.json`
- `remaining <= 10` → LOW_RATE_LIMIT：暂停非必要请求，等待 Reset
- `remaining <= 3` → CRITICAL：仅放行必要请求
- 403 / 429 → 读取 `X-RateLimit-Reset`：
  - 已配置 Token：等待但**封顶 `GITHUB_MAX_RATE_WAIT_MS`（默认 30 秒）**后重试，避免请求无限挂起
  - 未配置 Token：**立即失败**并返回友好错误（未认证限额 60 次/小时、搜索 10 次/分钟），由前端降级直连并提示配置 Token
- 指数退避：第 1 次 1s、第 2 次 2s、第 3 次 4s（上限 8s）+ 随机 Jitter

## 缓存（减少请求量）
| 数据 | TTL |
|------|-----|
| Search | 10 分钟 |
| Starred | 15 分钟 |
| Repo / Tree / Releases / Contributors | 1 小时 |
| README | 24 小时 |

## 队列（批量分析）
- 按剩余配额动态并发：>100 → 5 · 50-100 → 3 · 10-50 → 1 · <10 → 暂停
- 同一任务去重；`/api/github/analyze` 批量入队，`/api/github/queue` 查看状态

## 友好错误
- 未认证 → 「GitHub API 当前处于未认证模式，建议配置 Token」
- 403/429（已认证）→ 「GitHub API 请求受限，约 N 分钟后自动恢复」
- 403/429（未认证）→ 「GitHub API 请求受限（未认证限额 60 次/小时，搜索 10 次/分钟）。请在 My GitHub 页配置 GITHUB_TOKEN 自动提速。」
- 401 → 「GitHub Token 无效或已过期，请重新配置」
