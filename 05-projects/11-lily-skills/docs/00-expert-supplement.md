# 专家补充点 —— 需求之外被忽略的关键问题

> 以「AI 产品 + AI Agent 架构 + Full-Stack + DevOps + QA + 安全」多专家视角，
> 对原始 Prompt 未展开的部分进行补充。标注：
> - ✅ **已在本 MVP 实现**
> - 🗺️ **V2 / V3 路线（架构已预留，未在本期实现）**

---

## 1. 安全专家

### 1.1 Skill 内容注入（Prompt Injection）
原始需求只关注「怎么把 Skill 接入」，忽略了**恶意/劣质 Skill 描述可能诱导 Agent 行为**。
- ✅ Manifest 校验 + 输入 Schema 白名单校验（类型/必填/枚举/范围）
- ✅ 执行隔离：本地 Skill 在**独立子进程**中通过 JSON-over-stdio 协议运行，异常不会拖垮主进程
- 🗺️ Skill 内容可信度评分、Manifest 内容安全扫描、Agent 输出过滤（V3）

### 1.2 命令注入与越权
- ✅ CLI Skill 使用 `{{key}}` 模板替换 + 高风险审批门禁
- ✅ 权限模型：`read / write / external_api / file / browser / social_media / email / database / payment / network`，执行类型自动推导隐含权限
- 🗺️ 真正的操作系统级沙箱（容器 / 受限用户 / seccomp），CLI 命令白名单（V2）

### 1.3 审批策略（Human-in-the-loop）
原始需求提到「重要操作需审批」，但没有给出**分级策略**。
- ✅ 风险分级：`low / medium / high / critical`，分别对应 自动 / 自动(敏感能力除外) / 必须审批 / 必须审批
- ✅ 审批状态机：`awaiting_approval → approve → execute`，Agent 与 Workflow 均支持暂停/恢复
- 🗺️ 双人审批、审批理由强制填写、审批 SLA 超时自动拒绝（V3）

### 1.4 数据隐私与本地优先
- ✅ SQLite 本地文件（`data/lily-skills.db`），默认不依赖外部服务；`AGENT_OFFLINE_ONLY=true` 可彻底断网
- ✅ 种子 Skill 的演示数据源明确标注 `offline-demo`
- 🗺️ 字段级加密、密钥托管（V2）

### 1.5 审计
- ✅ `audit_logs` 全量记录注册/执行/审批等关键动作
- ✅ Execution Log 只记录**可审计的计划与工具调用摘要**，不暴露模型内部 Chain-of-Thought（原始需求已强调）

---

## 2. 可靠性专家

### 2.1 失败恢复
原始需求只提「失败 → 重试 → 备选」。
- ✅ 引擎级重试：仅对瞬时错误（网络/超时/进程退出）重试，最多 2 次，指数退避
- ✅ Agent 级备选：步骤失败自动切换到下一个推荐 Skill，并**为备选 Skill 重新构建输入**（按备选 Skill 的 Schema）
- ✅ Workflow 运行失败记录 `current_node` + 日志，可定位断点

### 2.2 健康监控
- ✅ 每次执行后根据最近 10 次结果推导 `healthy / degraded / down`，并写入 `health_checked_at`
- 🗺️ 定时健康检查 Job + 告警 + Agent 推荐降权联动（V3，降权逻辑已通过 usage/success 权重间接生效）

### 2.3 幂等与并发
- ✅ SQLite WAL 模式 + 外键约束
- 🗺️ 执行幂等键（client_request_id）、并发队列（V2）

### 2.4 数据备份
- 🗺️ `db:backup` 脚本（SQLite `.backup`）、保留 N 份轮转（V2 规划，脚本已预留 `scripts/` 目录）

---

## 3. 可观测性专家

### 3.1 结构化日志
- ✅ 执行记录 `logs[]`（level/message/at）+ `audit_logs`
- 🗺️ 统一 Logger + OpenTelemetry 追踪（V2）

