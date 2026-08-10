# GitHub 成熟开源项目复刻清单

> 目标：从全网成熟开源项目中挑选适合一人公司快速复刻、改造、上线的项目。  
> 使用方式：每个场景先选 1 个主项目跑通，再改成自己的细分产品。不要同时克隆 20 个仓库。  
> 判断标准：开源活跃、文档相对完整、场景明确、能本地运行、可改造成 AI 产品或一人公司基础设施。

---

## 1. AI Chat / LLM App

### Vercel AI SDK

- 链接：https://github.com/vercel/ai
- 作者/团队：Vercel
- 应用场景：AI Chat、流式输出、工具调用、多模型应用。
- 可复刻产品：行业助手、简历助手、客服 Copilot、写作工具。
- 立即执行：用 Next.js 初始化项目，接入 `streamText`，做一个单页 Chat。

### Vercel AI Chatbot

- 链接：https://github.com/vercel/ai-chatbot
- 作者/团队：Vercel
- 应用场景：完整 AI Chat SaaS 起点。
- 可复刻产品：知识库问答、面试陪练、文档助手、销售邮件助手。
- 立即执行：跑通本地环境，替换模型供应商，修改系统 Prompt。

### Open WebUI

- 链接：https://github.com/open-webui/open-webui
- 作者/团队：Open WebUI 社区
- 应用场景：本地模型、多模型 Chat、知识库、用户管理。
- 可复刻产品：企业内部 AI 控制台。
- 立即执行：用 Docker 跑起来，拆解它的模型管理和知识库体验。

### LobeChat

- 链接：https://github.com/lobehub/lobe-chat
- 作者/团队：LobeHub
- 应用场景：多模型助手、插件、知识库、Agent UI。
- 可复刻产品：面向专业人群的助手市场。
- 立即执行：研究助手配置、插件机制和模型设置页。

### LibreChat

- 链接：https://github.com/danny-avila/LibreChat
- 作者：Danny Avila
- 应用场景：多模型 ChatGPT 替代品、企业自部署。
- 可复刻产品：团队内部 AI Chat 平台。
- 立即执行：本地部署，比较它与 Open WebUI 的产品结构差异。

### Chatbot UI

- 链接：https://github.com/mckaywrigley/chatbot-ui
- 作者：McKay Wrigley
- 应用场景：轻量 ChatGPT UI。
- 可复刻产品：极简 AI 工具、垂直问答助手。
- 立即执行：复刻 UI 和会话结构，换成自己的业务 Prompt。

---

## 2. RAG / 知识库

### LlamaIndex

- 链接：https://github.com/run-llama/llama_index
- 作者/团队：Jerry Liu / LlamaIndex
- 应用场景：文档索引、RAG、数据连接器。
- 可复刻产品：合同问答、SOP 知识库、课程陪练。
- 立即执行：用 20 份 Markdown/PDF 做带引用的问答。

### LangChain

- 链接：https://github.com/langchain-ai/langchain
- 作者/团队：Harrison Chase / LangChain
- 应用场景：RAG、工具调用、链式编排、Agent。
- 可复刻产品：知识库助手、自动化研究助手。
- 立即执行：只学 Retriever、Tool Calling 和 Runnable，不要一开始全学。

### RAGFlow

- 链接：https://github.com/infiniflow/ragflow
- 作者/团队：InfiniFlow
- 应用场景：文档解析、企业级 RAG、知识库管理。
- 可复刻产品：企业知识库 SaaS、文档问答平台。
- 立即执行：跑 Demo，重点观察 PDF 解析、切片和引用。

### AnythingLLM

- 链接：https://github.com/Mintplex-Labs/anything-llm
- 作者/团队：Mintplex Labs
- 应用场景：本地知识库、Workspace、企业文档问答。
- 可复刻产品：小团队私有知识库。
- 立即执行：创建 Workspace，上传文档，记录普通用户配置步骤。

