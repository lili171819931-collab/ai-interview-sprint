# AI 产品逆向工程 OS（Reverse Engineering Lab）

> 使命：Study Great AI Products. Think Like a PM. Build Better AI Products.

## 核心新增

### 1. 逆向工程 Lab（项目页 `#reverse`）
每个项目从「GitHub 项目介绍」升级为「AI 产品逆向工程系统」，回答：
为什么出现 → 谁需要 → 解决什么 → 用户怎么走 → 功能怎么实现 → 源码怎么组织 → 技术怎么选 → 商业怎么转。

- **完整用户路径（15 步）**：进入→注册→选任务→输入→系统理解→AI Planning→调用 Tool→获取数据→执行 Workflow→生成结果→用户修改→再次执行→输出→分享→复用；每步给出 做什么/为什么/模块/输入/输出/AI 角色
- **核心功能实现路径**：Frontend → API → Backend → Intent → Prompt → LLM → Tool → Data → Reasoning → Structured Output → Render → Feedback（每步带 Evidence 标签）
- **源码架构逆向**：目录结构、核心模块职责、代码→产品功能映射（Feature → UI → Service → AI Module → Tool → DB → API，杀手级能力）
- **技术选型解释**：为什么选 / 替代方案 / 换一种会怎样
- **产品设计 → 技术设计映射**：产品需求 → 功能 → UX → Workflow → AI → 基础设施 → 输出
- **如果让我重新做**：保留 / 删除 / 增加 / 重新设计 / 优先做 / 不做
- **MVP 逆向**：MVP（3-5 功能）→ V1 → V2 → Scale 演进路径
- **产品决策分析**：决策 / 理由 / 取舍 / 替代
- **商业模式 + 10 类商业机会 + 10 行业应用 + 竞争分析（4 类竞品 + 7 维对比）**
- **10 维价值评分**：Product / AI Innovation / Technical Innovation / User / Business / Open Source / AI PM Learning / Career / Content / Growth
- **AI Architecture（15 组件）**：Model / Prompt / Context / Memory / RAG / Embedding / Vector DB / Agent / Tool / MCP / Workflow / Evaluation / Guardrail / Caching / Observability
- **AI PM 学习价值 + 自媒体价值**（Hook/Topic/Angle/Controversy/PM Insight/Title/Script/Thumbnail）

### 2. 40 节 PROJECT INTELLIGENCE REPORT
`#reverse` 顶部生成完整 40 节报告（Executive Summary → ... → Final Score），可展开浏览，作为面试/复盘资产。

### 3. Evidence Mode（🧪）
任何技术实现判断必须区分 **Confirmed / Inferred / Hypothesis / Unknown**；
源码无法确认时明确标注「无法从公开源码确认」，禁止把推测写成事实。

### 3.5 分类收藏榜 + 收藏增长最快榜
每个分类页（`/rankings/category/[id]`）提供三个 Tab：
- 机会 TOP 榜（默认）
- **收藏榜**：按 Stars（收藏数）排名 · 2026 · 每项目显示发布时间
- **收藏增长最快榜**：按 2026 Star 增长（近 90 天）排名 · 2026 · 每项目显示发布时间
榜单上限 100 个项目（随数据源扩充，当前收录 138 个项目）。

### 4. 分类 TOP 榜 + 二级场景
- `/rankings/categories`：30 个一级分类独立榜单索引
- `/rankings/category/[id]`：每个分类的 TOP 榜（按 Opportunity 排序，30 页）
- 二级场景拆解：如 Agent → 通用任务/多智能体/浏览器/编码/语音 Agent；每个项目自动标注二级场景

### 5. 首页 2026 Radar 化
- 2026 HOT / 2026 RISING / FASTEST GROWING / HIDDEN GEMS 四大核心区
- 右侧 MY AI PM SCORE（能力分实时卡片）+ 分类 TOP 榜入口
- WHAT SHOULD I STUDY TODAY 每日 5 推荐

### 6. My GitHub 升级
- 每个收藏/同步项目生成 **MY PROJECT REPORT**：为什么收藏、为什么值得研究、重点学什么、对 AI PM 转型帮助、是否值得自媒体 / Portfolio / 重新开发

### 7. Personal AI PM Curriculum
/learn 新增个性化课程：根据能力短板自动编排 4 周课程（补短板 → 需求 → 设计 → 商业）。

## 逆向工程方法论
```
看到产品 → 理解产品 → 拆解产品 → 理解需求 → 理解设计 → 理解技术 → 理解商业
→ 提出自己的方案 → 形成自己的产品观点
```
最终目标：看到一个 AI 产品，就能快速逆向理解它（用户/需求/设计/功能/AI/Agent/数据/技术/商业/竞争/未来），并知道如果自己做应该怎么做。

## 8. Master 分析 / 产品框图 / 产品总监视角（v3）
- **分析**（每个项目）：打开完整「AI 产品深度逆向工程」——40 节 PROJECT REVERSE ENGINEERING REPORT、PROJECT FACT SHEET、产品全景图（USER→…→MOAT 16 节点）、KILLER FEATURE、BEFORE VS AFTER、AI VALUE MAP（Traditional/AI Enhanced/AI Native/Agentic）、FEATURE DEPENDENCY GRAPH、技术难点地图、产品难点地图、PRODUCT 2.0、PRODUCT CLONING PLAN、三结论（WHY/HOW/WHERE IT WORKS）
- **产品框图**：更新为「功能实现路径框图」——Step01 User Input → Frontend → API → Backend → Intent → Prompt → LLM → Tool → Data → Reasoning → Structured Output → Render → Feedback（每步带 Evidence 标签）
- **产品总监视角**（新增）：边界考虑（In/Out Scope + 约束 + 边界结论）、痛点分析（深层痛点/路径摩擦/未被满足需求）、真实案例预测（个人/团队/副业三类案例：用户·场景·Before/After·预期·指标）
- 已删除「逆向拆解」按钮（内容并入「分析」）

## 9. 完整链路（分析功能核心 · v4）
每个项目「分析」顶部新增 **🔗 完整链路**：一条贯通全产品的 14 环节主线
`用户问题 → 需求 → 产品方案 → 功能 → UX → Workflow → AI能力 → 数据流 → 技术架构 → 源码模块 → 部署 → 商业模式 → 增长 → 可复制性`
- 每环节给出该环节的内容（问题/JTBD、需求分层、一句话模型、Feature Map、UX、Workflow、AI 组件、数据流、架构与选型、源码模块、部署与成本、商业模式、增长引擎、MVP/护城河/复制点）
- 可展开「技术路线主线」：用户 → 为什么需要 → 痛点 → 需求 → 方案 → 功能 → UX → 操作流程 → Workflow → LLM/RAG/Agent → Tools → MCP → Data → API → Backend → Database → Frontend → Source Code → Deployment → Business → Growth → Moat（24 节点深层链路）
- 实时（源码驱动）项目同样生成 14 环节完整链路；快照项目详情页「如何搭建」板块顶部也展示完整链路
