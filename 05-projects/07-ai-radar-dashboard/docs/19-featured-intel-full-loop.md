# 19 · 精选情报台迭代：项目制全闭环

> 迭代代号：Featured Intel Desk / 精选 + 全部动态 + 多源合并  
> 归属项目：`05-projects/07-ai-radar-dashboard`  
> 产品 Owner：lili（产品经理）  
> 日期：2026-08-10 → 2026-08-13  
> 演示：http://127.0.0.1:3010/ · `/all` · `/ranking` · `/briefs` · `/opportunities`

本文把本轮从问题定义到验收发布写成一条可审计链路，覆盖**操作过程、测试分析、问题调试、成本（人力+金钱）、产品经理关键付出**。不是「又加了几个页面」，而是把看板从「工具选型台」收成「每天能刷、能解释、能行动」的情报台。

---

## 0. 为什么做这一轮（问题定义）

前几轮已交付：工具目录与七维评分、雷达日报、BuilderPulse 机会简报、TrendRadar 热点融合、全网热点 ingest。用户（lili）在真实使用中发现三个产品缺口：

| 已有能力 | 真实使用痛点 |
|----------|----------------|
| 工具选型与雷达日报 | 首页仍像后台报告，不像「今天该看哪几篇」 |
| 多源 JSON 各写各的 | 精选、热搜、TrendRadar、公开 RSS 时间轴对不齐 |
| 有热度数字 | 缺少「为什么推荐」；标题/来源/评分样式不统一 |
| 宣称日更 | 「全部动态」出现「42 天前」，信任立刻崩 |

