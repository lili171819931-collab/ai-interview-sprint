# GitHub API Security

- Token 仅存在于服务器端：`process.env.GITHUB_TOKEN` 或本地文件 `data/github-token`（0600，已 gitignore）
- **绝不**出现在前端 Bundle：浏览器只调用同源 `/api/github/*`，由服务器附加 `Authorization` 头
- **绝不**存入 localStorage / sessionStorage / URL 参数 / 日志 / README / 仓库
- `.gitignore` 已包含：`.env`、`.env.*`（保留 `!.env.example`）、`data/github-token`
- `.env.example` 提供配置模板（不含真实 Token）
- 日志系统打印请求/状态/耗时/缓存命中，**过滤 Authorization 头**
- Secret Leak Audit：扫描 `ghp_` / `github_pat_` / `GITHUB_TOKEN` / `Authorization` / `Bearer`
- ⚠️ 若历史提交中曾出现 Token：立即在 GitHub 设置 → Developer settings → Tokens 中 **Revoke** 该 Token