### Danswer / Onyx

- 链接：https://github.com/onyx-dot-app/onyx
- 作者/团队：Onyx
- 应用场景：企业搜索、知识检索、连接器。
- 可复刻产品：公司内部搜索和问答系统。
- 立即执行：研究连接器、权限、检索体验。

### Quivr

- 链接：https://github.com/QuivrHQ/quivr
- 作者/团队：QuivrHQ
- 应用场景：第二大脑、个人知识库。
- 可复刻产品：个人知识库、研究资料助手。
- 立即执行：拆解它如何把文档组织成可问答空间。

---

## 3. Agent 框架 / 多 Agent

### LangGraph

- 链接：https://github.com/langchain-ai/langgraph
- 作者/团队：LangChain
- 应用场景：可控 Agent、状态机、人工介入。
- 可复刻产品：研究报告 Agent、工单处理 Agent、审批助手。
- 立即执行：做“搜索 → 总结 → 人工确认 → 输出”的图工作流。

### AutoGen

- 链接：https://github.com/microsoft/autogen
- 作者/团队：Microsoft
- 应用场景：多 Agent 协作、对话式任务解决。
- 可复刻产品：虚拟产品团队、代码审查团队、研究团队。
- 立即执行：让 PM Agent、工程 Agent、测试 Agent 协作评审一个需求。

### CrewAI

- 链接：https://github.com/crewAIInc/crewAI
- 作者/团队：CrewAI
- 应用场景：角色型 Agent、任务编排。
- 可复刻产品：竞品调研 Crew、内容营销 Crew。
- 立即执行：用 3 个 Agent 输出一份竞品报告。

### OpenAI Agents SDK

- 链接：https://github.com/openai/openai-agents-python
- 作者/团队：OpenAI
- 应用场景：Agent、工具调用、交接、追踪。
- 可复刻产品：任务型助手、客服分流、工具型 Agent。
- 立即执行：做一个带工具调用和 handoff 的最小 Agent。

### Pydantic AI

- 链接：https://github.com/pydantic/pydantic-ai
- 作者/团队：Pydantic
- 应用场景：类型安全的 Agent 和结构化输出。
- 可复刻产品：数据抽取、表单填充、结构化报告生成。
- 立即执行：用 Pydantic schema 约束 AI 输出。

### Smolagents

- 链接：https://github.com/huggingface/smolagents
- 作者/团队：Hugging Face
- 应用场景：轻量 Agent、代码执行、工具使用。
- 可复刻产品：轻量研究助手、脚本执行助手。
- 立即执行：跑官方示例，理解最小 Agent 是什么。

### Browser Use

- 链接：https://github.com/browser-use/browser-use
- 作者/团队：Browser Use
- 应用场景：浏览器自动化、网页操作 Agent。
- 可复刻产品：竞品价格监控、网页资料采集、表单自动填写。
- 立即执行：让 Agent 打开 3 个竞品网页并输出功能变化摘要。

---

## 4. Workflow 自动化 / 低代码 AI 应用

### Dify

- 链接：https://github.com/langgenius/dify
- 作者/团队：LangGenius
- 应用场景：LLM App、RAG、Agent、Workflow、模型网关。
- 可复刻产品：企业内部 AI 应用平台、客服助手、知识库。
- 立即执行：用 Workflow 搭一个“输入资料 → 分析 → 报告”的流程。

### Flowise

- 链接：https://github.com/FlowiseAI/Flowise
- 作者/团队：FlowiseAI
- 应用场景：可视化 LangChain、RAG Flow。
- 可复刻产品：可视化 AI 工作流工具。
- 立即执行：拖拽搭一个 RAG，再用代码复现。

### n8n

- 链接：https://github.com/n8n-io/n8n
- 作者/团队：n8n
- 应用场景：业务自动化、API 串联、运营流程。
- 可复刻产品：AI 自动运营系统、线索处理系统。
- 立即执行：做“表单提交 → AI 分类 → 邮件发送 → 数据入库”。

