# AI 一人公司知识库

> 目标：快速掌握 AI 相关知识，并能迅速开发、发布、验证一个可商业化的 AI 产品。  
> 适用人群：AI 产品经理、独立开发者、一人公司创业者、正在从 PM 走向 AI Builder 的学习者。  
> 使用原则：先跑通产品闭环，再补技术深度；先复用优秀开源与成熟工具，再做自研。

| 项目 | 一页纸总结 |
|---|---|
| 文件定位 | AI 一人公司知识库的总入口，负责说明目录结构、学习路径和使用原则。 |
| 适合对象 | 想快速掌握 AI、复刻开源项目、上线 AI 产品、探索一人公司的 PM / 独立开发者。 |
| 核心内容 | 最短路径、知识库文件地图、一人公司选型原则、每周行动闭环。 |
| 立即行动 | 从 `01` 选一个开源项目跑通，再用 `06` 选择一个 7 天 MVP 方向。 |
| 关键产出 | 一个可访问 Demo、10 个真实用户反馈、1 个可讲的商业化故事。 |
| 关联文件 | `04-knowledge-framework.md`、`06-30-day-roadmap-and-product-ideas.md`、`极致Prompt-AI一人公司知识库与产品开发.md`。 |

---

## 1. 最短路径

### 第 1 阶段：掌握基本地图

- 学 AI 模型类型、RAG、Agent、Eval、Prompt、Tool Calling、成本与安全。
- 产出：能解释一个 AI 产品为什么可行、怎么验证、怎么上线。
- 配套文件：[`../ai-model-capability-taxonomy-and-selection.md`](../ai-model-capability-taxonomy-and-selection.md)

### 第 2 阶段：复刻优秀项目

- 选 1 个开源项目跑通：AI Chat、RAG 知识库、Agent 工作流、AI SaaS 模板。
- 产出：一个可演示 Demo，而不是只收藏链接。
- 配套文件：[`01-open-source-and-agent-stack.md`](./01-open-source-and-agent-stack.md)

### 第 3 阶段：组合工具做 MVP

- Cursor / Claude / GPT / Vercel / Supabase / Stripe / Resend / PostHog / OpenRouter 组合。
- 产出：登录、核心 AI 功能、支付或留资、埋点、反馈入口。
- 配套文件：[`03-products-templates-thinking-chain.md`](./03-products-templates-thinking-chain.md)

### 第 4 阶段：形成一人公司操作系统

- 每周固定：发现痛点、验证需求、快速上线、收集反馈、复盘迭代。
- 产出：一个真实在线产品 + 10 个真实用户反馈 + 1 个可讲商业故事。
- 配套 Prompt：[`极致Prompt-AI一人公司知识库与产品开发.md`](./极致Prompt-AI一人公司知识库与产品开发.md)

---

## 2. 知识库文件地图

- [`01-open-source-and-agent-stack.md`](./01-open-source-and-agent-stack.md)  
  GitHub 优秀开源代码作品、Agent 框架、RAG/Chat/SaaS 模板与学习顺序。

- [`02-authors-courses-books-sites.md`](./02-authors-courses-books-sites.md)  
  推荐作者、YouTube 频道、课程、书籍、网站与信息源。

- [`03-products-templates-thinking-chain.md`](./03-products-templates-thinking-chain.md)  
  AI 产品工具、SaaS 模板、MVP 模板、可公开思考链与决策框架。

- [`04-knowledge-framework.md`](./04-knowledge-framework.md)  
  12 个模块的知识库总框架，覆盖 AI 基础、模型选型、Prompt、RAG、Agent、开发、商业化、增长和合规。

- [`05-agent-team-system.md`](./05-agent-team-system.md)  
  一人公司 Agent 团队设计，含市场研究、竞品、访谈、PRD、UI、开发、测试、营销、销售和客服 Agent。

- [`06-30-day-roadmap-and-product-ideas.md`](./06-30-day-roadmap-and-product-ideas.md)  
  30 天学习与开发计划、产品方向选择框架、10 个适合一人公司起步的 AI 产品方向。

- [`07-template-library-and-thinking-chains.md`](./07-template-library-and-thinking-chains.md)  
  PRD、RAG、Agent、Eval、访谈、竞品、上线、复盘、Landing Page 模板，以及可公开思考链。

- [`08-github-mature-open-source-projects.md`](./08-github-mature-open-source-projects.md)  
  GitHub 成熟开源项目复刻清单，覆盖 AI Chat、RAG、Agent、工作流、多模型网关、Eval、向量库、多模态、OCR、SaaS 模板、MCP，并补充优秀作者/团队。

- [`09-ai-skills-and-apps-catalog.md`](./09-ai-skills-and-apps-catalog.md)  
  AI Skill 与 App 分类导航，覆盖编程 IDE Agent、Agent App Builder、RAG、Workflow、研究爬取、多模态、语音、数据分析、客服 CRM、Prompt/MCP/模板资源，并附 App 与 GitHub 链接。

- [`极致Prompt-AI一人公司知识库与产品开发.md`](./极致Prompt-AI一人公司知识库与产品开发.md)  
  根据本知识库生成学习路线、开源项目清单、产品开发计划和一人公司行动方案的超级 Prompt。

---

## 3. 一人公司选型原则

1. 优先选能上线的技术，不优先选最酷的技术。
2. 优先复用开源模板，不从空白项目开始。
3. 优先做单一强痛点，不做大而全平台。
4. 优先接入成熟 API，不早期训练模型。
5. 优先建立评测集，不凭感觉判断模型效果。
6. 优先做收费验证，不沉迷免费用户增长。
7. 优先沉淀可复用资产：Prompt、模板、组件、数据集、用户洞察。

---

## 4. 每周行动闭环

1. 周一：选一个细分人群和高频痛点。
2. 周二：拆竞品、开源项目和替代方案。
3. 周三：用 Cursor 搭 MVP。
4. 周四：补 RAG / Agent / Eval / 支付 / 埋点。
5. 周五：发给真实用户试用。
6. 周六：整理反馈、修复关键问题。
7. 周日：复盘是否继续、转向或砍掉。

