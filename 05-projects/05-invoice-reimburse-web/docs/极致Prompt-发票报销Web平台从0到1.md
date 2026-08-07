# 极致 Prompt：发票报销 Web 平台 · 从 0 到 1

> 可直接整段复制给 Cursor / Claude / GPT 执行。  
> 目标：在明确范围内部署可运行、可演示、可扩展的 **发票报销 Web 平台 MVP**，覆盖类目体系、情景模式、合规引擎与思维链流水线。  
> 前序领域资产可复用：`05-projects/04-workbuddy-invoice-reimburse/`（类目/情景/制度基线），但本任务交付物是 **Web 产品**，不是 WorkBuddy Skill。

---

```markdown
# Role
你是一名同时具备 B 端产品、财务域、交互设计、全栈工程与 AI 应用架构能力的负责人。
你的任务不是堆功能，而是在时间盒内从 0 到 1 交付「发票报销 Web 平台」MVP，并完成：
1) 可本地运行的 Web 应用（前后端或全栈）
2) 完整领域模型：费用类目、票种、情景模式、合规状态机
3) AI/OCR 辅助抽取 + 规则引擎合规（数字不可被模型改写）
4) 核心页面与主路径可演示
5) README + 验收清单 + 本 Prompt 自洽可再执行

你必须：先收敛范围 → 再定领域规则 → 再定信息架构 → 再定数据模型/API → 再落页面与代码 → 最后验收演示。
任何取舍优先：「更短路径、更可演示、财务可信、更少幻觉、更可测试」。

---

# 一、成功定义（Done）
同时满足才算完成：

## 产品/工程
- [ ] 用户可注册/登录（MVP 可用本地账号或演示账号）
- [ ] 可创建报销单（选择期间、事由、情景模式）
- [ ] 可上传发票（图片/PDF，单张+批量）
- [ ] 每张票可查看/编辑结构化字段
- [ ] 自动归类到一级/二级费用科目（可手改）
- [ ] 合规引擎输出：可报 / 限报 / 拒报 + 原因
- [ ] 去重检测（发票号码优先）
- [ ] 金额勾稽：金额+税额≈价税合计（容差 0.01）
- [ ] 报销单汇总：可提交金额、待确认、拒报分列
- [ ] 导出：CSV/Excel 至少一种 + 审批摘要 Markdown/页面
- [ ] 空状态 / 上传中 / 识别中 / 失败态齐全
- [ ] 演示数据可一键载入

## 文档与可运行
- [ ] README：10 分钟内安装启动
- [ ] 环境变量示例（.env.example），不提交真实密钥
- [ ] 验收清单可勾选
- [ ] 30 秒 / 2 分钟演示脚本
- [ ] 明确 Won’t（防膨胀）

## 非目标（本次不做）
- ❌ 对接真实税务局验真 API（可预留接口，MVP 标 unverified）
- ❌ 完整企业组织架构/复杂审批流引擎（MVP 仅：草稿→已提交→已通过/已驳回）
- ❌ 原生 App / 小程序
- ❌ 电子签章、支付打款
- ❌ 多租户计费与权限中台
- ❌ 境外多币种完整会计处理（可留字段，不做深逻辑）

---

# 二、一句话定位与用户

## 定位句
「把散落的发票变成一张财务愿意批的报销单：自动识别、自动归类、自动找风险。」

## 用户
1. **报销人（主）**：员工/PM/销售，要快速交单
2. **审批人（次）**：主管，要 1 屏看懂金额与风险
3. **财务（次）**：要台账、合规原因、可导出

## 核心价值主张
- 对报销人：少填表、少被驳回
- 对审批人：风险可见、依据可读
- 对财务：字段标准、可追溯、可导出

---

# 三、时间盒作战（默认 1 个工作日可演示；可压缩为 4–6 小时骨架）

## T0–T20：冻结 MVP
输出：品牌名（默认 ReimburseLab / 票易报）、Must/Should/Won’t、页面清单、情景模式范围

## T20–T50：领域规则写死
输出：类目字典、票种枚举、合规基线、状态机、置信度门禁

## T50–T80：信息架构 + 关键路径
输出：页面流、组件清单、主路径时序图

## T80–T120：数据模型 + API 契约
输出：ER/表结构或 schema、REST/Server Actions 列表

## T120–T280：可运行实现
输出：上传→识别→归类→合规→提交→导出全链路

## T280–T320：演示数据 + 验收
输出：seed、QA checklist、演示脚本、README

---

# 四、费用类目体系（必须实现为可配置字典）

## 4.1 一级科目（代码稳定，文案可 i18n）
TRAVEL 差旅 | TRANSPORT 市内交通 | MEAL 餐饮餐补 | ENTERTAIN 业务招待 |
OFFICE 办公用品 | COMM 通讯网络 | TRAINING 培训学习 | WELFARE 员工福利 |
IT 软件设备 | MARKETING 市场推广 | LOGISTICS 快递物流 | MEDICAL 医药体检 | OTHER 其他

## 4.2 二级科目（MVP 至少覆盖高频）
- TRAVEL: 机票、火车票、酒店、出差打车、机场交通
- TRANSPORT: 网约车、地铁公交、停车
- MEAL: 工作餐、加班餐
- ENTERTAIN: 客户宴请、商务赠礼
- OFFICE: 文具、打印耗材
- IT: SaaS、云资源、配件
- 其他一级可先只有「默认」二级，允许后续扩展

## 4.3 票种枚举
VAT_SPECIAL | VAT_NORMAL | E_VAT | DIGITAL_VAT | TRAIN | FLIGHT | TAXI | QUOTA | POS_RECEIPT | OVERSEAS | UNKNOWN

## 4.4 归类启发式（规则优先，模型建议可覆盖但需可手改）
```
酒店/宾馆 → TRAVEL/酒店
铁路/航空 → TRAVEL/交通
餐饮 + 事由含客户/宴请 → ENTERTAIN
餐饮 + 加班/工作餐 → MEAL
文具/办公 → OFFICE
云/SaaS → IT
小票收据 → POS_RECEIPT 且默认拒报
无法判断 → OTHER + confidence=low + 待确认
```

---

# 五、情景模式（Scenario Modes）——产品功能开关

平台必须支持模式选择（创建报销单时单选或组合标签）：

| Mode | 名称 | 产品表现 |
|------|------|----------|
| A | 单票速报 | 上传 1 张 → 立即给可报结论 |
| B | 批量月结 | 默认主模式：多票→台账→汇总提交 |
| C | 差旅全包 | 增加行程轴 UI；检查交通/住宿日期一致性与缺票 |
| D | 招待审查 | 增加对象/人数/人均；超标标黄 |
| E | 专票进项 | 专票分栏；税额汇总；抬头税号校验加强 |
| F | 驳回重提 | 从已驳回单克隆；展示驳回原因与变更对照 |
| G | 审计抽查 | 只读风险工单列表（重复/拆票/异常） |
| H | 制度测算 | 独立小工具页：问规则+举例（可后置） |
| I | 境外多币种 | MVP 仅字段预留 |
| J | 垫付清算 | 展示应付个人金额确认 |

MVP Must 实现：A、B、C、D、F（基础）  
Should：E、G  
Won’t 深做：H、I、J（可入口灰显或简版）

---

# 六、端到端思维链（系统流水线，必须工程化）

这是平台后端/领域服务的 Stage Gate，不是给用户看的长推理。
每个 Stage 有输入、输出、失败降级。

## Stage 0 意图/模式
- 输入：用户选择的 Mode + 事由
- 输出：claim.mode_tags, required_slots
- 降级：缺 P0 槽位时阻断提交，允许保存草稿

## Stage 1 材料接收
- 输入：文件上传
- 输出：Attachment 记录（hash、mime、size、status）
- 动作：病毒扫描可后置；计算 SHA256 用于去重

## Stage 2 票面抽取 Extract
- 输入：Attachment
- 输出：InvoiceDraft 字段 + confidence
- 实现策略（按可用性降级）：
  1. 若有 OCR/票据 API Key → 调用
  2. 否则用 PDF 文本解析（电子票）
  3. 再否则：演示模式用 mock 抽取 + 手动编辑
- **硬规则**：模型不得直接写入最终 amount；必须进 Draft，经校验后才 commit

## Stage 3 归一去重
去重键：
1) invoice_code + invoice_number / digital number
2) seller + date + amount_incl_tax
3) file sha256
- 输出：duplicate | suspected_duplicate | unique

## Stage 4 归类 Classify
- 规则引擎打一级/二级；可选 LLM 建议 secondary + notes
- 用户手改优先于自动结果，并记录 source=user|rule|model

## Stage 5 合规 Compliance
按序检查并写 compliance_status + reasons[]：
1. 抬头 vs 公司 legal_name
2. 日期是否在报销期间
3. 限额/人均/舱位（读 policy）
4. 事前审批阈值
5. 高风险消费关键词
6. 拆票/重复模式
7. 金额勾稽
状态：compliant | conditional | non_compliant

## Stage 6 金额编排
```
claimable = sum(suggested_claim_amount where status in compliant/conditional_confirmed)
pending = low confidence or needs_user_input
rejected = non_compliant + duplicate
```

## Stage 7 填单 Compose
生成：审批摘要、明细台账、附件清单

## Stage 8 提交与状态机
Draft → Submitted → Approved / Rejected → (Rework) Draft
Rejected 必须有 reason；Rework 走 Mode F

## Stage 9 自检
提交前自动跑：加总一致、low 未混入可提交、差旅缺票提示

## Stage 10 导出/归档
导出 CSV/Excel；文件名建议：
`YYYYMMDD_科目_销售方_金额_票号后6位.ext`

### 置信度门禁
- high ≥ 0.90：可自动入可提交
- mid 0.70–0.89：可入但 UI 标黄
- low < 0.70：待确认，禁止进入可提交合计

---

# 七、合规基线（可配置，写入 DB 或 policy JSON）

## 硬规则
1. 购买方抬头必须匹配公司全称（支持简称映射表）
2. amount_excl_tax + tax_amount ≈ amount_incl_tax（±0.01）
3. 相同发票号只能报一次（跨单去重，至少同用户范围内）
4. POS_RECEIPT 默认 non_compliant
5. verification_status 默认 unverified；UI 不得显示「已验真」除非真调用成功

## 差旅默认（可改）
- 酒店：一线 600 / 新一线 450 / 其他 350（每晚）
- 高铁默认二等座；更高需职级或特批标记
- 机票默认经济舱

## 招待默认
- 人均上限 200（可配）
- 无对象/人数 → conditional
- 高风险娱乐关键词 → non_compliant
- ≥1000 无事前审批 → conditional

## 风险分
重复+30，抬头不符+20，周末大额无事由+15，拆票+15，低置信+10，超标+10
≥60 高 / 30–59 中 / <30 低

---

# 八、信息架构与页面（≤ 7 个主页面）

1. **登录/演示入口** `/login`
2. **工作台** `/`：我的草稿、待审批、本月金额、风险数
3. **新建报销单** `/claims/new`：期间、事由、模式、公司主体
4. **报销单详情** `/claims/[id]`：主战场
   - 上传区
   - 票据列表（状态色：绿可报/黄限报或待确认/红拒报）
   - 右侧或底部：汇总与审批摘要
   - 票详情抽屉：字段编辑、合规原因、置信度
5. **审批台** `/approvals`（可用同一详情+角色视图）
6. **制度/科目设置** `/settings/policy`：公司抬头、限额、简称映射（MVP 简易表单）
7. **导出中心**（可做详情页按钮，不必独立页）

## 报销单详情主路径（必须丝滑）
上传 → 显示识别中 → 列表出现票 → 自动归类/合规 → 用户改待确认项 → 一键提交 → 审批摘要可复制/导出

## 首屏信息预算（详情页）
只放：报销单标题/期间、上传入口、票列表、汇总金额、主 CTA（保存草稿/提交）。
禁止首屏堆：运营 banner、无用统计墙、复杂图表。

---

# 九、数据模型（逻辑 Schema）

## User
id, name, email, department, role(employee|manager|finance|admin)

## CompanyProfile
legal_name, taxpayer_id, alias_map(json)

## Policy
version, hotel_limits(json), entertainment_per_capita, pre_approval_threshold, rules(json)

## Claim（报销单）
id, user_id, title, period_start, period_end, purpose, modes[], project_code?,
status(draft|submitted|approved|rejected),
total_claimable, total_pending, total_rejected, total_tax,
rejection_reason?, created_at, updated_at

## Invoice
id, claim_id, attachment_id,
invoice_type, invoice_code, invoice_number, invoice_date,
seller_name, seller_tax_id, buyer_name, buyer_tax_id,
amount_excl_tax, tax_amount, amount_incl_tax, currency,
primary_category, secondary_category, scene_tags[],
compliance_status, compliance_reasons[], risk_score,
suggested_claim_amount, confidence, verification_status,
dedupe_status, source_field_map(json), needs_user_input[],
notes, created_at

## Attachment
id, claim_id, filename, mime, size, sha256, storage_url, ocr_status

## AuditLog
id, actor_id, entity_type, entity_id, action, diff(json), created_at

---

# 十、API 契约（示例，可按框架改名）

POST   /api/auth/login
GET    /api/claims
POST   /api/claims
GET    /api/claims/:id
PATCH  /api/claims/:id
POST   /api/claims/:id/attachments          # multipart
POST   /api/claims/:id/extract              # 触发识别流水线
PATCH  /api/invoices/:id                    # 手改字段并重跑合规
POST   /api/claims/:id/submit
POST   /api/claims/:id/decide               # approve/reject
GET    /api/claims/:id/export?format=csv
GET    /api/policy
PUT    /api/policy

所有写操作记 AuditLog。

---

# 十一、技术选型（默认，可论证后替换，但需可运行）

优先选你环境最稳的一套，推荐：

**方案 A（推荐演示速度）**
- Next.js (App Router) + TypeScript + Tailwind
- ORM：Prisma + SQLite（本地零门槛）/ Postgres
- 上传：本地 `uploads/` 或 S3 兼容（MVP 本地）
- UI：简洁 B 端工具风；状态色清晰；不要紫白渐变模板脸
- OCR：接口可插拔；无 Key 时启用 MockExtractor + 手动编辑
- 校验：纯 TypeScript 规则引擎（deterministic），单测覆盖勾稽/去重

**方案 B**
- Vite React + NestJS/FastAPI
- 同样 SQLite/Postgres

硬性要求：
- monorepo 或单仓均可，但 README 一条命令启动
- `pnpm dev` / `npm run dev` 可跑
- 提供 seed：`npm run seed` 生成演示报销单与 3–5 张模拟发票

---

# 十二、AI 使用边界（防幻觉，产品级）

## 允许 AI/OCR 做的事
- 从票面建议字段
- 建议科目与备注
- 生成「审批摘要」自然语言（必须引用已校验数字）

## 禁止 AI 做的事
- 直接修改已提交金额而不经规则引擎
- 伪造验真
- 在缺票时编造行程或发票号
- 输出无依据的「一定能报销」

## 生成审批摘要 Prompt（系统内置）
```
你是财务审批摘要助手。只能使用给定 JSON 中的数字与原因，禁止发明发票号与金额。
输出≤1屏中文：报销人、期间、票数（可提交/待确认/拒报）、申请金额、主要事由、高风险项、建议决策。
```

事实层：Claim + Invoices 聚合 JSON（规则计算）  
生成层：摘要句子  
校验层：摘要中的金额必须能在 JSON 中找到，否则降级为模板摘要

---

# 十三、交互与视觉（工具型产品）

- 气质：冷静可信的财务工具，不是消费级运营页
- 色彩：定义 CSS 变量；成功/警告/危险状态明确；避免模板紫、霓虹光效
- 字体：选用清晰的无衬线产品字体（可 Inter 以外的现代字体，如 Geist / IBM Plex / Source Han 搭配）
- 票据行：一屏扫清状态；点击展开编辑
- 动效：上传进度、识别完成、状态切换 2–3 处即可
- 移动端：详情页可用，但 MVP 以桌面为主（≥1280 舒适）

---

# 十四、演示脚本

## 30 秒
登录演示账号 → 打开「8 月差旅报销」→ 看到 4 张票状态色 → 展示汇总可提交金额 → 打开审批摘要

## 2 分钟
新建报销单（Mode B+C）→ 上传 2 张图（或拖入 demo files）→ 识别 → 改一张待确认抬头 → 看合规原因 → 提交 → 导出 CSV

---

# 十五、验收清单（QA）

功能：
- [ ] 上传 PDF/JPG 成功
- [ ] 识别失败可手动录入并保存
- [ ] 改金额后勾稽失败会标红
- [ ] 重复发票号出现重复提示
- [ ] 小票默认拒报
- [ ] 招待缺人数 → conditional
- [ ] 提交后不可再改字段（除非驳回重提）
- [ ] 驳回后可重提并保留历史原因
- [ ] 导出含票号、科目、合规状态、金额

工程：
- [ ] 新 clone 按 README 可启动
- [ ] .env.example 齐全
- [ ] 无密钥进仓库
- [ ] 关键规则有单元测试（勾稽、去重、置信度门禁）

---

# 十六、目录建议

```
invoice-reimburse-web/
  README.md
  .env.example
  package.json
  prisma/schema.prisma
  src/
    app/                 # pages
    components/
    server/
      extractors/        # mock + provider
      compliance/        # rules engine
      pipeline/          # stage 0-10
    lib/
      categories.ts
      scenarios.ts
      money.ts
    styles/
  public/demo-invoices/
  docs/
    验收清单.md
    演示脚本.md
    极致Prompt-....md
  tests/compliance.test.ts
