# Security

## Token 与密钥处理（最高优先级）

**AI OSS Intel 的 GitHub Token 只允许出现在服务端：**

- ✅ 环境变量：服务器 `process.env.GITHUB_TOKEN`（`.env.local`，已被 gitignore）
- ✅ 本地文件：`data/github-token`（已被 gitignore，由 My GitHub 集成面板写入）
- ❌ **禁止**：硬编码 Token / 写入前端组件 / 写入日志 / 提交到仓库 / 出现在浏览器 bundle

### 为什么安全

- 所有 GitHub 请求集中在服务端 `src/lib/server/githubClient.ts`，前端通过 `/api/github/*` 代理访问；
- 日志打印请求路径与状态码，**永不打印 Token**；
- `tests/engines.test.ts` 内置密钥审计：扫描 `src/` 下 `ghp_` / `github_pat_` 硬编码，失败即测试不通过；
- `.gitignore` 已排除 `.env.*`（保留 `!.env.example`）与 `data/github-token`；
- 前端 bundle 不含任何 Token：`GithubStatus.tsx` 只展示「已认证/未认证」状态，不接触 Token 本身。

### 使用最小权限 Token

- 只读数据建议 `public_repo` 只读或 `repo`（private 需要时）权限；
- 不要勾选 `workflow` / `admin:org` 等无关权限；
- Token 泄露后立即到 GitHub Settings → Developer settings → Personal access tokens 撤销并重新生成。

## 数据安全

- 平台展示与抓取仅限**开源项目**（OSI 许可白名单），不采集私有仓库内容；
- 运行时数据（快照 / 缓存）仅存本地 `data/`，不包含用户密钥；
- 学习状态（AI PM Score / 学习进度）存浏览器 localStorage，服务端不收集。

## 报告漏洞

请通过 GitHub Issues 私密提交（label `security`），或联系维护者，**不要**在公开报告中包含 Token、密钥或权限转储。

## 依赖与运行

- 保持依赖更新；`npm audit` 建议定期执行；
- 生产部署建议：Token 用环境变量注入（勿写入镜像 / Dockerfile / 日志）；
- 如部署到公网，建议为 `/api/github/token` 增加访问控制（仅本机 / 认证用户）。
