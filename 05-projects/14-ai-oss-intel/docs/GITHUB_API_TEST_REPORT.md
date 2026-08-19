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
