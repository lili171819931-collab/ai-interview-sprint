# 08 · 发票报销三载体对比分析报告

> 对照仓库：[`04-workbuddy-invoice-reimburse`](../04-workbuddy-invoice-reimburse/) · [`05-invoice-reimburse-web`](../05-invoice-reimburse-web/) · 本目录（06）+ [`piaoji-mini`](../../ai-projects/products/piaoji-mini/)  
> 结论先行：三者**不是互斥竞品**，而是同一报销领域能力（类目 · 情景 · 合规 CoT）的分层载体。  
> 📄 合并版：**[04/05/06 发票报销三平台合集](../04-05-06-发票报销三平台合集.md)**（三平台实现汇总）

---

## 1. 核心结论

| 载体 | 证明什么 | 仓库均分（相对 1–5） |
|------|----------|----------------------|
| **04 Skill** | Agent / Prompt 边界：不幻觉乱填金额，仍能出可验收包 | **2.5** |
| **05 票易报 Web** | 团队系统：多角色审批、驳回重提、合规单测可跑 | **4.0** |
| **06 票迹小程序** | 员工侧闭环 + 上线路径 + 商业 Conditional Go | **4.5** |

**面试主叙事建议**：以 **06** 为商业/上线锚，以 **05** 为工程可运行锚，以 **04** 为 AI 边界与 Prompt 工程锚。  
**真做生意建议**：员工入口用 06，审批后台演进 05，04 下沉为对内 Agent/制度助手。

---

## 2. 产品名片

### 04 · WorkBuddy Skill（发票报销智能专员）

| 项 | 内容 |
|----|------|
| 路径 | [`../04-workbuddy-invoice-reimburse/`](../04-workbuddy-invoice-reimburse/) |
| 载体 | 对话 Agent / Skill |
| 角色 | 个人生产力：对话整理票据 → 输出报销包文件 |
| 跑法 | 依赖 WorkBuddy 运行时导入 Skill |
| 技术 | Prompt + Markdown references + Python 校验脚本 |
| 优势 | 启动最快；领域 CoT / 制度模板文档最完整 |
| 缺口 | 无多人审批、无持久状态机、难审计、无法单仓 demo |

### 05 · 票易报 Web

| 项 | 内容 |
|----|------|
| 路径 | [`../05-invoice-reimburse-web/`](../05-invoice-reimburse-web/) |
| 载体 | Next.js Web 系统 |
| 角色 | 团队协作：单据 + 审批 + 导出 + 留痕 |
| 跑法 | `npm run setup && npm run dev` → http://localhost:3000 |
| 技术 | Next.js 15 · Prisma · SQLite · Vitest |
| 优势 | 可运行审批闭环、合规单测、Dockerfile/Vercel/Render 示意 |
| 缺口 | 商业方案深度弱于 06；员工侧邮箱收票叙事弱于小程序 |

### 06 · 票迹 Piaoji（本目录 + 小程序源码）

| 项 | 内容 |
|----|------|
| 路径 | 本目录 · 源码 [`piaoji-mini`](../../ai-projects/products/piaoji-mini/) |
| 载体 | 微信原生小程序 + 项目包装文档 |
| 角色 | 员工侧：收票 → 对账 → 合规 → HR 报销包 |
| 跑法 | 微信开发者工具打开 `products/piaoji-mini` |
| 技术 | 微信小程序 · wx.storage · mail/OCR mock |
| 优势 | 上线路径 + Case01–15 + [`07-commercial-plan.md`](07-commercial-plan.md) 最完整 |
| 缺口 | 审批流弱于 Web；真邮箱/OCR 仍为 mock |

---

## 3. 综合得分（相对 1–5）

> 评分口径：当前仓库交付物完备度自评，**非**市场调研绝对值。

| 维度 | 04 Skill | 05 Web | 06 小程序 |
|------|----------|--------|-----------|
| 可演示闭环 | 3 | 5 | 5 |
| 多人协作/审批 | 1 | 5 | 2 |
| 员工侧采集 | 2 | 3 | 5 |
| 合规可解释 | 5 | 4 | 5 |
| 工程可运行 | 2 | 5 | 4 |
| 商业叙事 | 2 | 3 | 5 |
| 上线/分发路径 | 1 | 3 | 5 |
| 面试可讲深度 | 4 | 4 | 5 |
| **均分** | **2.5** | **4.0** | **4.5** |

---

