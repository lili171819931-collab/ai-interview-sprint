# AI 模型能力分类与选型研究

> 目标读者：AI 产品经理、创业者、企业内部工具负责人。  
> 使用方式：用于建立 AI 工具/模型认知框架、做竞品研究、搭建模型选型评分表。  
> 时间口径：面向 2025-2026 年市场格局；具体模型版本、价格和榜单排名需以官网与榜单最新信息为准。  
> PDF 原文转写：[`2026-ai-model-taxonomy-platforms-selection.md`](./2026-ai-model-taxonomy-platforms-selection.md)  
> 更新说明：已合并 PDF 中的五大分类框架、国内权威渠道、场景选型对照表与平台使用策略。

---

## 1. 一句话结论

市面上的 AI 模型不宜只按厂商划分，更适合按“能力层”划分：通用语言、深度推理、代码、多模态、图像、视频、语音、检索、Agent 工具调用、垂直行业。  
产品选型时，先判断业务任务属于哪一类能力，再比较成本、速度、准确性、上下文、中文能力、工具调用、数据安全和部署方式。

也可并行使用 PDF 的五大落地框架：

**通用打底 → 专项极致 → 底座支撑 → 智能执行 → 行业落地**

选型原则：不滥用顶配、不用通用硬替专项、商用优先合规与可验证效果。

---

## 1.5 两大分类框架对照

| PDF 五大分类 | 本仓库十类能力 | 合并后怎么用 |
|---|---|---|
| 通用基础大模型 | 通用 LLM + 推理模型 | 日常办公看通用；复杂分析单独评推理 |
| 专项-超长上下文 | 通用 LLM 的长上下文能力 | 合同/财报/书籍精读单独验证窗口与细节留存 |
| 专项-代码 / 多模态 / 图像 / 音视频 | 代码、多模态、图像、视频、语音 | PDF 把音视频合并；选型时仍建议拆开 |
| 技术底座模型 | Embedding/检索模型 | RAG 与推荐必评，不可用生成模型替代 |
| 智能 Agent 模型 | Agent/工具调用模型 | 看规划、工具调用、权限与人工校验 |
| 行业垂直专用模型 | 垂直领域模型 | 法律/医疗/金融等商用优先垂直 + 审核 |

---

## 2. 模型能力分类地图

### 2.1 通用大语言模型 LLM

- 定义：以文本理解和生成为核心的基础模型。
- 擅长功能：写作、总结、翻译、问答、头脑风暴、知识整理、方案生成；也可覆盖公文、润色纠错、方案策划。
- 不适合场景：高可靠计算、实时事实查询、严格合规判断、没有外部工具支持的精确数据分析；超长文档无损精读与工业级专业分析也易遇瓶颈。
- 代表模型/产品：GPT、Claude、Gemini、Qwen、Llama、Mistral、DeepSeek、智谱 GLM、文心一言、豆包。
- 典型业务场景：内容生产、运营文案、客服草稿、会议纪要、知识问答、产品方案、日常办公增效。
- 查询网站：OpenAI、Anthropic、Google AI、Meta AI、Mistral、DeepSeek、阿里云百炼、OpenRouter、Artificial Analysis、LMArena、CLiB。
- 选型信心：高。该类别成熟度高，官方文档和第三方评测较多。
- 补充：若任务是十万字合同/财报/书籍精读，应优先验证“超长上下文专项能力”，不要只看通用榜。

### 2.2 推理模型

- 定义：强化复杂推理、多步骤规划、数学和严谨分析能力的模型。
- 擅长功能：复杂问题拆解、数学推导、代码调试、策略分析、长链路决策。
- 不适合场景：低成本高频闲聊、简单文本改写、对延迟极敏感的实时交互。
- 代表模型/产品：OpenAI o 系列、Claude thinking 类能力、Gemini Pro reasoning 类模型、DeepSeek-R 系列。
- 典型业务场景：复杂客服工单、投研分析、法律/合规初筛、研发排障、Agent 任务规划。
- 查询网站：官方文档、Artificial Analysis、GPQA、MMLU、MMLU-Pro、AIME、LMArena。
- 选型信心：中高。推理能力进步快，但榜单口径差异大，需用真实任务集验证。

### 2.3 代码模型

