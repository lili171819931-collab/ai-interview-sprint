# 产品、模板与可公开思考链

> 目标：把学习转成可上线产品。  
> 注意：这里的“思考链”指可公开的分析框架、决策流程和检查清单，不记录模型或个人不可审计的隐藏推理。

| 项目 | 一页纸总结 |
|---|---|
| 文件定位 | 一人公司产品工具栈、MVP 模板和可公开决策链集合。 |
| 适合对象 | 想把 AI 学习转成可上线产品、可收费 MVP 和复盘资产的人。 |
| 核心内容 | 开发、部署、后端、模型、自动化、支付工具，以及 PRD/RAG/Agent/Eval 模板。 |
| 立即行动 | 选一个产品方向，填完 AI 工具型 PRD 模板，再用 MVP 上线清单验收。 |
| 关键产出 | PRD、RAG 设计、Agent 设计、Eval 测试、30 天路线和复盘资产。 |
| 关联文件 | `07-template-library-and-thinking-chains.md` 提供更完整模板库。 |

---

## 1. 一人公司 AI 产品工具栈

### 开发与编码

- Cursor：https://cursor.com/  
  用途：AI 编程、重构、调试、快速搭 MVP。
- Claude Code：https://www.anthropic.com/  
  用途：长上下文代码理解、脚本生成、复杂重构。
- Replit：https://replit.com/  
  用途：快速在线原型、轻量部署。
- v0：https://v0.dev/  
  用途：快速生成 UI 页面和组件。
- Bolt：https://bolt.new/  
  用途：浏览器内快速生成全栈原型。

### 前端与部署

- Next.js：https://nextjs.org/
- Vercel：https://vercel.com/
- Tailwind CSS：https://tailwindcss.com/
- shadcn/ui：https://ui.shadcn.com/

### 后端与数据

- Supabase：https://supabase.com/
- Neon：https://neon.tech/
- Upstash：https://upstash.com/
- Firebase：https://firebase.google.com/

### AI 模型与调用

- OpenAI：https://platform.openai.com/
- Anthropic：https://docs.anthropic.com/
- Google AI Studio：https://aistudio.google.com/
- OpenRouter：https://openrouter.ai/
- Replicate：https://replicate.com/
- Hugging Face：https://huggingface.co/

### 自动化与运营

- n8n：https://n8n.io/
- Zapier：https://zapier.com/
- Make：https://www.make.com/
- Resend：https://resend.com/
- PostHog：https://posthog.com/
- Plausible：https://plausible.io/

### 支付与商业化

- Stripe：https://stripe.com/
- Lemon Squeezy：https://www.lemonsqueezy.com/
- Paddle：https://www.paddle.com/

---

## 2. 产品模板

### AI SaaS 最小模板

- 首页：一句话价值主张 + 目标用户 + Demo 截图。
- 登录：邮箱 / Google 登录。
- 核心功能：1 个高频任务，不做大而全。
- 历史记录：用户能找回生成结果。
- 反馈入口：每次使用后可打分或留言。
- 支付入口：免费额度 + Pro 计划。
- 埋点：访问、注册、首次使用、重复使用、付费点击。

### AI 工具型产品 PRD 模板

```text
产品名称：
目标用户：
用户痛点：
当前替代方案：
AI 介入点：
输入：
输出：
核心工作流：
模型能力要求：
失败场景：
人工兜底：
MVP 范围：
不做什么：
成功指标：
上线渠道：
```

### RAG 知识库产品模板

```text
目标用户：
知识来源：
文档格式：
权限要求：
切片策略：
召回策略：
答案引用：
拒答规则：
人工反馈：
评测问题集：
上线风险：
```

### Agent 产品模板

```text
目标任务：
触发方式：
可调用工具：
禁止动作：
人工确认点：
任务拆解：
失败重试：
日志记录：
结果验收：
风险边界：
```

### Eval 评测模板

```text
任务类型：
测试样本数量：
输入样本：
标准答案或验收规则：
评分维度：
失败类型：
人工审核标准：
上线门槛：
复测频率：
```

---

## 3. 可公开思考链框架

### 3.1 AI 产品机会判断链

1. 目标用户是谁？
2. 这个痛点是否高频、刚需、愿付费？
3. 当前替代方案是什么？
4. AI 是否能把成本、速度或质量提升 10 倍？
5. 输入数据是否容易获得？
6. 输出是否容易验证？
7. 失败后果是否可控？
8. 是否能一周内做出 MVP？
9. 是否能找到 10 个真实用户试用？
10. 是否能设计收费点？

### 3.2 AI 功能可行性判断链

1. 任务是生成、检索、分类、推理、识图、语音还是执行？
2. 需要哪类模型能力？
3. 是否需要 RAG？
4. 是否需要工具调用？
5. 是否需要人工确认？
6. 数据安全风险是什么？
7. 成本是否可承受？
8. 延迟是否可接受？
9. 怎么评测效果？
10. 上线后怎么监控失败？

### 3.3 一人公司 MVP 决策链

1. 我能否 7 天内上线？
2. 我能否一个人维护？
3. 我能否用现成 API 和模板完成 80%？
4. 用户是否愿意为结果付费，而不是为技术付费？
5. 获客渠道是否明确？
6. 是否有可复用资产？
7. 是否有扩展到 B2B 或高客单价的可能？
8. 最差情况下，我能从这个项目沉淀什么？

### 3.4 Agent 风险检查链

1. Agent 能做哪些动作？
2. 哪些动作必须禁止？
3. 哪些动作必须人工确认？
4. 是否涉及支付、删除、发送、审批、隐私数据？
5. 工具权限是否最小化？
6. 是否有日志和回放？
7. 是否能在失败时停止？
8. 是否有明确验收标准？

---

## 4. 一人公司 30 天路线

### 第 1 周：建立技术地图

- 跑通 AI Chat 模板。
- 做一个 RAG Demo。
- 做一个简单 Agent。
- 写下 10 个产品方向。

### 第 2 周：做第一个 MVP

- 选一个细分用户。
- 访谈 5 个人。
- 搭核心功能。
- 部署上线。

### 第 3 周：验证需求

- 找 10 个真实用户。
- 收集失败案例。
- 补评测集。
- 加埋点和反馈。

### 第 4 周：商业化

- 加支付或留资。
- 写落地页。
- 做 3 个渠道测试。
- 决定继续、转向或砍掉。

---

## 5. 每个项目都要沉淀的资产

- 1 份 PRD。
- 1 份 Prompt。
- 1 份 Eval 测试集。
- 1 份用户访谈记录。
- 1 份竞品拆解。
- 1 份上线复盘。
- 1 个可复用组件。
- 1 个可讲给面试官或客户听的故事。