## 4. 能力矩阵

| 能力项 | 04 Skill | 05 票易报 Web | 06 票迹小程序 |
|--------|----------|---------------|---------------|
| 发票识别（Mock OCR） | 文档流程 | 已实现上传+抽取 | 已实现拍照/邮件 mock |
| 类目 / 情景模式 | references 完整 | 情景 Mode 产品化 | 8 情景 + 品类树 |
| 合规引擎 | policy-template + CoT | 规则分桶 + Vitest | policy.js + 风险拆单 |
| 票账关联 | Prompt 指导 | 金额勾稽 | Top3 匹配建议 |
| 审批流 | 无 | 提交/批/驳回重提 | 无（导出给 HR） |
| HR 交付物 | 文件目录产物 | CSV + 摘要 | 说明+CSV+ZIP/manifest |
| 多人角色 | 单会话 | 报销人/审批人 | 单用户演示为主 |
| 商业方案 | 弱 | 竞品/指标有 | 07-commercial Conditional Go |
| 测试 | 脚本示例 | compliance.test.ts | Node mock 验收脚本 |

---

## 5. 用户与价值主张

| 维度 | 04 Skill | 05 Web | 06 小程序 |
|------|----------|--------|-----------|
| 主用户 | 个人整理票据 | 报销人 + 审批人 | 员工；企业/财务付费 |
| Jobs to be Done | 快速生成可交材料 | 一次过审的团队单据 | 收齐票账并交给 HR |
| 信任机制 | 不臆造金额；分桶标记 | 规则引擎 + 审批留痕 | 风险前置 + 可解释 CoT |
| 交付物 | `_报销输出/` 文件包 | CSV + 审批摘要 | HR 说明 + CSV + ZIP 结构 |
| 商业化 | 偏能力资产 | 可演进 SaaS 系统 | 已有 Conditional Go 方案 |

---

## 6. 何时用哪一个

| 场景 | 推荐 |
|------|------|
| 证明 Prompt/Agent 边界、制度模板迭代 | **04** |
| 对工程面试官现场跑 localhost、讲审批/驳回 | **05** |
| 讲微信获客、体验版上线、90 天付费试点 | **06** |

---

## 7. 作品集推荐讲法（90 秒）

> 同一套报销领域能力，我做成了三种载体：Skill 验证 Agent 如何不幻觉乱填金额；Web 验证团队审批与留痕；微信小程序验证员工收票到 HR 包，并给出 Conditional Go 的商业验证计划。我刻意不做合思级中台，先证明一次通过率。

**深挖优先级**：P0 商业/上线 → 06 · P0 工程运行 → 05 · P1 Prompt 工程 → 04  

**避免**：把三款讲成三个无关项目；应强调「同源模型、不同约束下的产品取舍」。

---

## 8. 风险与缺口

| 风险 | 影响 | 主要落在 | 缓解 |
|------|------|----------|------|
| OCR/验真仍 mock | 生产可信度不足 | 05 / 06 | 状态机已预留；90 天接通一家 provider |
| 品牌名不统一（票易报 vs 票迹） | 叙事略散 | 05 vs 06 | 对外统一领域名，对内保留载体品牌 |
| 审批与员工侧割裂 | 端到端需两套演示 | 05 vs 06 | 面试讲清边界；中期企微提单打通 |
| 04 无独立运行时 | 无法单仓 demo | 04 | 与 05 对照演示；Skill 作方法论文档 |

---

## 9. 战略建议

| 阶段 | 动作 |
|------|------|
| 短期（作品集/面试） | 三载体并存；主推 06 商业 + 05 可运行 |
| 中期（真做生意） | 06 员工入口获客 → 数据沉淀进 05 式审批后台；04 作对内 Agent |
| 不做 | 一次做成合思级全量费控中台 |

---

## 10. 相关链接

| 资源 | URL |
|------|-----|
| 04 Skill | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/04-workbuddy-invoice-reimburse |
| 05 Web | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/05-invoice-reimburse-web |
| 06 本目录 | https://github.com/lili171819931-collab/ai-interview-sprint/tree/main/05-projects/06-piaoji-product |
| 票迹源码 | https://github.com/lili171819931-collab/ai-projects/tree/main/products/piaoji-mini |
| 路径对照 | [`../../PATH-MAP.md`](../../PATH-MAP.md) |
| 商业方案 | [`07-commercial-plan.md`](07-commercial-plan.md) |