### Activepieces

- 链接：https://github.com/activepieces/activepieces
- 作者/团队：Activepieces
- 应用场景：Zapier 开源替代、自动化工作流。
- 可复刻产品：面向中小企业的自动化工具。
- 立即执行：用它连接表单、邮件和 AI API。

### Windmill

- 链接：https://github.com/windmill-labs/windmill
- 作者/团队：Windmill
- 应用场景：脚本、工作流、内部工具。
- 可复刻产品：企业内部 AI 工具台。
- 立即执行：写一个定时抓取和总结报告的脚本流。

---

## 5. 多模型网关 / 本地模型 / 推理服务

### LiteLLM

- 链接：https://github.com/BerriAI/litellm
- 作者/团队：BerriAI
- 应用场景：统一调用 OpenAI、Anthropic、Gemini、开源模型。
- 可复刻产品：模型网关、成本控制、模型切换平台。
- 立即执行：用 LiteLLM Proxy 接入 2 个模型并记录成本。

### OpenRouter Examples

- 链接：https://github.com/OpenRouterTeam
- 作者/团队：OpenRouter
- 应用场景：多模型 API、路由、模型比较。
- 可复刻产品：模型对比工具、Prompt 测试平台。
- 立即执行：写一个相同 Prompt 同时调用多个模型的脚本。

### Ollama

- 链接：https://github.com/ollama/ollama
- 作者/团队：Ollama
- 应用场景：本地运行 Llama、Qwen、Mistral 等模型。
- 可复刻产品：本地隐私助手、离线知识库。
- 立即执行：本地跑一个小模型并接入 Open WebUI。

### vLLM

- 链接：https://github.com/vllm-project/vllm
- 作者/团队：vLLM Project
- 应用场景：高吞吐 LLM 推理服务。
- 可复刻产品：私有化模型服务。
- 立即执行：先阅读部署文档，理解推理服务指标。

### LocalAI

- 链接：https://github.com/mudler/LocalAI
- 作者：Ettore Di Giacinto / LocalAI 社区
- 应用场景：OpenAI API 兼容的本地模型服务。
- 可复刻产品：离线 AI API 网关。
- 立即执行：用 OpenAI-compatible endpoint 接入现有 App。

---

## 6. Eval / 观测 / Prompt 测试

### Promptfoo

- 链接：https://github.com/promptfoo/promptfoo
- 作者/团队：Promptfoo
- 应用场景：Prompt 测试、模型比较、回归测试。
- 可复刻产品：Prompt 评测平台、AI 质量控制台。
- 立即执行：为一个 Prompt 写 10 个测试样本。

### OpenAI Evals

- 链接：https://github.com/openai/evals
- 作者/团队：OpenAI
- 应用场景：模型评测、任务集、评测框架。
- 可复刻产品：垂直任务评测集。
- 立即执行：读示例，设计自己的业务 Eval。

### DeepEval

- 链接：https://github.com/confident-ai/deepeval
- 作者/团队：Confident AI
- 应用场景：LLM 应用评测、RAG 评测、指标。
- 可复刻产品：RAG 质量评估工具。
- 立即执行：用它评估问答准确性和上下文相关性。

### Ragas

- 链接：https://github.com/explodinggradients/ragas
- 作者/团队：Exploding Gradients
- 应用场景：RAG 评测。
- 可复刻产品：知识库质量检测工具。
- 立即执行：用 Ragas 测 faithfulness、context precision。

### Langfuse

- 链接：https://github.com/langfuse/langfuse
- 作者/团队：Langfuse
- 应用场景：LLM 可观测性、Prompt 管理、Tracing。
- 可复刻产品：AI 应用监控后台。
- 立即执行：给一个 Chat App 接入 tracing。

### Helicone

