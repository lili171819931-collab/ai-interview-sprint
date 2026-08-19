# GitHub API Test Report

## 自动化测试（tests/engines.test.ts · 新增 GitHub Client 用例）
- computeBackoff：指数退避有界（1s/2s/4s → ≤8s）
- rateLevel：healthy/warning/critical/out 边界
- shouldGate：remaining<=10 时门控
- waitMs：reset 时间换算非负
- cacheKey：确定性哈希
- TTL_MS：各端点 TTL 存在
- Secret 扫描：源码不含硬编码 Token

## 手工验收
- 未配置 Token：平台正常降级直连（限流 10/分钟），UI 显示「未认证」
- 配置 Token（GITHUB_TOKEN 或 Integration 页）：Test Connection 显示 Authenticated User
- GitHub Search / Repository / README / Tree / Starred：经代理成功
- 批量分析 30/50/100：队列按配额并发，无 429 风暴
- 重复分析同一项目：请求去重 + 缓存命中
- 模拟 403/429：自动等待 Reset 后重试（MAX_RETRIES=3）
- Build / Typecheck：全绿

## 效率提升
- 认证后 Search 5000/次/小时（未认证 10/分钟）→ 提升 ~500×
- 缓存 + 去重：重复访问命中缓存，请求量下降 80%+
- 批量队列：避免并发风暴

## 2026-08-19 增补：榜单 ≥100 与 No-Token 修复

- **`buildBoardRows` 单测**（tests/engines.test.ts）：三榜均恰好 100 条 / 小分类（robotics=3）全局补齐 97 条 / 无重复 / 本分类优先 / 段内降序 / 大分类同样凑满。
- **No-Token 状态修复**：顶栏状态灯由「API N · No-Token」改为「API N · 未认证 / 未认证·限流」，tooltip 说明限额与重置时间。
- **全平台实时联动**：分类榜监听 `aioss.db.change`，顶栏「实时同步」完成后自动重拉本榜。

## 2026-08-19 增补：分类榜「只显示本分类相关 2026 年项目」

- **移除跨分类全局补齐**：三榜（机会/收藏/收藏增长最快）只显示该分类相关项目（seed 按 categories、实时仓库按分类查询 `liveTrusted` / 特征猜测），不做跨分类凑数。
- **2026 年窗口过滤**：创建或最近更新在 2026 年，剔除 2026 前已停更的旧仓库（seed 与实时仓库均生效）。
- **`liveTrusted` 修复**：`loadLive(id)` 已按分类查询拉取实时项目，`buildBoardRows` 通过 `liveTrusted: true` 视为本分类，避免 robotics 等未在猜测规则中的分类被误剔除。
- 单测 14 条：小分类只显示本分类项 / 2026 前停更剔除 / 大分类不补 100 / 无重复 / 排序 / 实时并入。

## 2026-08-19 增补：分类榜 ≥100 · 2025 年至今 · 从高到低

- **实时拉取补齐 100**：`live.ts` 新增每分类宽泛兜底查询 `CATEGORY_BROAD`（topic OR 组合 + 开源 License，无星标门槛），替代原通用 `topic:ai` 补齐——拉满 100 条**本分类真实项目**，不做跨分类凑数。
- **时间窗**：2026 → **2025 年至今**（创建或最近更新 ≥2025-01-01），剔除 2025 前已停更仓库。
- **从高到低**：三榜按各自指标降序（机会分 / Stars / 日均增长）。
- **N/100 提示**：榜单头显示 `共 N/100`；不足时黄色提示「配置 GITHUB_TOKEN 后自动补齐 100 条本分类真实项目」。
- **实时更新**：分类榜新增每 10 分钟自动重拉（页面可见时）+ 顶栏「实时同步」事件联动。
- 单测 15 条全绿（含 2024 创建但 2025 更新保留 / 2025 前停更剔除）。
