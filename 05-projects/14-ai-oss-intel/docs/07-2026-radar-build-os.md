# 2026 Radar · 产品底层逻辑架构分析 + 如何搭建

> 正式定位：**AI Product Radar**
> 副标题：Discover AI Products. Think Like a PM. Build Your Career.

## 新增核心能力

### 1. 2026 项目筛选（Project Time Status）
不用单一 `created_at >= 2026`，而是多因子综合判定：
`Created + Updated + Commit/Release + Star/Fork/Contributor/Issue 增长`

| 状态 | 判定 |
|------|------|
| 2026 NEW | 2026 年首次创建 |
| 2026 RISING | 2026 显著增长（30 天率 >8% 或 90 天率 >20% + 活跃信号 ≥3） |
| 2026 ACTIVE | 2026 持续活跃开发 |
| 2026 RELEVANT | 2026 仍具产品/生态价值 |

- 项目卡片、详情页、Discover 均可筛选（`/discover?ts=2026RISING`）

### 2. 场景分类系统（Scenario-Based Taxonomy）
A-Q 17 组 × 25 个场景（AI Agent / Personal AI Assistant / Workflow Automation / AI Skills / MCP / 自媒体 / 视频 / 图片 / 音频 / Knowledge / Research / Career / Business / Side Hustle / Marketing / E-commerce / Learning / Developer Infra）。
每个项目按分类自动映射 1-4 个场景，支持多标签（Scenario + Technology + User + Business + Career + Content）。

### 3. 产品底层逻辑架构分析（重点）
项目页新增「如何搭建」（`#build`）板块：
- **Project DNA · 14 节点底层逻辑图**：Problem → User → Scenario → Job → Pain Point → Solution → Feature → AI Capability → Agent Workflow → Data → UX → Business → Growth → Moat
- **PM Deep Analysis · 15 维拆解**：Problem / User / Scenario / Pain / Need / Job / Solution / Feature / Workflow / AI / Agent / Data / UX / Business / Growth
- **How To Build · 如何搭建这个产品**：
  - 五层架构（接入/UX → 业务编排 → AI/模型 → 数据 → 变现增长）
  - 技术栈选型（按 Agent/RAG/Coding/Content 差异化）
  - 数据流、模块划分
  - 7 / 14 / 30 天搭建路线
  - 复制什么 / 不要复制什么
  - 依赖与成本估算 + 搭建自检清单
- **Why AI**：为什么需要 AI / 没有 AI 怎么做 / 降低什么成本 / 提高什么效率 / 创造什么新体验
- **AI Native Test**：Current Product / AI Enhanced / AI Native 三态重设计

### 4. 需求挖掘升级（6 层）
表层 → 功能 → 场景 → 核心 → 深层 → 潜在，并提示「这个产品真正解决的可能不是它表面宣传的问题」。

### 5. My GitHub（一级菜单）
- 输入 GitHub 用户名一键同步 Stars（GitHub API 支持 CORS）
- My Starred Projects / 2026 Favorites / My Rising Projects / My Hidden Gems（按兴趣推荐未收藏项目）/ My Project Radar（⭐🔥🚀💰🧩🤖📚）
- My Radar vs Global Radar：全球热门分类 vs 我的关注，找出漏掉的方向
- Personal AI PM Interest Graph：我的兴趣分布（Agent % / Skill % …）

### 6. 首页 WHAT SHOULD I STUDY TODAY?
每日轮换 5 个学习推荐：🔥 最值得研究 / 🧠 最补能力 / 💰 商业 / 🎬 内容 / 💼 Portfolio

### 7. 一项目 → 七种资产
每分析一个项目自动生成：① Project Intelligence Report ② PM Learning Case ③ Product Challenge ④ Personal Opinion ⑤ Social Media Content ⑥ Portfolio Case ⑦ Interview Case。

### 8. Challenge 对比升级
用户回答后展示「你的答案 vs 项目事实 vs AI PM Expert vs 行业最佳实践」，输出 Good / Missing / Wrong / Deeper Insight 四层反馈。

### 9. 能力评估 10 维升级
Product Thinking / Requirement Analysis / AI Understanding / Agent Understanding / UX / Business / Growth / Data / Technical / Communication（对应雷达图与能力缺口推荐）。