- 链接：https://github.com/Helicone/helicone
- 作者/团队：Helicone
- 应用场景：LLM API 日志、成本、监控。
- 可复刻产品：模型调用成本面板。
- 立即执行：代理一次 LLM 请求，查看日志和成本。

---

## 7. 向量数据库 / 搜索

### Qdrant

- 链接：https://github.com/qdrant/qdrant
- 作者/团队：Qdrant
- 应用场景：向量搜索、RAG、推荐。
- 可复刻产品：知识库搜索底座。
- 立即执行：把 100 条文档写入并做相似搜索。

### Weaviate

- 链接：https://github.com/weaviate/weaviate
- 作者/团队：Weaviate
- 应用场景：向量数据库、混合搜索。
- 可复刻产品：企业知识搜索。
- 立即执行：跑 Docker 示例，理解 schema 和 hybrid search。

### Milvus

- 链接：https://github.com/milvus-io/milvus
- 作者/团队：Zilliz / Milvus
- 应用场景：大规模向量检索。
- 可复刻产品：企业级 RAG 后端。
- 立即执行：先看架构和部署要求，适合后期扩展。

### Chroma

- 链接：https://github.com/chroma-core/chroma
- 作者/团队：Chroma
- 应用场景：轻量向量数据库。
- 可复刻产品：本地知识库、原型 RAG。
- 立即执行：本地写入文档，配合 LlamaIndex 做问答。

### Typesense

- 链接：https://github.com/typesense/typesense
- 作者/团队：Typesense
- 应用场景：关键词搜索、混合搜索。
- 可复刻产品：AI 工具目录、产品搜索。
- 立即执行：做一个可搜索的资源导航。

---

## 8. 多模态 / 图像 / 视频 / 语音

### ComfyUI

- 链接：https://github.com/comfyanonymous/ComfyUI
- 作者：comfyanonymous
- 应用场景：图像生成工作流、Stable Diffusion 节点流。
- 可复刻产品：电商图生成、头像生成、营销图工作流。
- 立即执行：跑一个文生图 Workflow，记录节点和参数。

### Fooocus

- 链接：https://github.com/lllyasviel/Fooocus
- 作者：lllyasviel
- 应用场景：易用图像生成工具。
- 可复刻产品：轻量设计工具、素材生成器。
- 立即执行：体验它如何降低 Stable Diffusion 门槛。

### Open-Sora

- 链接：https://github.com/hpcaitech/Open-Sora
- 作者/团队：Colossal-AI / HPC-AI Tech
- 应用场景：开源视频生成研究。
- 可复刻产品：视频生成学习与研究，不建议一人公司早期商用依赖。
- 立即执行：阅读 Demo 和限制，理解视频生成成本。

### Whisper

- 链接：https://github.com/openai/whisper
- 作者/团队：OpenAI
- 应用场景：语音转文字、多语言转写。
- 可复刻产品：会议纪要、播客摘要、客服质检。
- 立即执行：转写一段录音并生成摘要。

### Faster Whisper

- 链接：https://github.com/SYSTRAN/faster-whisper
- 作者/团队：SYSTRAN
- 应用场景：更快的 Whisper 推理。
- 可复刻产品：低成本批量转写服务。
- 立即执行：比较同一音频的速度和准确率。

### Coqui TTS

- 链接：https://github.com/coqui-ai/TTS
- 作者/团队：Coqui AI
- 应用场景：文字转语音、配音。
- 可复刻产品：课程配音、播客生成。
- 立即执行：生成一段中文/英文配音样例。

---

## 9. 文档解析 / OCR / 数据抽取

### Unstructured

- 链接：https://github.com/Unstructured-IO/unstructured
- 作者/团队：Unstructured
- 应用场景：PDF、HTML、Word、PPT 文档解析。
- 可复刻产品：企业文档入库、知识库预处理。
- 立即执行：解析 5 个不同格式文件并观察结构化结果。