### 3.2 指标
- ✅ Analytics：成功率、平均耗时、Top Skills、分类分布、14 天趋势、AI 推荐采纳率、工作流完成率
- 🗺️ 指标端点 `/metrics`（Prometheus 格式）+ 仪表盘（V2）

---

## 4. QA / 测试专家

### 4.1 测试金字塔
- ✅ Unit：Registry / Search / Recommendation / Execution / Agent（23 个）
- ✅ Integration：Workflow（线性 / 审批 / 条件分支）
- ✅ E2E：真实 HTTP 全链路（26 项）—— 注册 → 搜索 → 执行 → 审批 → Agent → Workflow → Analytics → 页面渲染
- ✅ Adapter 协议测试（子进程 JSON-over-stdio）

### 4.2 失败注入
- 🗺️ 混沌测试：故意断网 / 让 adapter 抛错，验证恢复链路（V2，E2E 已覆盖「审批后继续」）

---

## 5. 性能与架构专家

### 5.1 Tool / Context Explosion（原始需求 §47 已提，补充落地）
- ✅ **按需检索**：Agent 不把所有 Skill 塞进上下文，先 `Intent → Retrieval → Top-K → 仅加载匹配 Skill 的 Schema`
- ✅ 检索架构：Keyword（SQL）+ Semantic（TF-IDF + 中文 Bigram + Cosine）+ Metadata 过滤 + 使用率/成功率加权
- 🗺️ 向量库（Embedding）+ Reranker + 知识图谱（V3，模块边界已隔离在 `search.ts`）

### 5.2 模块化单体
- ✅ 单一 Next.js 应用，`core/` 领域层与 `app/api` 表现层分离，未来可拆分独立服务
- ✅ 所有领域逻辑不依赖 Next.js，可在 Node / 测试 / 脚本中直接复用

### 5.3 多 Agent / 多语言
- 🗺️ 平台不绑定语言：Adapter 协议是 JSON-over-stdio，任何语言写一个 `execute()` 即可接入（V2 起支持）

---

## 6. 产品 / UX 专家

### 6.1 信任与透明
- ✅ Agent 每次推荐都给出**推荐原因**（匹配关键词 / 历史使用 / 成功率 / 收藏 / 近期使用）
- ✅ 执行计划在执行前展示给用户确认，执行中逐步打勾
- ✅ 审批点明确提示「为什么需要审批」

### 6.2 空状态与上手引导
- ✅ Dashboard 推荐 / 最近活动 / 收藏均有空状态
- ✅ 种子 Skill + 演示工作流，让新用户开箱即用

### 6.3 多端
- 🗺️ 响应式已做基础适配（grid/列表切换），移动端 App 与桌面 App 属于 V3

---

## 7. 成本与治理专家

### 7.1 外部调用成本
- ✅ HTTP Skill 走审批门禁（默认 medium 风险）
- ✅ `AGENT_OFFLINE_ONLY` 一键断网
- 🗺️ 每 Skill 配额 / 限流 / 预算告警（V2）

### 7.2 LLM 用量
- ✅ 内置 Agent 全离线可运行（检索 + 推荐 + 计划 + 执行 + 摘要均为确定性实现）
- 🗺️ `LLM_BASE_URL / LLM_API_KEY / LLM_MODEL` 环境变量已预留，接入 OpenAI 兼容接口即可升级语义理解（无需改架构）

---

## 8. 合规专家

### 8.1 外部数据源
- ✅ 演示数据源标注 `source: offline-demo`，避免把「模拟数据」伪装成真实数据
- 🗺️ 数据源条款检查清单、来源溯源字段（V2）

### 8.2 个人信息
- 🗺️ 单用户个人平台默认无多租户；若开放多用户，需补充租户隔离 + GDPR/个保法 评估（V3）

---

## 结论

原始 Prompt 是一份优秀的产品蓝图；本补充文档把「安全边界、失败恢复、可观测性、测试、成本、合规」等
**工程化关键点**补全，并将其中 MVP 可落地部分直接实现进代码。
剩余项全部落在清晰的 V2/V3 路线中，架构边界已预先隔离，无痛升级。
