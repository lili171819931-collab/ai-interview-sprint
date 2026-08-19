# Changelog

所有重要变更均记录在此文件。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added
- **生产级 GitHub API 数据层**（`src/lib/server/githubClient.ts` + `/api/github/*` 路由）
  - 服务端 Token：`GITHUB_TOKEN` 环境变量或本地 `data/github-token`（已 gitignore，绝不出现在前端/代码/仓库）
  - Rate Limit Manager：`X-RateLimit-*` 跟踪 + 持久化 + 剩余配额门控（remaining ≤10 暂停 / ≤3 仅放行必要请求）
  - 403/429 自动等待 + 指数退避重试：已认证等待封顶 `GITHUB_MAX_RATE_WAIT_MS`（默认 30s）；未认证快速失败并返回友好错误（未认证限额 60 次/小时、搜索 10 次/分钟）
  - 缓存层：内存 + 文件系统（`data/cache/github/github-cache.json`），按端点 TTL（搜索 10min / Starred 15min / Repo·Tree·Release·Contributors 1h / README 24h）
  - 请求去重（in-flight 合并）+ 批量分析队列（按剩余配额动态并发 5/3/1/0）
  - 路由：`/api/github/{health,rate,search,starred,token,analyze,queue,repos/[owner]/[repo],trees/[owner]/[repo]}`
  - 修复 `p.finally()` 派生 Promise 未处理导致的 unhandledRejection
- **GitHub Integration UI**：顶栏状态灯（30s 轮询 health）+ My GitHub 页集成面板（认证状态 / 配额 / 重置时间 / 缓存·队列信息 / 更新 Token / 测试连接 / 断开）
- **安全**：`.env.example`（GITHUB_TOKEN / GITHUB_API_URL / GITHUB_API_TIMEOUT / GITHUB_API_MAX_RETRIES / GITHUB_API_CACHE_TTL / GITHUB_MAX_RATE_WAIT_MS）；`data/github-token` 与 `.env.*` 加入 gitignore；前端 bundle 无 Token
- **文档**：`docs/GITHUB_API_ARCHITECTURE.md` / `docs/GITHUB_API_SECURITY.md` / `docs/GITHUB_API_RATE_LIMIT.md` / `docs/GITHUB_API_TEST_REPORT.md`
- **资产化**：新增 `CHANGELOG.md` / `ROADMAP.md` / `CONTRIBUTING.md` / `SECURITY.md` / `.github/workflows/ci.yml`

### Fixed
- 未认证触发 GitHub 403/429 时请求不再无限挂起（此前会等待完整 Reset，最长约 30 分钟）；现在未认证立即失败并提示配置 Token

## [0.9.0] — 2026-08-19

### Added
- 分类 TOP 榜三榜（机会 / 收藏 / 收藏增长最快）均拉取 ≥100 个项目（全平台规则）
- 补充 Resume/Career 与 Making Money 分类榜单数据（此前为空）
- 六件套动作（分析 / 产品框图 / 专家实战 / Agent 拆解 / 产品总监视角 / Prompt）改为每行 3 个网格排列
- 每个项目新增「🧑⚖️ 行业专家实战报告」独立动作（27 节业务向专家报告）
- AI AGENT 拆解驾驶舱独立动作：REPORT A（24 节 Agent 产品总监报告）+ REPORT B（26 节 Workflow 逆向工程报告）+ AI AGENT MASTER MAP
- 实时（源码驱动）项目分析面板新增「项目 Prompt 展示及复制」
- 每个项目新增「生成项目全部 Prompt」功能
- 产品全景图 / 技术路线主线 / 总监全景图的自问问题全部附带答案补充

## [0.8.0] — 2026-08-18

### Added
- 左侧新增「添加 GitHub 项目」：粘贴 GitHub 链接一键生成三件套 + 完整分析报告，全平台数据联动
- My GitHub 收藏雷达按分类显示全部 Star 项目（2026 Favorites / Rising / Hidden Gems / My Project Radar）
- My GitHub 二级场景细分 + 未收录实时项目接入源码抓取三件套
- Ask AI 接入 AI 产品总监视角
- 每个项目「产品总监视角」升级为 AI 产品总监级（Head of AI Product）
- 技术路线主线 + 产品全景图节点可点击展开详细分析 + Demo 截图
- 每个项目「分析」生成完整报告（打印/导出）+ 完整报告页
- 分析功能加入完整链路：用户问题 → 需求 → 产品方案 → 功能 → UX → Workflow → AI 能力 → 数据流 → 技术架构 → 源码模块 → 部署 → 商业模式 → 增长 → 可复制性

## [0.7.0] — 2026-08-17

### Added
- 全平台仅展示开源项目 + 只抓取开源项目并做全功能分析（OSI 许可白名单）
- 实时项目源码抓取 + 源码驱动完整逆向工程报告与产品全景图
- 统一数据库实时同步 + My GitHub 按分类展示
- 全站收敛到分类 TOP 榜 + 榜内项目 分析/逆向拆解/产品框图
- 分类收藏榜实时数据拉取（GitHub）+ 数据集扩充至 166
- 分类收藏榜 + 收藏增长最快榜（2026，含发布时间）