- 定义：面向代码生成、理解、重构、测试和软件工程任务优化的模型。
- 擅长功能：代码补全、Bug 定位、重构、单元测试、脚本生成、工程问答。
- 不适合场景：缺少仓库上下文的复杂架构判断、完全无人审查的生产代码合入。
- 代表模型/产品：Claude、GPT、DeepSeek Coder、Qwen Coder、Code Llama、Cursor、GitHub Copilot。
- 典型业务场景：研发提效、自动化脚本、测试生成、代码 Review、遗留系统理解。
- 查询网站：SWE-bench、LiveCodeBench、HumanEval、官方文档、Cursor、GitHub Copilot、Hugging Face。
- 选型信心：中高。代码 Benchmark 有参考价值，但必须结合真实仓库任务验证。

### 2.4 多模态模型

- 定义：同时理解文本、图片、截图、PDF、表格、音频或视频帧的模型。
- 擅长功能：截图分析、UI 评审、图表理解、PDF 问答、视觉问答、跨模态摘要。
- 不适合场景：高精度 OCR 后的财务入账、医疗影像诊断、强监管视觉判断。
- 代表模型/产品：GPT 多模态、Gemini 多模态、Claude Vision、Qwen-VL、Llama Vision。
- 典型业务场景：产品体验分析、设计稿评审、客服识图、文档理解、质检辅助。
- 查询网站：MMMU、MathVista、官方文档、LMArena Vision、Hugging Face。
- 选型信心：中。真实业务图片质量、语言和任务差异会显著影响效果。

### 2.5 图像生成/编辑模型

- 定义：根据文本或参考图生成、编辑、扩展图片的生成式模型。
- 擅长功能：海报、插画、产品图、风格迁移、局部重绘、营销素材。
- 不适合场景：严格品牌一致性、精确文字排版、严肃合规素材、版权不可控场景。
- 代表模型/产品：Midjourney、DALL-E、Stable Diffusion、Flux、Adobe Firefly。
- 典型业务场景：营销创意、概念图、社媒配图、设计灵感、A/B 素材探索。
- 查询网站：官方文档、Replicate、Hugging Face、Civitai、Product Hunt、Futurepedia。
- 选型信心：中。审美体验主观性强，需结合品牌规范和版权要求评估。

### 2.6 视频生成模型

- 定义：根据文本、图片或分镜生成短视频片段的模型。
- 擅长功能：广告分镜、短视频素材、概念片、动效探索、图生视频。
- 不适合场景：长片稳定叙事、严格角色一致性、可控镜头调度、低成本批量生产。
- 代表模型/产品：Sora、Runway、Kling、Pika、Luma。
- 典型业务场景：营销预演、创意提案、短视频脚本验证、游戏/影视概念设计。
- 查询网站：官方文档、VBench、Product Hunt、Futurepedia、创作者社区。
- 选型信心：中低。能力变化快，可用性、价格和版权政策需实时确认。

### 2.7 语音模型

- 定义：处理语音转文字、文字转语音、实时语音对话和声音克隆的模型。
- 擅长功能：会议纪要、电话质检、字幕生成、配音、语音助手、实时口语交互。
- 不适合场景：强噪声环境下的完全准确转写、未经授权的声音克隆、医疗/司法正式记录。
- 代表模型/产品：Whisper、OpenAI Audio、ElevenLabs、PlayHT、Azure Speech、Google Speech。
- 典型业务场景：客服质检、会议助手、教育口语、播客制作、智能硬件交互。
- 查询网站：官方文档、API 定价页、Hugging Face、Replicate、G2。
- 选型信心：中高。语音转写成熟度较高，实时对话和声音合规仍需重点验证。

### 2.8 Embedding/检索模型

- 定义：把文本、图片或多模态内容转成向量，用于语义搜索、推荐和 RAG。
- 擅长功能：知识库检索、相似内容匹配、去重、推荐、RAG 召回。
- 不适合场景：独立生成答案、复杂推理、没有文档治理的知识库问答。
- 代表模型/产品：OpenAI Embeddings、Cohere Embed、BGE、E5、Jina Embeddings、Qwen Embedding。
- 典型业务场景：企业知识库、智能搜索、客服知识召回、内容推荐、文档问答。
- 查询网站：MTEB、Hugging Face、ModelScope、官方文档、向量数据库文档。
- 选型信心：高。评测体系较成熟，但最终要用业务语料做召回测试。

### 2.9 Agent/工具调用模型