### Docling

- 链接：https://github.com/docling-project/docling
- 作者/团队：Docling Project
- 应用场景：文档解析、PDF 转结构化内容。
- 可复刻产品：PDF 知识库、合同解析。
- 立即执行：把 PDF 转 Markdown 并接入 RAG。

### Marker

- 链接：https://github.com/datalab-to/marker
- 作者/团队：Datalab
- 应用场景：PDF 转 Markdown。
- 可复刻产品：论文/报告结构化工具。
- 立即执行：处理一份复杂 PDF，比较格式保真度。

### PaddleOCR

- 链接：https://github.com/PaddlePaddle/PaddleOCR
- 作者/团队：PaddlePaddle
- 应用场景：OCR、票据识别、文档识别。
- 可复刻产品：发票识别、表单录入、证件识别。
- 立即执行：用样例图片跑 OCR 并转成结构化 JSON。

### Tesseract OCR

- 链接：https://github.com/tesseract-ocr/tesseract
- 作者/团队：Tesseract OCR
- 应用场景：经典 OCR。
- 可复刻产品：轻量 OCR 工具。
- 立即执行：对比 Tesseract 与 PaddleOCR 的识别效果。

---

## 10. AI SaaS / 全栈模板 / UI

### Open SaaS

- 链接：https://github.com/wasp-lang/open-saas
- 作者/团队：Wasp
- 应用场景：SaaS 模板、认证、支付、邮件。
- 可复刻产品：AI SaaS 商业骨架。
- 立即执行：加一个 AI API 调用页面和计费页。

### Supabase

- 链接：https://github.com/supabase/supabase
- 作者/团队：Supabase
- 应用场景：认证、数据库、存储、边缘函数。
- 可复刻产品：一人公司后端底座。
- 立即执行：建用户表、项目表和调用日志表。

### shadcn/ui

- 链接：https://github.com/shadcn-ui/ui
- 作者：shadcn
- 应用场景：高质量 React UI 组件。
- 可复刻产品：AI SaaS 前端、后台、表单、Dialog。
- 立即执行：用 Card、Form、Dialog 做一个 AI 工具页面。

### Tremor

- 链接：https://github.com/tremorlabs/tremor
- 作者/团队：Tremor
- 应用场景：Dashboard、图表、指标面板。
- 可复刻产品：AI 调用成本面板、用户行为分析。
- 立即执行：做一个 API 成本 Dashboard。

### Cal.com

- 链接：https://github.com/calcom/cal.com
- 作者/团队：Cal.com
- 应用场景：预约、日程、会议。
- 可复刻产品：AI 咨询预约、销售 Demo 预约。
- 立即执行：研究它的预约流程和商业化入口。

### Documenso

- 链接：https://github.com/documenso/documenso
- 作者/团队：Documenso
- 应用场景：电子签名、文档工作流。
- 可复刻产品：合同审阅 + 签署工作流。
- 立即执行：研究文档状态流转。

### Plane

- 链接：https://github.com/makeplane/plane
- 作者/团队：Plane
- 应用场景：项目管理、任务系统。
- 可复刻产品：AI 项目管理 Copilot。
- 立即执行：研究 issue、cycle、project 的信息结构。

### Twenty CRM

- 链接：https://github.com/twentyhq/twenty
- 作者/团队：Twenty
- 应用场景：开源 CRM。
- 可复刻产品：AI 销售线索管理、CRM Copilot。
- 立即执行：研究客户对象和销售流程。

---

## 11. MCP / 工具生态 / 集成

### Model Context Protocol

- 链接：https://github.com/modelcontextprotocol
- 作者/团队：Anthropic 发起的 MCP 生态
- 应用场景：把模型连接到工具、数据库、文件和服务。
- 可复刻产品：可扩展 Agent 工具平台。
- 立即执行：跑一个文件系统或 GitHub MCP Server。

### Composio

