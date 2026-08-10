# 开源项目与 Agent 技术栈

> 目标：不要从零造轮子。先跑通优秀开源项目，理解架构、数据流、调用链和商业化入口。  
> 使用建议：每类只选 1 个主项目深挖，能本地运行、能改一处功能、能讲清架构，才算真正学会。

| 项目 | 一页纸总结 |
|---|---|
| 文件定位 | 开源项目和 Agent 技术栈的入门复刻清单。 |
| 适合对象 | 想从成熟代码开始学习 AI Chat、RAG、Agent、Workflow 和 SaaS 骨架的人。 |
| 核心内容 | Vercel AI、Open WebUI、LobeChat、LlamaIndex、LangChain、Dify、Flowise、n8n、Open SaaS 等项目。 |
| 立即行动 | 先跑通 `vercel/ai-chatbot`，再用 LlamaIndex 或 LangChain 做一个小型 RAG。 |
| 关键产出 | 一个可演示 AI Web App、一个 RAG Demo、一个可控 Agent 流程。 |
| 关联文件 | `08-github-mature-open-source-projects.md` 提供更完整成熟项目清单。 |

---

## 1. AI 应用开发基础栈

### Vercel AI SDK

- 链接：https://github.com/vercel/ai
- 作者/团队：Vercel
- 适合学什么：流式输出、Chat UI、工具调用、多模型适配。
- 为什么重要：一人公司做 AI Web 产品时，前后端集成速度很快。
- 推荐动作：用它做一个带登录、聊天、文件上传和模型切换的 Demo。

### AI Chatbot Template

- 链接：https://github.com/vercel/ai-chatbot
- 作者/团队：Vercel
- 适合学什么：完整 AI Chat 产品结构、认证、数据库、消息流、部署。
- 为什么重要：适合作为 AI SaaS 的起点。
- 推荐动作：替换模型供应商，加入自己的垂直场景 Prompt 和收费入口。

### Open WebUI

- 链接：https://github.com/open-webui/open-webui
- 作者/团队：Open WebUI 社区
- 适合学什么：本地模型 UI、多模型管理、知识库、用户体验。
- 为什么重要：理解成熟 AI Chat 产品应该具备哪些基础能力。
- 推荐动作：研究它的信息架构，不建议直接复制做商业产品。

### LobeChat

- 链接：https://github.com/lobehub/lobe-chat
- 作者/团队：LobeHub
- 适合学什么：多模型 Chat、插件、知识库、前端体验。
- 为什么重要：产品体验和 UI 质量高，适合 PM 学交互。
- 推荐动作：拆解它的模型配置、助手市场和插件机制。

---

## 2. RAG 与知识库

### LlamaIndex

- 链接：https://github.com/run-llama/llama_index
- 作者：Jerry Liu / LlamaIndex 团队
- 适合学什么：文档索引、检索、RAG Pipeline、数据连接器。
- 为什么重要：企业知识库和垂直问答产品的核心框架。
- 推荐动作：用自己的 PDF / Notion / Markdown 做一个知识库问答。

### LangChain

- 链接：https://github.com/langchain-ai/langchain
- 作者：Harrison Chase / LangChain 团队
- 适合学什么：链式调用、工具调用、Agent、RAG、工作流编排。
- 为什么重要：生态大，资料多，适合理解 LLM 应用架构。
- 推荐动作：不要一开始学太深，先学 PromptTemplate、Retriever、Tool Calling。

### RAGFlow

- 链接：https://github.com/infiniflow/ragflow
- 作者/团队：InfiniFlow
- 适合学什么：文档解析、知识库管理、企业级 RAG。
- 为什么重要：偏产品化，适合看知识库系统完整形态。
- 推荐动作：研究它如何处理 PDF、切片、召回和问答。

### AnythingLLM

- 链接：https://github.com/Mintplex-Labs/anything-llm
- 作者/团队：Mintplex Labs
- 适合学什么：本地知识库、Workspace、文档问答、部署。
- 为什么重要：适合快速体验 RAG 产品闭环。
- 推荐动作：用它理解普通用户如何配置知识库。

---

## 3. Agent 与工作流

### LangGraph

- 链接：https://github.com/langchain-ai/langgraph
- 作者/团队：LangChain
- 适合学什么：可控 Agent、状态机、多步骤任务、人工介入。
- 为什么重要：比“黑箱自动 Agent”更适合生产环境。
- 推荐动作：做一个“调研 → 总结 → 生成报告 → 人工确认”的流程。

