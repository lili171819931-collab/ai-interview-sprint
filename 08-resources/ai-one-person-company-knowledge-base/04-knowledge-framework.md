# AI 一人公司知识库总框架

> 路径：学习 → 复刻 → 改造 → 上线 → 验证 → 商业化。  
> 使用方式：每个模块只学到“能解释、能复刻、能产出”为止，不以收藏资料为目标。

---

## 1. AI 基础知识地图

- 解决问题：建立 AI 产品共同语言，能和工程、客户、投资人沟通。
- 核心概念：LLM、Token、上下文窗口、Embedding、RAG、Agent、Tool Calling、多模态、Eval、幻觉、成本。
- 最少资料：OpenAI Docs、Anthropic Docs、DeepLearning.AI Generative AI for Everyone。
- 复刻项目：Vercel AI Chatbot。
- 小练习：画出“用户输入 → 模型 → 工具 → 数据库 → 输出”的链路图。
- 推荐输出物：1 页 AI 产品技术地图。
- 优先级：P0。

## 2. AI 模型分类与选型

- 解决问题：知道什么任务该选什么模型，避免用错工具。
- 核心概念：通用 LLM、推理模型、代码模型、多模态、图像、视频、语音、Embedding、Agent、垂直模型。
- 最少资料：`../ai-model-capability-taxonomy-and-selection.md`、Artificial Analysis、LMArena、OpenRouter。
- 复刻项目：多模型 Chat + 模型切换。
- 小练习：用同一任务对比 3 个模型的质量、速度和成本。
- 推荐输出物：模型选型评分表。
- 优先级：P0。

## 3. Prompt Engineering

- 解决问题：把模糊需求变成稳定输出。
- 核心概念：角色、上下文、输入输出格式、约束、示例、结构化输出、拒答规则、迭代提示。
- 最少资料：DeepLearning.AI Prompt Engineering、OpenAI Cookbook、Anthropic Prompt Engineering。
- 复刻项目：Prompt 模板库。
- 小练习：把一个随意 Prompt 改成可复用 Prompt，并测试 10 个样本。
- 推荐输出物：Prompt Card。
- 优先级：P0。

## 4. RAG / 知识库

- 解决问题：让 AI 基于私有资料回答，而不是凭空生成。
- 核心概念：文档解析、切片、Embedding、向量库、召回、重排、引用、权限、评测集。
- 最少资料：LlamaIndex Docs、LangChain RAG Docs、OpenAI Cookbook RAG 示例。
- 复刻项目：LlamaIndex 文档问答或 RAGFlow。
- 小练习：用 20 份 PDF 搭一个带引用的问答系统。
- 推荐输出物：RAG 产品设计文档 + 20 条评测问题。
- 优先级：P0。

## 5. Agent / 工具调用 / 自动化

- 解决问题：让 AI 不只回答，还能执行多步骤任务。
- 核心概念：Tool Calling、状态、记忆、计划、执行、人工确认、权限、日志、失败重试。
- 最少资料：LangGraph Docs、AutoGen、CrewAI、MCP。
- 复刻项目：竞品调研 Agent 或日报 Agent。
- 小练习：设计一个“搜索 → 摘要 → 生成报告 → 人工确认”的 Agent。
- 推荐输出物：Agent 设计卡 + 工具权限表。
- 优先级：P1。

## 6. AI 应用开发

- 解决问题：把 AI 能力做成可用产品。
- 核心概念：Next.js、API Route、流式输出、文件上传、数据库、认证、部署、日志。
- 最少资料：Vercel AI SDK、Supabase Docs、shadcn/ui、Stripe Docs。
- 复刻项目：Vercel AI Chatbot + Supabase。
- 小练习：上线一个带登录、聊天、历史记录的 AI Web App。
- 推荐输出物：可访问 Demo 链接。
- 优先级：P0。

## 7. AI SaaS 商业化

- 解决问题：从 Demo 变成能收费的产品。
- 核心概念：定价、免费额度、订阅、支付、发票、留资、邮件、埋点、转化漏斗。
- 最少资料：Stripe Samples、Open SaaS、Y Combinator Library、Lenny's Newsletter。
- 复刻项目：Open SaaS。
- 小练习：给 AI 工具加一个 Pro 计划和支付按钮。
- 推荐输出物：Landing Page + Pricing Page。
- 优先级：P1。

## 8. 一人公司运营系统

- 解决问题：让一个人持续发现需求、发布产品、获客和复盘。
- 核心概念：周节奏、任务系统、内容分发、用户反馈、财务记录、自动化。
- 最少资料：Company of One、Million Dollar Weekend、Indie Hackers。
- 复刻项目：n8n 自动化运营流。
- 小练习：搭一个“用户反馈 → 分类 → 通知 → 入库”的自动化。
- 推荐输出物：一人公司周看板。
- 优先级：P1。

## 9. 用户研究与需求验证

- 解决问题：避免做没人要的产品。
- 核心概念：用户画像、Jobs To Be Done、替代方案、痛点频率、付费意愿、访谈。
- 最少资料：The Mom Test、Y Combinator 用户访谈内容。
- 复刻项目：用户访谈表 + 反馈分析 Agent。
- 小练习：访谈 5 个目标用户，提取 10 个原话痛点。
- 推荐输出物：用户洞察卡。
- 优先级：P0。

## 10. 增长、销售与定价

- 解决问题：解决“产品上线没人用、没人付费”。
- 核心概念：渠道、冷启动、内容营销、SEO、社区、冷邮件、定价锚点、转化率。
- 最少资料：Traction、Lenny's Podcast、Product Hunt、Hacker News。
- 复刻项目：Landing Page + 3 个渠道测试。
- 小练习：写 3 个不同渠道的发布文案。
- 推荐输出物：增长实验表。
- 优先级：P1。

## 11. 风险、合规与数据安全

- 解决问题：降低隐私、版权、合规、幻觉和误操作风险。
- 核心概念：数据留存、训练使用政策、PII、权限、审计、版权、拒答、人工兜底。
- 最少资料：OpenAI / Anthropic 数据政策、云厂商合规文档、中国信通院报告。
- 复刻项目：Agent 权限白名单。
- 小练习：为一个 AI 产品写“禁止动作”和“人工确认点”。
- 推荐输出物：风险清单。
- 优先级：P0。

## 12. 可公开思考链与决策模板

- 解决问题：把判断过程显性化，便于复盘、沟通和迭代。
- 核心概念：机会判断链、功能可行性链、模型选型链、RAG/Agent 必要性判断、商业化判断、风险检查。
- 最少资料：`03-products-templates-thinking-chain.md`、本目录模板库。
- 复刻项目：产品决策记录模板。
- 小练习：给一个产品方向跑完整判断链。
- 推荐输出物：决策记录。
- 优先级：P0。

---

## 最小学习闭环

1. 学一个概念。
2. 找一个开源实现。
3. 本地跑起来。
4. 改成自己的场景。
5. 写 1 页复盘。
6. 发给 1 个真实用户。