- 链接：https://github.com/ComposioHQ/composio
- 作者/团队：Composio
- 应用场景：Agent 工具集成，连接 Gmail、GitHub、Slack 等。
- 可复刻产品：自动化办公 Agent、销售 Agent。
- 立即执行：接一个 GitHub 或 Gmail 工具到 Agent。

### E2B

- 链接：https://github.com/e2b-dev/E2B
- 作者/团队：E2B
- 应用场景：AI 代码执行沙箱。
- 可复刻产品：数据分析 Agent、代码执行助手。
- 立即执行：让 Agent 在沙箱里执行一段 Python 分析。

---

## 12. 优秀作者 / 团队推荐

### AI 工程与产品化

- Simon Willison：https://github.com/simonw  
  学习重点：LLM 实验、工具使用、事实验证、工程记录。
- Chip Huyen：https://github.com/chiphuyen  
  学习重点：AI Engineering、评测、上线、系统思维。
- Hamel Husain：https://github.com/hamelsmu  
  学习重点：LLM Eval、数据集、错误分析。
- Andrej Karpathy：https://github.com/karpathy  
  学习重点：AI 基础直觉、教学方式、从底层理解模型。

### RAG / Agent 框架作者

- Harrison Chase / LangChain：https://github.com/hwchase17  
  学习重点：LangChain、LangGraph、Agent 工程化。
- Jerry Liu / LlamaIndex：https://github.com/jerryjliu  
  学习重点：RAG、数据连接器、知识库产品化。
- Microsoft AutoGen 团队：https://github.com/microsoft/autogen  
  学习重点：多 Agent 协作模式。
- CrewAI 团队：https://github.com/crewAIInc/crewAI  
  学习重点：角色型 Agent 和任务编排。

### 全栈与一人公司产品

- shadcn：https://github.com/shadcn  
  学习重点：现代 UI 组件和开发者产品审美。
- Lee Robinson / Vercel：https://github.com/leerob  
  学习重点：Next.js、Vercel、产品化开发。
- Guillermo Rauch / Vercel：https://github.com/rauchg  
  学习重点：开发者工具、平台产品、实时体验。
- Supabase 团队：https://github.com/supabase  
  学习重点：开源后端平台和开发者增长。

### 多模态 / 图像 / 本地 AI

- lllyasviel：https://github.com/lllyasviel  
  学习重点：图像生成产品化、ControlNet、Fooocus。
- comfyanonymous：https://github.com/comfyanonymous  
  学习重点：ComfyUI、节点式图像工作流。
- Ollama 团队：https://github.com/ollama  
  学习重点：本地模型体验和开发者产品。

---

## 13. 立即执行复刻路线

### 路线 A：最快上线 AI SaaS

1. 克隆 `vercel/ai-chatbot`。
2. 接入 OpenRouter 或 OpenAI。
3. 加 Supabase 用户数据。
4. 加一个垂直 Prompt。
5. 用 Stripe Samples 加支付。
6. 部署到 Vercel。

### 路线 B：最快上线 RAG 知识库

1. 跑 `LlamaIndex` 或 `RAGFlow`。
2. 准备 20 份垂直文档。
3. 做切片、Embedding、引用。
4. 加 20 条 Eval 问题。
5. 做一个问答 UI。
6. 找 5 个真实用户试用。

### 路线 C：最快上线 Agent 工具

1. 用 `LangGraph` 设计状态图。
2. 接 Web Search 或 Browser Use。
3. 做竞品调研任务。
4. 加人工确认点。
5. 输出 Markdown 报告。
6. 接 n8n 定时运行。

### 路线 D：最快上线 AI 自动化服务

1. 用 `n8n` 或 `Activepieces`。
2. 接表单、邮件、数据库。
3. 接 LLM 分类和生成。
4. 输出客户可见报告。
5. 用人工审核保证质量。
6. 先做服务，再产品化。