### AutoGen

- 链接：https://github.com/microsoft/autogen
- 作者/团队：Microsoft
- 适合学什么：多 Agent 协作、角色分工、对话式任务解决。
- 为什么重要：理解多代理系统的典型设计。
- 推荐动作：用它模拟 PM、工程师、市场分析师协作评审产品。

### CrewAI

- 链接：https://github.com/crewAIInc/crewAI
- 作者/团队：CrewAI
- 适合学什么：角色型 Agent、任务编排、工作流自动化。
- 为什么重要：上手快，适合做一人公司的半自动运营助手。
- 推荐动作：做一个竞品调研 Crew，输出差异点、定价和机会。

### Dify

- 链接：https://github.com/langgenius/dify
- 作者/团队：LangGenius
- 适合学什么：可视化 AI 应用、RAG、Agent、工作流、模型网关。
- 为什么重要：非常适合非纯工程背景 PM 快速搭 AI 应用。
- 推荐动作：用 Dify 搭一个垂直助手，再用代码实现核心版。

### Coze Studio

- 链接：https://github.com/coze-dev/coze-studio
- 作者/团队：Coze
- 适合学什么：智能体搭建、插件、知识库、工作流。
- 为什么重要：适合理解国内 Agent 平台的产品形态。
- 推荐动作：观察它如何把复杂 Agent 包装成用户可用产品。

### Flowise

- 链接：https://github.com/FlowiseAI/Flowise
- 作者/团队：FlowiseAI
- 适合学什么：可视化 LangChain、RAG Flow、Prompt Flow。
- 为什么重要：帮助 PM 理解 LLM 应用链路。
- 推荐动作：用拖拽方式搭 RAG，再对照代码实现。

### n8n

- 链接：https://github.com/n8n-io/n8n
- 作者/团队：n8n
- 适合学什么：自动化工作流、API 集成、业务流程编排。
- 为什么重要：一人公司需要把 AI 接到表单、邮件、CRM、数据库。
- 推荐动作：做一个“用户提交需求 → AI 分析 → 邮件回复 → 入库”的流程。

### Browser Use

- 链接：https://github.com/browser-use/browser-use
- 作者/团队：Browser Use
- 适合学什么：浏览器自动化 Agent、网页操作、任务执行。
- 为什么重要：很多真实工作发生在网页里，浏览器 Agent 是一人公司高杠杆工具。
- 推荐动作：做一个自动收集竞品价格和功能变化的 Agent。

### MCP

- 链接：https://github.com/modelcontextprotocol
- 作者/团队：Anthropic 发起的 Model Context Protocol 生态
- 适合学什么：模型连接工具、数据源、IDE、数据库和外部服务的协议。
- 为什么重要：Agent 生态的重要连接标准。
- 推荐动作：先理解 MCP Server / Client / Tool 的关系。

---

## 4. AI SaaS 与商业化模板

### Open SaaS

- 链接：https://github.com/wasp-lang/open-saas
- 作者/团队：Wasp
- 适合学什么：登录、支付、邮件、后台任务、SaaS 基础结构。
- 为什么重要：AI 功能只是核心，商业化还需要完整 SaaS 骨架。
- 推荐动作：把 AI 功能嵌进去，做一个可收费 MVP。

### Supabase

- 链接：https://github.com/supabase/supabase
- 作者/团队：Supabase
- 适合学什么：数据库、认证、存储、边缘函数。
- 为什么重要：一人公司常用后端底座。
- 推荐动作：用 Supabase 管用户、项目、文档和调用记录。

### Stripe Samples

- 链接：https://github.com/stripe-samples
- 作者/团队：Stripe
- 适合学什么：订阅、一次性支付、Webhook。
- 为什么重要：不要只做 Demo，要尽早验证付费。
- 推荐动作：给 AI 小工具加一个最简单的付费入口。

---

## 5. 推荐学习顺序

1. 跑通 `vercel/ai-chatbot`，理解 AI Web App。
2. 用 `LlamaIndex` 或 `LangChain` 做一个 RAG。
3. 用 `Dify` 或 `Flowise` 可视化搭一次相同流程。
4. 用 `LangGraph` 做一个可控 Agent。
5. 用 `n8n` 把 AI 接到真实业务工具。
6. 用 `Open SaaS` 或自有 Next.js 模板补登录、支付、邮件和埋点。
7. 用真实用户反馈决定继续投入还是砍掉。