- 定义：能理解目标、拆解任务，并调用浏览器、数据库、代码执行器、API 等工具的模型或系统。
- 擅长功能：自动化工作流、复杂资料调研、跨系统操作、代码执行、数据处理。
- 不适合场景：高风险无人工确认操作、权限边界不清的企业系统、支付/删除/审批等敏感动作。
- 代表模型/产品：OpenAI Assistants/Agents、Claude Computer Use、Gemini 工具调用、Cursor、LangChain、CrewAI、AutoGen。
- 典型业务场景：自动报表、竞品监控、研发 Agent、运营自动化、内部助手。
- 查询网站：官方文档、LangChain、LlamaIndex、SWE-bench、Product Hunt、GitHub。
- 选型信心：中。Agent 效果取决于工具设计、权限治理和任务闭环，不只取决于模型本身。

### 2.10 垂直领域模型

- 定义：针对法律、医疗、金融、教育、客服、设计等行业数据和任务优化的模型。
- 擅长功能：领域术语理解、行业问答、合规初筛、专业文档处理。
- 不适合场景：直接替代持证专业人员、跨行业泛化、无审计链路的高风险决策。
- 代表模型/产品：法律 AI、医疗问答模型、金融投研助手、教育陪练、客服大模型。
- 典型业务场景：行业知识库、专业文档审阅、智能客服、辅助诊断、投研摘要。
- 查询网站：厂商官网、行业报告、G2、案例白皮书、监管机构文件、客户评价。
- 选型信心：中低。厂商宣传多，真实效果高度依赖数据、流程和合规边界。

---

## 3. 推荐查询渠道

### 3.1 官方文档与价格

- OpenAI：https://openai.com/
- Anthropic：https://www.anthropic.com/
- Google AI / DeepMind：https://ai.google/ 与 https://deepmind.google/
- Meta AI：https://ai.meta.com/
- Mistral AI：https://mistral.ai/
- DeepSeek：https://www.deepseek.com/
- 阿里云百炼：https://bailian.console.aliyun.com/
- 腾讯混元：https://hunyuan.tencent.com/
- 百度千帆：https://cloud.baidu.com/product/wenxinworkshop
- 智谱 AI：https://www.bigmodel.cn/

适合查询：模型版本、API 能力、价格、上下文长度、限流、企业协议、数据政策。  
信心等级：高。

### 3.2 模型排行榜与 Benchmark

- Artificial Analysis：https://artificialanalysis.ai/
- LMArena / Chatbot Arena：https://lmarena.ai/
- Hugging Face Leaderboards：https://huggingface.co/spaces
- Stanford HELM：https://crfm.stanford.edu/helm/
- Papers with Code：https://paperswithcode.com/
- SWE-bench：https://www.swebench.com/
- MMLU / GPQA / MMMU / VBench：需结合各自官网或论文说明查看口径。

适合查询：模型能力、速度、价格、开源可用性、代码/推理/多模态专项能力。  
信心等级：中高。榜单有参考价值，但要看样本、时间、污染风险和任务口径。

### 3.3 开源模型社区

- Hugging Face：https://huggingface.co/
- ModelScope：https://modelscope.cn/
- GitHub Trending：https://github.com/trending
- OpenCompass 司南：https://opencompass.org.cn/
- Reddit r/LocalLLaMA：https://www.reddit.com/r/LocalLLaMA/

适合查询：开源模型、权重、Demo、社区复现、部署经验、中文开源评测。  
信心等级：中。社区信息快，但需要回到模型卡、论文和代码验证。

### 3.4 API 聚合平台与云厂商广场

- OpenRouter：https://openrouter.ai/
- Together AI：https://www.together.ai/
- Replicate：https://replicate.com/
- 硅基流动：https://siliconflow.cn/
- 火山方舟：https://ark.volcengine.com/
- 阿里百炼 / DashScope：https://dashscope.aliyun.com/
- 百度千帆：https://cloud.baidu.com/product/wenxinworkshop
- 讯飞星火：https://www.xfyun.cn/tech/llm
- 腾讯云大模型：https://cloud.tencent.com/product/llm
- 豆包开发者：https://www.doubao.com/developer

适合查询：多模型 API、价格比较、调用可用性、私有化与合规部署方案。  
信心等级：中高。价格和可用性需以平台实时页面为准。

### 3.5 AI 工具目录与用户评价

- Futurepedia：https://www.futurepedia.io/
- There’s An AI For That：https://theresanaiforthat.com/
- Product Hunt AI：https://www.producthunt.com/topics/artificial-intelligence
- G2 AI Software：https://www.g2.com/categories/artificial-intelligence
- Toolify：https://www.toolify.ai/
- 掘金 AI：https://juejin.cn/ai
- AI 工具集导航：https://www.aihub.cn/
- Model 数据库：https://model.zoz.la/

