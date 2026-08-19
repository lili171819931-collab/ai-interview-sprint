# Contributing

感谢参与改进 **AI OSS Intel · GitHub AI 开源情报与产品分析平台**！

## 环境要求

- Node.js ≥ 20（建议 22+）
- npm ≥ 10
- 可选：GitHub Personal Access Token（`repo` 或 `public_repo` 权限），用于提升 API 配额（未认证 60 次/小时、搜索 10 次/分钟；认证 5000 次/小时）

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 GitHub Token（可选，强烈建议）
cp .env.example .env.local   # 填入 GITHUB_TOKEN=ghp_xxx
# 或在 My GitHub 页「GitHub Integration」面板粘贴保存（写入 data/github-token，已 gitignore）

# 3. 启动开发服务（端口 3012）
npm run dev

# 4. 类型检查 / 测试 / 构建
npm run typecheck
npm test
npm run build
```

## 项目结构

```text
src/
├── app/
│   ├── api/github/          生产级 GitHub API 代理路由（health/rate/search/starred/token/analyze/queue/repos/trees）
│   ├── discover/            Discover 页
│   ├── insights/            Insights 页
│   ├── my-github/           My GitHub 收藏雷达 + 集成面板
│   ├── projects/            项目详情 / 完整报告页
│   ├── rankings/            分类 TOP 榜
│   └── add-project/         添加 GitHub 项目（粘贴链接一键分析）
├── components/              分析 / 产品框图 / 专家实战 / Agent 拆解 / 产品总监视角 / Prompt 等动作组件
├── lib/
│   ├── server/githubClient.ts   生产级 GitHub API Client（仅服务端，Token 零前端暴露）
│   ├── githubProxy.ts           客户端代理（优先走 /api/github/*，失败降级直连）
│   ├── live.ts / db.ts / source.ts   数据层（搜索 / 榜单 / 源码树）
│   ├── reports.ts / query.ts / learning.ts   报告生成 / NL 查询 / 学习引擎
│   └── categories.ts / types.ts / data/      分类与确定性种子数据
├── data/                    运行时数据（快照 / 缓存 / github-token，均 gitignore）
tests/engines.test.ts        tsx 驱动引擎单测（含 GitHub Client 纯函数 + 密钥审计）
docs/                        PRD / 架构 / Schema / Roadmap / 部署 / GitHub API 文档
```

## 开发约定

- **Token 安全**：GitHub Token 只允许出现在 `process.env.GITHUB_TOKEN` 或 `data/github-token`；禁止硬编码、禁止 import 进 Client Component、禁止输出到日志。
- **GitHub 调用**：服务端一律走 `src/lib/server/githubClient.ts`（自动 Rate Limit / 重试 / 缓存 / 去重）；前端页面通过 `src/lib/githubProxy.ts` 代理，保留直连降级。
- **数据联动**：新增页面数据尽量与「统一数据库」联动（本地快照 + GitHub 实时按 fullName 合并去重）。
- **仅开源**：全平台只展示开源项目；新增数据源需带 License 校验（OSI 白名单）。
- **Evidence Mode**：报告类结论标注 `[FACT] / [INFERENCE] / [HYPOTHESIS] / [UNKNOWN]`，禁止把推测写成事实。
- **提交前**：`npm run typecheck` + `npm test` + `npm run build` 全绿；CHANGELOG 记录变更。

## 提交规范

```text
feat(14-ai-oss-intel): 简短中文描述
fix(14-ai-oss-intel): ...
docs(14-ai-oss-intel): ...
test(14-ai-oss-intel): ...
refactor(14-ai-oss-intel): ...
```

## CI

`.github/workflows/ci.yml` 会在 push 到 `main` / `codex/**` 或 PR 时自动运行：

1. `npm ci`（或 `npm install`，视 lockfile 可用性）
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run build`
