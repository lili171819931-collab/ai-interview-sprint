# Roadmap

> 衍生自 [`docs/04-roadmap.md`](docs/04-roadmap.md) + [`docs/07-2026-radar-build-os.md`](docs/07-2026-radar-build-os.md) + 生产级 GitHub API 数据层。

## Status legend
- ✅ Done · 🚧 In progress · ⬜ Planned

## V0.7 — 开源雷达 + 逆向工程 Lab（✅）
- 全平台仅开源项目（OSI 许可白名单）· 实时源码抓取 · 完整逆向工程报告与产品全景图
- 分类 TOP 榜（机会 / 收藏 / 收藏增长最快，每榜 ≥100）· 统一数据库实时同步 · My GitHub 收藏雷达

## V0.8 — 全链路分析能力（✅）
- 分析完整链路（用户问题→…→可复制性）· 技术路线主线 · 产品全景图（节点可点击 + 自问答案）
- AI 产品总监视角（Head of AI Product）· AI AGENT 拆解驾驶舱（REPORT A/B + MASTER MAP）
- 行业专家实战报告（27 节）· 项目 Prompt 展示/复制 · 六件套每行 3 个网格
- 「添加 GitHub 项目」粘贴链接一键三件套 + 全平台数据联动

## V0.9 — 生产级 GitHub API 数据层（✅）
- 服务端 Token（环境变量 / 本地文件，前端零暴露）· Rate Limit Manager · 403/429 自动等待 + 退避重试
- 缓存（内存 + 文件系统，按端点 TTL）· 请求去重 · 批量分析队列（动态并发）
- Health / Rate / Token / Search / Starred / Repo / Tree / Analyze / Queue API · GitHub Integration UI
- 未认证快速失败友好提示；已认证等待封顶 30s，杜绝无限挂起

## V1 — 生产化加固（🚧）
- 🚧 Watchlist 服务端化（用户体系 + 持久化）
- 🚧 GitHub Token 端到端自动化测试（真实 Token 冒烟 + 缓存命中断言）
- 🚧 CI 在 GitHub Actions 全量跑通（typecheck + tests + build）
- ⬜ Daily Digest 邮件/推送 · Opportunity Radar 定时扫描 · Side Hustle Ranking 增强

## V2 — 多数据源 + 真 AI（⬜）
- ⬜ 多数据源：Hugging Face / Product Hunt / Reddit / Hacker News / npm / PyPI
- ⬜ 真实 LLM Provider（OpenAI / Anthropic / 本地）驱动报告生成与 Ask AI
- ⬜ 数据可视化增强（贡献者增长 / Release 时间线 / Issue 活跃度）

## V3 — 从分析到构建闭环（⬜）
- ⬜ 自动生成创业项目 / PRD / MVP / 开发任务
- ⬜ Codex / Claude Code Integration
- ⬜ 发现 → 分析 → 生成 PRD → 技术方案 → 开发任务 → AI Coding Agent → 直接开发