适合查询：AI 工具新品、场景分类、用户反馈、参数对比、国内入门实测。  
信心等级：中。适合发现候选，不适合作为最终能力结论。

### 3.6 行业报告与趋势

- Stanford AI Index：https://aiindex.stanford.edu/
- Epoch AI：https://epoch.ai/
- MIT Technology Review AI：https://www.technologyreview.com/topic/artificial-intelligence/
- The Batch：https://www.deeplearning.ai/the-batch/
- 智源研究院：https://www.baai.ac.cn/
- 中国信通院：https://www.caict.ac.cn/
- 艾瑞咨询：https://report.iresearch.cn/
- 36氪研究院：https://research.36kr.com/
- 亿邦动力：https://www.ebrun.com/

适合查询：宏观趋势、产业变化、合规白皮书、投融资与商用落地案例。  
信心等级：中高。适合做背景判断，不适合替代真实产品测试。

### 3.7 国内专项评测与中文基准

- CLiB 中文大模型基准：https://www.clib-bench.com/
- BFCL Tool 调用基准：https://bfcl.berkeley.edu/
- AIHOT 国产模型热度榜：https://aihot.virxact.com/leaderboard
- OpenCompass：https://opencompass.org.cn/

适合查询：中文能力、工具调用/Agent、国产热度与口碑。  
信心等级：中。与海外榜单交叉验证，避免单一榜单定论。

### 3.8 平台使用策略（合并自 PDF）

1. 新手选型 / 日常使用：工具导航 + 国产热度/性能榜  
2. 开发落地 / API 调用：云厂商广场 + API 集市  
3. 私有化 / 开源二次开发：Hugging Face / ModelScope / GitHub  
4. 学术科研 / 技术溯源：Papers with Code、arXiv、HELM、CLiB、BFCL  
5. 企业选型 / 商用决策：Artificial Analysis + 行业报告 + 自测集  
6. 合规项目：国内云厂商官方广场 + 信通院 / 智源等权威报告

---

## 4. 产品经理选型评分框架

### 4.1 必评维度

- 成本：输入/输出 token、图片/视频/语音单价、并发费用、私有化成本。
- 速度：首 token 延迟、整体响应时间、批处理吞吐。
- 准确性：事实准确、格式稳定、任务完成率。
- 推理能力：复杂分析、多步骤规划、数学和逻辑判断。
- 中文能力：中文理解、中文表达、本土语境、行业术语。
- 代码能力：生成、调试、重构、测试、仓库理解。
- 多模态能力：图片、PDF、截图、表格、音频、视频理解。
- 上下文长度：长文档、长对话、代码仓库、知识库上下文容量。
- 工具调用能力：函数调用、浏览器、数据库、代码执行、外部 API。
- API 稳定性：限流、错误率、版本迁移、SLA。
- 数据安全：数据留存、训练使用政策、企业隔离、审计。
- 私有化部署：开源权重、本地部署、国产化、合规环境。
- 生态成熟度：SDK、插件、社区、示例、企业案例。

### 4.2 推荐打分方式

- 1 分：无法满足或风险高。
- 2 分：勉强可用，需要大量人工补救。
- 3 分：可满足基础需求。
- 4 分：表现良好，可用于主要流程。
- 5 分：明显领先，可作为核心能力依赖。

建议不要做一个“全能总分”。更好的方式是按场景加权，例如：

- 客服知识库：准确性、检索、成本、数据安全权重更高。
- 代码助手：代码能力、仓库上下文、工具调用、响应速度权重更高。
- 营销素材：图像/视频质量、版权、成本、批量生产权重更高。
- 企业 Agent：工具调用、权限治理、稳定性、审计能力权重更高。

---

## 5. 产品经理决策流程

1. 定义任务：明确是写作、问答、推理、代码、多模态、图像、视频、语音、检索还是 Agent。
2. 明确风险：判断是否涉及钱、权限、隐私、合规、医疗、法律、删除或审批。
3. 选择候选：从官方文档、榜单、API 聚合平台和工具目录各取 2-3 个候选。
4. 建立测试集：用真实业务样本设计 20-50 个任务，不只看公开 Demo。
5. 设定评分：按成本、速度、准确性、中文能力、稳定性等维度加权。
6. 小流量试点：先在低风险场景测试，保留人工确认。
7. 决定接入方式：API、SaaS、开源自部署、混合方案。
8. 建立监控：记录错误样本、成本、延迟、用户满意度和人工接管率。
9. 定期复评：模型能力和价格变化快，建议月度复查。