对标公开产品 [AIHOT](https://aihot.virxact.com)（个人非商业学习，遵守其条款）：  
**精选卡（来源 + ✨精选 + AI 评分 + 标题 + 摘要 + 推荐理由）+ 全部动态时间轴 + 热点榜 + 日报。**

本轮目标：把多源数据收成同一阅读体验，并且**时间是真的、推荐理由是可读的、样式是统一的**。

---

## 1. 立项与范围（Project Charter 增量）

### 1.1 目标

- 首页 `/` 成为「精选」：当前热点 + 精选报道卡（含推荐理由）。
- `/all` 成为「全部动态」：按最新时间轴流动，分钟级刷新。
- `/ranking` `/hot` `/briefs` `/opportunities` `/leaderboard` 与精选卡同一套字体与颜色契约。
- 合并 AIHOT、TrendRadar、全球热点、intel ingest，日更后页面读同一批快照。
- 用项目制文档证明：需求来自产品使用，调试有证据，成本可讲清。

### 1.2 In / Out

| In Scope | Out of Scope |
|----------|--------------|
| 精选卡视觉（来源灰 / 金边精选 / 青色评分 / 蓝标题 / 绿推荐理由） | 登录、收藏云同步、付费墙 |
| 多源合并 ingest + `daily:refresh` / `hourly` | 公开镜像 AIHOT、商用转售其数据 |
| 分钟级页面刷新 + GitHub Action 整点快照 | 秒级行情、绕过反爬 / 打码 |
| 非法时间戳拒绝（如 TrendRadar `14-32`） | 自动改写七维工具分 |
| 推荐理由：上游正文优先，失败用摘要兜底并缓存 | 把 RSSHub 902MB 克隆提交进仓 |

### 1.3 成功标准

- [x] `/` 精选卡含 ✨精选、AI 评分、推荐理由（绿色）
- [x] 大标题（页面标题 + 报道标题）蓝色统一
- [x] `/all` 最新在上；相对时间不再出现「42 天前」脏值
- [x] `npm run daily:refresh` 打通热点 / TrendRadar / AIHOT / 雷达 / Pulse / 机会报告
- [x] `DAILY_MODE=hourly` 含 `hot:sync` + `trendradar:sync` + `aihot:sync` + `intel:ingest`
- [x] 本闭环文档可讲清立项 → 调试 → 成本 → 产品付出

---

## 2. 需求冻结（Requirements）

### 2.1 用户故事（产品经理亲写优先级）

1. **作为**每天扫 AI 资讯的 PM，**我希望**精选卡直接告诉我「为什么推这篇」，**以便** 30 秒决定点不点开。  
2. **作为**浏览者，**我希望**所有功能页的标题、来源、评分长得像同一产品，**以便**建立品牌信任。  
3. **作为**盯盘用户，**我希望**全部动态按刚刚抓到的数据从新到旧排，**以便**不看过期热搜当新闻。

### 2.2 MoSCoW

| 优先级 | 功能 | 提出人 |
|--------|------|--------|
| Must | 精选推荐理由；标题蓝色；精选理由绿色 | lili（截图验收） |
| Must | 全站来源 / 评分 / 标题格式统一 | lili |
| Must | 全站数据源合并并刷新 | lili |
| Must | `/all` 分钟级更新 + 最新在上 | lili |
| Should | 推荐理由优先用 AIHOT 正文，失败本地生成 | 研发落地 |
| Should | GitHub Action 整点同步 `data/aihot` | 运维 |
| Won't | 商业镜像、登录态抓取、秒级推送 | 合规闸门 |

### 2.3 非功能

- **可信**：相对时间必须来自可解析 ISO；`14-32` 这类时钟串不得被 `Date.parse` 误读成 42 天前。  
- **合规**：AIHOT 仅个人非商业 / 面试演示；BuilderPulse CC BY-NC；不提交 TrendRadar / RSSHub 整包。  
- **可运维**：页面刷新走 `POST /api/refresh?mode=hourly`；全量走 `npm run daily:refresh`。

---

## 3. 产品设计（IA / 视觉）

### 3.1 信息架构（当前主航）

```
内容    / 精选 · /all 全部动态 · /ranking AI热点榜 · /hot 热点分析 · /briefs AI日报
洞察    /opportunities AI机会报告
模型    /leaderboard 模型榜
更多    /ask Agent 接入
```

离航保留：`/pulse` `/radar` `/history` `/sources` `/goal`。

产品判断（lili）：主航服务「每天打开」；雷达/来源/口径服务「被追问时能讲清」。

### 3.2 视觉契约（截图驱动）

| 元素 | 规格 | CSS |
|------|------|------|
| 页面大标题 | 蓝色 | `--title-blue: #5b9fff` · `.page-title` |
| 报道标题 | 蓝色加粗 | `.zh-title` |
| 来源 | muted 灰 | `.zh-source` |
| AI 评分 | 青色 + 圆点 | `.zh-score` |
| ✨ 精选 | 金边琥珀 | `.zh-badge-pick` |
| 推荐理由（精选） | 绿色 | `.zh-reason-pick` · `--reason-green: #3dd68c` |
| 分隔 | 虚线 | `.story-card-rule` |

验收方式：产品拿 AIHOT 精选卡截图对照 `/` 与 `/all`，不以「差不多」过关。

---

## 4. 项目管理与角色

本项目是**产品经理主导、AI 辅助实现**的一人公司节奏，不是「外包写页面」。

| 角色 | 人 | 实际做了什么 |
|------|----|----------------|
| 业务 Owner / 产品 | **lili** | 问题定义、IA、视觉验收、数据合并优先级、实时性标准、合规边界、面试叙事 |
| 设计 | lili | 用对标截图冻结卡片层级与颜色，拒绝白字标题/白字理由 |
| 研发 | AI 结对 + lili 现场改 | Next.js 页面、ingest、sync、CSS、时间轴 |
| QA | lili 真实浏览 + 脚本回归 | 发现「42 天前」、推荐理由变成 CSS、热重载死循环 |
| 发布 | lili | 要求 GitHub 项目制打包，文档与代码同发 |

变更闸门：影响阅读体验的颜色/排序/刷新，必须产品点头；影响数据契约的字段，必须能在 `data-contract` / 本文件讲清。

---

## 5. 操作过程（不限于指令）

### 5.1 日常怎么跑（人的操作，不只是 npm）

1. **打开看板**：`cd 05-projects/07-ai-radar-dashboard && npm run dev` → http://127.0.0.1:3010  
2. **看精选**：`/` 核对推荐理由是否像人话、评分是否 0–100。  
3. **看全部动态**：`/all` 第一条应是「N 分钟前」，不是「N 天前」。  
4. **全量日更**（上海日切归档 + 刷新）：

```bash
npm run daily:refresh
```

5. **分钟级（全部动态打开时页面会调）**：

```bash
npm run hourly
# 等价：DAILY_MODE=hourly npx tsx scripts/daily-refresh.ts
```

实际步骤：hot:sync → trendradar:sync → aihot:sync → intel:ingest（`INTEL_ADAPTERS=aihot,trendradar,global-hot`）。

6. **单源**：

```bash
npm run aihot:sync     # 精选 + 推荐理由
npm run hot:sync       # 16 站国内外热点
npm run trendradar:sync
npm run opp:sync       # 机会报告（可 OPP_SKIP_PULSE=1）
npm run intel:ingest
```

7. **页面触发**：`POST /api/refresh?mode=hourly|hot|quick|full`（开发环境默认允许；生产需 `ALLOW_LIVE_REFRESH=1`）。  
8. **GitHub**：整点同步 YAML 备档于 `docs/ops/ai-radar-hourly.yml`（复制到仓库根 `.github/workflows/` 后生效；当前推送凭证无 `workflow` scope，故未直接写入 `.github/workflows`）。

### 5.2 数据合并闭环（产品要求「每个网站的数据库做合并」）

```
AIHOT 公开 v1     → data/aihot/items.json
全球热点 16 站    → data/global-hot-topics.json
TrendRadar 本地库 → data/trendradar-hot.json
        ↓ intel:ingest
data/items/latest.json  （去重后的统一 Item）
        ↓ queryFeed
/ 精选（selected）  /all 全部（aihot + events + intel，时间轴降序）
```

页面**只读** `data/`，避免再出现「页面 load 写盘 → Next 热重载死循环」。

### 5.3 关键命令速查

| 场景 | 命令 | 产物 |
|------|------|------|
| 全量日更 | `npm run daily:refresh` | archive + hot + radar + pulse + opp |
| 分钟合并 | `npm run hourly` | 热点 + TR + AIHOT + ingest |
| 精选理由 | `npm run aihot:sync` | `data/aihot/items.json` |
| 本地预览 | `npm run dev` | :3010 |
| 构建门禁 | `npm run build` / `npx tsc --noEmit` | 无类型错误 |

---

## 6. 测试分析

### 6.1 策略

不以「页面能打开」为通过。本轮质量门是**阅读信任**：时间、理由、样式、排序四件事同时成立。

### 6.2 用例

| 编号 | 场景 | 方法 | 预期 | 结果 |
|------|------|------|------|------|
| TC-F1 | 精选卡结构 | 打开 `/` 看 HTML | 有 ✨精选、AI 评分、推荐理由 | 通过（`zh-reason-pick` 出现） |
| TC-F2 | 推荐理由不是 CSS | 抽 `items.json` 首条 | 不含 `{` / `first-child` / `margin:` | 通过（正则改为 class 精确匹配后） |
| TC-F3 | 标题蓝色 | CSS 变量 | `--title-blue` 用于 `.page-title` `.zh-title` | 通过 |
| TC-F4 | 精选理由绿色 | 精选条目 | `.zh-reason-pick` | 通过 |
| TC-A1 | `/all` 最新在上 | 时间轴 | 按 `timelineMs` 降序 | 通过 |
| TC-A2 | 无「42 天前」 | 相对时间 | 非法 `14-32` 回落到 snapshot ISO | 通过（刷新后为「1 分钟前」） |
| TC-D1 | 多源合并 | `intel:ingest` | aihot 30 + trendradar 40 + global-hot 166 → 235 去重 | 通过（2026-08-13） |
| TC-D2 | 全量日更 | `daily:refresh` | 16/16 热点源 OK，radar/pulse/opp 写出 | 通过 |
| TC-T1 | 类型检查 | `tsc --noEmit` | 0 error | 通过（修过 opportunities `headline`） |
| TC-O1 | 机会报告只读 | `/opportunities` | 页面不写 `data/` | 通过（此前热重载已修） |

### 6.3 2026-08-13 实测摘录

- `hot:sync`：源 16/16，条目 166（国内 106 / 海外 60）。  
- `aihot:sync`：items 24h 14 + 7d 30；推荐理由 30/30（上游 HTML 被 bot 页拦截时走摘要兜底）。  
- `intel:ingest`：235 items → `data/items/latest.json`。  
- `/all` HTML：相对时间为「分钟前」量级，不再是「42 天前」。

### 6.4 已知限制（诚实）

- AIHOT 详情 HTML 有时返回 ~1KB 反 bot 脚本，**不能保证**每次都抓到原站「推荐理由」金句；产品接受「摘要首句兜底 + 本地缓存」，并在界面仍展示「推荐理由」区块。  
- TrendRadar 本地库日期可能落后一天（例如读到 `2026-08-12.db`），ingest 用 snapshot `generatedAt` 作为时间轴，避免脏时钟。  
- GitHub Action 整点任务只提交 `data/aihot`，完整 16 站热点仍以本机 `daily:refresh` / 打开 `/all` 的 hourly 为主。

---

## 7. 问题调试（缺陷 → 根因 → 修复）

本轮不是一次写对，而是产品在真实页面上揪出来的。

### 7.1 推荐理由变成 CSS

- **现象**：理由显示 `:first-child{margin-top:0}.m-detail-html…`  
- **根因**：正则 `m-detail-reason-text[^>]*>` 先命中了样式表里的 class 名。  
- **修复**：只匹配 `class="m-detail-reason-text"`；拒绝含 `{` / `margin:` 的文本；同步时复用上次成功缓存；bot 页则用 `buildRecommendReason` 摘要兜底。  
- **产品意义**：lili 要求理由必须像截图里的人话，否则精选卡没有信息增量。

### 7.2 「42 天前」

- **现象**：`/all` 头条来源 `cls-hot` / `thepaper`，相对时间 42 天。  
- **根因**：TrendRadar 字段 `firstSeen: "14-32"` 被 `Date.parse` 解析成合法日期（月-日），相对今天变成数十天。  
- **修复**：拒绝 `^\d{1,2}-\d{2}$`；`toIsoOr` 回落到 snapshot 时间；时间轴按修正后的 ISO 降序。  
- **产品意义**：实时性是信任问题，不是 UI 文案问题。

### 7.3 `/opportunities` 热重载死循环

- **现象**：页面一开就改 `data/`，Next 不断编译。  
- **根因**：page 组件在请求路径里写日更产物。  
- **修复**：页面只读；持久化只走 `opp:sync` / `daily:refresh`。  
- **产品意义**：演示环境必须稳，不能「打开即卡死」。

### 7.4 hourly 只刷 AIHOT、全部动态仍旧

- **现象**：页面写着「每分钟更新」，ingest 仍是昨天的 TrendRadar 脏时间。  
- **根因**：`DAILY_MODE=hourly` 原先只跑 `aihot:sync`。  
- **修复**：hourly = hot + trendradar + aihot + ingest。  
- **产品意义**：lili 明确要求「时间线上按照每分钟抓取的数据实时更新」。

### 7.5 `/all` 500（更早一轮）

- **现象**：时间轴按日分组时非法日期。  
- **修复**：`dayHeading` 校验 `YYYY-MM-DD`，失败给「未知日期」。

---

## 8. 成本分析（人力 + 金钱 + 机会成本）

口径：一人公司面试仓，**不虚构融资或付费用户**。数字是量级，用于证明产品经理算过账。

### 8.1 金钱（现金支出）

| 项 | 量级 | 说明 |
|----|------|------|
| GitHub 公开仓 | ¥0 | 私有仓升级非本阶段必须 |
| 本机开发（已有 Mac） | ¥0 边际 | 不新增云主机 |
| Next.js / 开源依赖 | ¥0 | MIT 等，遵守各自许可 |
| Cursor / AI 结对 | 约 $20/月（若订阅 Pro） | 本轮加速实现，不替代产品判断 |
| 公开数据源 | ¥0 现金 | AIHOT / BP / 热搜均为公开或 NC；**商用需另购授权** |
| GitHub Actions | 免费额度内 | 每小时一次 aihot 快照，体量小 |
| 域名 / CDN / 云函数 | ¥0（本阶段） | 演示走 localhost:3010 |
| **本轮现金合计** | **≈ 订阅月费量级** | 没有爬虫代理、没有标注众包、没有云 GPU |

隐藏成本：若把 AIHOT / BuilderPulse 内容做成对外收费产品，许可风险是**潜在罚金与下架**，不是「免费流量」。产品决策是：面试与个人学习可以展示，商用必须换自有源。

### 8.2 人力（谁在花时间）

按「若外包同等产出」估算，便于面试讲 ROI，不是报销单。

| 工作包 | 主导 | 本轮估时 | 若市场价（人民币） |
|--------|------|----------|-------------------|
| 问题定义 / IA / 主航取舍 | **lili** | 6–8 h | PM 咨询 600–1000/h → 0.4–0.8 万 |
| 对标拆解（AIHOT 卡片、时间轴、热点榜） | **lili** | 4–6 h | 含在产品研究 |
| 视觉验收（多轮截图对照） | **lili** | 3–5 h | 设计走查 |
| 数据合并与日更策略 | lili 定标准，研发落地 | 4–6 h | 数据产品 |
| 实现（页面/CSS/sync/ingest） | AI 结对 | 等效 2–4 人日工程 | 中级前端 1.5–3 万/人月折算约 0.3–0.8 万 |
| 缺陷三连（CSS 理由、42 天前、hourly 范围） | lili 发现 + 结对修 | 4–6 h | QA + 修复 |
| 项目制文档与 GitHub 打包 | lili 要求完整闭环 | 3–4 h | 交付经理 |
| **本轮合计** | | **约 30–40 人时** | **现金几乎为 0，重置成本约 1–2 万量级** |

整仓智衡（含工具目录、雷达、Pulse、TrendRadar、GTI ingest）累计远大于本轮：从立项到本闭环大约 **2 周日历、80–120 人时产品主导**。一人 + AI 把「本来要一个小团队」压到可演示，前提是产品经理把范围砍干净。

### 8.3 机会成本与节省

- **不做合并**：三个 JSON 各刷各的，用户以为「实时」，实际看的是脏时钟 → 产品信誉归零。  
- **不做推荐理由**：精选和信息流无差异，对标 AIHOT 失败。  
- **用 AI 结对而非招前端**：本轮工程费从「周级外包」降到「订阅 + 产品盯验收」。  
- **不把 RSSHub 902MB / TrendRadar venv 推进 GitHub**：避免仓膨胀和许可污染。

### 8.4 单位经济（若以后做内部工具）

假设服务 1 个 AI 团队、每人每天少搜 30 分钟：

- 5 人 × 0.5 h × 22 天 × 400 元/人时 ≈ **2.2 万/月** 时间价值。  
- 本阶段运行成本仍接近 0。  
- 结论：商业化卡在**许可与稳定源**，不卡在服务器账单。这是产品经理必须先讲的账。

---

## 9. 产品经理 lili 在本项目中的关键付出（重点）

面试时不要说「我让 AI 写了个网站」。下面这些是**只有产品经理做了，代码才有方向**的决策。

### 9.1 把「再做一个榜」改成「可审计情报台」

- 禁止 RSS/热搜自动改七维分。  
- 热搜是发现信号，精选是编辑过的阅读，机会报告是「今天做什么」。  
- 三层分开，用户任务不混。

### 9.2 主航是她定的，不是工程师顺手加路由

精选 / 全部动态 / AI热点榜 / 热点分析 / AI日报 / AI机会报告 / 模型榜 —— 对应「看重点、刷时间轴、看热度、看国内海外、看日切、看行动、看模型」。  
侧栏分组（内容 / 洞察 / 模型 / 更多）是信息架构，不是装饰。

### 9.3 用截图当验收标准，而不是口头「好看一点」

- 精选卡必须有推荐理由。  
- 精选理由必须绿色。  
- 大标题必须蓝色。  
- 来源、评分格式全站统一。  

这是设计系统落地，避免每一页一种灰。

### 9.4 把「实时」定义成可检验的行为

不是 Banner 写「Live」，而是：

- 时间轴最新在上；  
- 非法时间戳不得冒充相对时间；  
- `/all` 每分钟拉合并后的抓取结果。  

她在页面上指出「42 天前」后，问题才从「UI」升级成「数据契约」。

### 9.5 坚持多源合并，而不是再做一个爬虫页

要求「全网页每个网站的数据库做合并」。落地是 ingest 去重 + feed 查询，而不是并排三个互不相干的列表。这是数据产品判断。

### 9.6 合规闸门她守住了

AIHOT 非镜像、BuilderPulse NC 署名、TrendRadar/RSSHub 不进仓、不登录爬取。  
一人公司最容易在「先跑起来」时把许可做脏；她选择演示边界清晰。

### 9.7 工作方式：PM 直接在代码里迭代

不是甩 PRD 等两周。她在运行中的 3010 上提需求、看回归、再提下一刀（理由颜色 → 标题颜色 → 时间轴实时）。这是现代 AI PM 的交付方式：**现场验收闭环**。

### 9.8 要求项目制打包进 GitHub

她明确要求：操作过程、测试、调试、成本、个人付出、全闭环一起进仓。  
目的是面试官能看到「这个人能把事从想法收到可复盘资产」，而不只是 commit 里的组件文件。

---

## 10. 发布与运维

1. 代码与文档进入 `ai-interview-sprint` 的 `05-projects/07-ai-radar-dashboard`。  
2. 不提交：`node_modules`、`.next`、`vendor/BuilderPulse`、`08-resources/TrendRadar/`、`08-resources/RSSHub/`、`.tmp-*`。  
3. 提交：页面/脚本、`data/` 日切快照、`public/` 品牌与厂商标、`.github/workflows/ai-radar-hourly.yml`、本闭环文档。  
4. 演示路径：**精选 → 全部动态 → 热点榜 → 日报 → 机会报告 → 来源/口径（被追问时）**。  
5. 若 `ERR_CONNECTION_REFUSED`：先确认 `npm run dev` 在看板目录监听 3010。

---

## 11. 商业与闭环（到「能讲清下一步」）

```
公开源抓取 → 合并 Item → 精选/时间轴/热度/日报
                ↓
         机会报告（今天做什么）
                ↓
     工具目录与七维分（要不要引进来）
```

- **现在卖的不是流量**，是一人公司把「看世界 → 做判断」做成可演示流程。  
- **下一步商业**（见 `09`）：企业内部情报台必须换自有源；本轮只证明体验与管线成立。  
- **闭环完成定义**：用户能在 4 分钟演示里走完阅读 → 热度 → 行动，并且能回答「为什么不是 42 天前」「为什么有推荐理由」「为什么不改七维分」。

---

## 12. 复盘

### 做得对

- 产品用真实页面找茬，比补测试用例更快打到根因。  
- 先统一视觉契约，再修数据时间，信任是一层一层叠的。  
- 合并 ingest，而不是再开一个「实时」假页面。

### 做得不够

- 推荐理由在反 bot 时仍依赖摘要兜底，与对标站金句有差距。  
- GitHub Action 尚未覆盖 16 站热点（成本与密钥/环境限制）。  
- 主航与旧 `/radar` `/pulse` 并存，新用户仍可能迷路（需一次导航减脂）。

### 下一阶段 Backlog

| 优先级 | 项 |
|--------|----|
| P1 | 自有推荐理由（基于摘要 + 品类规则，减少对 AIHOT HTML 的依赖） |
| P1 | `/all` 默认窗与「刚刚」刷新状态条（同步中 / 上次成功） |
| P2 | 主航只留新 IA，旧雷达入口收到「更多」 |
| P2 | Action 用 cache 跑 hot:sync（需评估分钟额度） |
| P3 | 企业版：自有源 + 权限，剥离 NC 内容 |

---

## 13. 面试一分钟讲法

> 这一轮我作为产品经理，把智衡从「工具对比台」收成「每天打开的情报台」。我定了主航：精选、全部动态、热点、日报、机会报告；用对标截图冻结卡片——来源、精选标、评分、蓝标题、绿推荐理由。我要求所有站点数据合并、全部动态按最新抓取排序。验收时我抓住两件会毁掉信任的事：推荐理由抓成了 CSS、时间轴显示 42 天前。根因分别是正则误匹配样式表、以及 TrendRadar 的 `14-32` 被当成日期。我们改了契约、hourly 管线和文档。现金成本几乎是 0，我投入的是产品判断和现场验收；工程用 AI 结对在几天内落地。商业上我守住了非镜像、NC 署名、不把 900MB 爬虫仓推进 GitHub。下一步若要收费，必须换自有源——这是我主动讲的风险，不是被问出来的。

---

## 14. 关联文档

- 立项 / 收口：[`00-project-charter.md`](00-project-charter.md) · [`07-project-closure.md`](07-project-closure.md)  
- IA / 验收：[`ia.md`](ia.md) · [`验收清单.md`](验收清单.md) · [`05-test-and-qa-report.md`](05-test-and-qa-report.md)  
- 商业 / PM：[`09-commercial-value-and-landing.md`](09-commercial-value-and-landing.md) · [`10-ai-pm-perspective.md`](10-ai-pm-perspective.md)  
- 前序闭环：[`14-opportunity-brief-full-loop.md`](14-opportunity-brief-full-loop.md) · [`15-trendradar-fusion-full-loop.md`](15-trendradar-fusion-full-loop.md) · [`18-builderpulse-opportunity-archive.md`](18-builderpulse-opportunity-archive.md)  
- 叙事：[`interview-story.md`](interview-story.md) · [`演示脚本.md`](演示脚本.md) · [`../README.md`](../README.md)  
- 致谢与许可：[`CREDITS.md`](CREDITS.md)