```

---

# 十七、执行纪律（对编码 Agent）

1. 先写 `categories.ts` / `compliance` 规则与测试，再写 UI
2. 先打通「手动录入发票 → 合规 → 提交 → 导出」，再接 OCR
3. OCR 无 Key 时必须 Mock，保证演示不崩
4. 每完成一阶段更新 README「如何运行」
5. 不要实现 Won’t 列表
6. 所有金额计算用整数分（cents）或 decimal 库，避免浮点误差
7. 中文 UI；代码标识符英文
8. 提交信息清晰；不写无关注水文档

---

# 十八、启动后你要输出给我的东西

1. 本地访问 URL
2. 演示账号
3. 已实现 Mode 列表
4. 未实现但预留的点
5. 下一步最值得做的 3 件事（验真 API / 审批流 / 制度配置增强）

---

# 十九、一键开干指令（复制即用）

请按本 Prompt 从 0 到 1 搭建「发票报销 Web 平台」MVP。
技术栈用 Next.js + TypeScript + Prisma + SQLite + Tailwind。
先实现规则引擎与手动录入闭环，再加 Mock OCR 与上传。
Must Mode：A/B/C/D/F。
完成后给出启动命令、演示脚本与验收勾选结果。
```

---

## 附：与 WorkBuddy 版的关系

| | WorkBuddy Skill 版 | 本 Web 平台版 |
|--|-------------------|---------------|
| 形态 | 桌面 Agent 技能 | 多用户 Web 产品 |
| 交互 | 对话+本地文件 | 页面+上传+状态机 |
| 同类目/情景/CoT | 是（领域同源） | 是（工程化为模块） |
| 交付 | 报销包文件 | 系统内单据+导出+审批 |

领域字典可直接移植自：
`05-projects/04-workbuddy-invoice-reimburse/skills/invoice-reimbursement/references/`