---

## 6. 不同业务场景推荐

### 创业公司做 AI 产品

- 推荐组合：强通用 LLM + 便宜备选模型 + Embedding/RAG + 可观测日志。
- 关注重点：上线速度、成本、差异化数据、可替换模型架构。
- 避免：过早绑定单一闭源模型，或在没有真实数据时追求复杂 Agent。
- 信心：中高。

### 企业内部知识库/智能助手

- 推荐组合：Embedding + RAG + 通用 LLM + 权限控制 + 审计日志。
- 关注重点：数据安全、权限、召回质量、答案可追溯。
- 避免：把企业知识直接塞给模型而不做文档治理；不可用生成模型替代向量模型。
- 信心：高。

### 个人效率工具

- 推荐组合：通用 LLM + 多模态 + 语音 + 自动化工具。
- 关注重点：使用体验、响应速度、跨应用流转。
- 避免：复杂配置导致用户学习成本过高；简单单次任务不必上 Agent。
- 信心：中高。

### 内容营销团队

- 推荐组合：LLM 文案 + 图像生成 + 视频生成 + 品牌审核流程。
- 关注重点：批量产出、品牌一致性、版权、人工审核。
- 避免：直接发布未经校验的生成内容；勿用文本模型硬做视觉/视频。
- 信心：中。

### 研发团队

- 推荐组合：代码模型 + IDE Agent + 仓库上下文 + CI 测试。
- 关注重点：代码质量、测试覆盖、上下文理解、权限边界。
- 避免：无人审查自动提交生产代码；工程级任务不要只靠通用聊天模型。
- 信心：中高。

### 教育或培训产品

- 推荐组合：通用 LLM + 推理模型 + 语音模型 + 个性化学习记录。
- 关注重点：反馈质量、安全边界、循序渐进、学习效果评估。
- 避免：生成不准确知识或替代专业教师判断。
- 信心：中。

### 客服/销售自动化产品

- 推荐组合：RAG + LLM + 工具调用 + CRM/工单系统集成。
- 关注重点：准确率、接管率、话术一致性、合规和客户体验。
- 避免：让模型直接承诺价格、合同、退款等敏感事项。
- 信心：中高。

### 6.1 场景选型速查表（合并自 PDF）

| 核心场景 | 优先类型 | 备选方向 | 避坑 |
|---|---|---|---|
| 通用文案 / 日常问答 | 通用 LLM | 通义 / DeepSeek / 豆包 | 勿用专项模型做通用写作 |
| 长文档 / 合同 / 财报精读 | 超长上下文能力 | Claude / Kimi / Gemini 长文本 | 通用模型易漏细节 |
| 代码开发与工程重构 | 代码模型 | Copilot / 通义灵码 / Cursor | 商用项目勿只靠通用模型 |
| 图文解析 / 截图解题 | 多模态 | 豆包多模态 / Gemini | 单一绘画别硬用多模态 |
| 海报 / 电商视觉 | 图像生成 | 通义万相 / Midjourney | 勿用纯文本模型做视觉 |
| 短视频 / 数字人 | 视频 + 语音 | 剪映 AI / Runway / Sora | 通用文本模型无法稳定出片 |
| 企业知识库 / RAG | Embedding | 国产向量模型 | 生成模型不能替代向量模型 |
| 自动化办公 / 调研 | Agent | Coze / WorkBuddy / Dify | 长周期任务要人工校验 |
| 法律 / 医疗 / 金融专业作业 | 垂直领域模型 | 通用顶配 + 人工审核 | 通用输出不可直接商用 |

---

## 7. 可信度口径

- 高可信：官方文档、官方价格页、正式 changelog、可复现 Benchmark、企业 SLA、真实业务 A/B 数据。
- 中可信：第三方榜单、工具目录、用户评论、行业媒体、社区复现、API 聚合平台。
- 低可信：社交媒体爆料、未经验证的排行榜截图、厂商营销话术、单个 Demo、无来源转载。

结论使用原则：

- 能力和价格：以官方源为主。
- 综合体验：官方源 + 第三方榜单 + 自测样本交叉验证。
- 产品热度：工具目录、Product Hunt、G2、社区讨论只作辅助。
- 选型决策：最终以真实业务测试集为准。

