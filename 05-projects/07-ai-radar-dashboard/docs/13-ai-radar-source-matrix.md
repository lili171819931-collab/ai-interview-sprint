# AI 动态雷达 · 推荐信息源矩阵

> 角色视角：全球 AI 动态雷达分析师 + 产品策略顾问 + 模型评测专家  
> 目标：实时掌握模型能力变化、工具排行榜、产品发布、论文突破、融资并购与开源进展，沉淀对 PM / 创业者 / 技术团队有价值的机会点。  
> 代码登记：[`src/data/research-sources.ts`](../src/data/research-sources.ts)  
> 配套 Prompt：[`极致Prompt-AI动态雷达日更.md`](./极致Prompt-AI动态雷达日更.md)  
> 系统方案：[`12-ai-radar-research-system.md`](./12-ai-radar-research-system.md)

---

## 1. 一句话说明

把全球 AI 信息源拆成 **5 个监控池**，每天按池交叉验证一次，输出结构化「AI 实时雷达报告」。  
原则：**官方源优先、榜单要有口径、不做无条件“最强”结论、不自动改七维评分。**

| 监控池 | 用途 | 建议频率 |
|--------|------|----------|
| 模型榜单 | 能力、价格、速度、开源可用性变化 | 每日 / 每周深看 |
| 工具目录 | 新品发现、场景工具、企业评价 | 每日 |
| 新闻快讯 | 产业动态、融资、政策与深度报道 | 每日 |
| 论文研究 | 前沿论文、开源项目、社区信号 | 每日扫 / 每周深读 |
| 官方发布 | 厂商正式发布与 changelog | 每日 |

---

## 2. 推荐网站与链接

### 2.1 模型榜单（`model_leaderboard`）

| 网站 | 链接 | 简要介绍 |
|------|------|----------|
| Artificial Analysis | https://artificialanalysis.ai/ | 模型能力、速度、价格、上下文长度与 API 成本对比，适合看 LLM 综合排名。 |
| LMArena / Chatbot Arena | https://lmarena.ai/ | 基于用户偏好的大模型竞技场榜单，适合看真实交互体验排名。 |
| Hugging Face Open LLM Leaderboard | https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard | 开源模型排行榜与公开评测入口。 |
| SWE-bench | https://www.swebench.com/ | 代码能力 / 软件工程能力评测，适合看 Agent 与编程模型。 |
| Papers with Code SOTA | https://paperswithcode.com/sota | 论文任务榜单与 SOTA 模型追踪。 |
| Epoch AI | https://epoch.ai/ | AI 趋势、算力、模型规模与产业研究。 |
| Stanford AI Index | https://aiindex.stanford.edu/ | 年度 AI 行业权威报告，适合宏观引用。 |

**怎么用：** 不要只看单一总榜；按推理 / 代码 / 多模态 / 价格 / 开源可用性拆开对比，并记录榜单时间与口径。

---

### 2.2 工具目录（`tool_directory`）

| 网站 | 链接 | 简要介绍 |
|------|------|----------|
| There's An AI For That | https://theresanaiforthat.com/ | AI 工具目录，更新频繁，适合发现新工具。 |
| Futurepedia | https://www.futurepedia.io/ | AI 工具分类、趋势工具、场景筛选。 |
| Product Hunt AI | https://www.producthunt.com/topics/artificial-intelligence | 新产品发布与社区热度。 |
| Toolify | https://www.toolify.ai/ | AI 工具库，适合按场景查找。 |
| TopAI.tools | https://topai.tools/ | AI 工具目录与分类榜单。 |
| G2 AI Software | https://www.g2.com/categories/artificial-intelligence | 偏企业软件评价，适合看真实用户反馈。 |

**怎么用：** 按场景（研究、写作、编程、设计、视频、办公、Agent、客服等）收敛候选，再进入智衡看板做七维对比。

---

### 2.3 新闻快讯（`news_brief`）

| 网站 | 链接 | 简要介绍 |
|------|------|----------|
| The Batch by DeepLearning.AI | https://www.deeplearning.ai/the-batch/ | 高质量 AI 周报，适合做周度复盘。 |
| Import AI | https://jack-clark.net/ | 偏前沿研究、政策与产业判断。 |
| Ben's Bites | https://www.bensbites.com/ | 每日 AI 产品与新闻摘要。 |
| TLDR AI | https://tldr.tech/ai | 每日 AI 技术新闻。 |
| MIT Technology Review AI | https://www.technologyreview.com/topic/artificial-intelligence/ | AI 趋势与深度报道。 |
| VentureBeat AI | https://venturebeat.com/category/ai/ | AI 商业化、融资、产品动态。 |
| The Information AI | https://www.theinformation.com/ | 大厂、投资、AI 公司深度报道，部分付费。 |

**怎么用：** 先用日报抓突发，再用周报与深度稿做判断；区分「已确认事实 / 推测 / 传闻 / 官方发布」。

---

### 2.4 论文研究（`papers_research`）

| 网站 | 链接 | 简要介绍 |
|------|------|----------|
| arXiv cs.AI | https://arxiv.org/list/cs.AI/recent | 人工智能论文最新列表。 |
| arXiv cs.LG | https://arxiv.org/list/cs.LG/recent | 机器学习论文最新列表。 |
| GitHub Trending | https://github.com/trending | 开源项目热度与新仓库信号（补充）。 |
| Hacker News | https://news.ycombinator.com/ | 开发者社区讨论与突发动态（补充）。 |
| Reddit r/LocalLLaMA | https://www.reddit.com/r/LocalLLaMA/ | 本地 / 开源模型社区讨论（补充）。 |

**怎么用：** 论文看贡献与可复现；社区信号只作补充证据，不单独支撑高可信结论。必要时再查 X/Twitter、官方文档。

---

### 2.5 官方发布（`official_release`）

| 网站 | 链接 | 简要介绍 |
|------|------|----------|
| OpenAI Blog / News | https://openai.com/news/ | OpenAI 官方发布与产品动态。 |
| Anthropic News | https://www.anthropic.com/news | Anthropic 官方发布。 |
| Google DeepMind Blog | https://deepmind.google/discover/blog/ | DeepMind 研究与产品发布。 |
| Meta AI Blog | https://ai.meta.com/blog/ | Meta AI 官方博客。 |
| Microsoft AI Blog | https://blogs.microsoft.com/ai/ | Microsoft AI 官方动态。 |
| NVIDIA Blog AI | https://blogs.nvidia.com/blog/category/artificial-intelligence/ | NVIDIA AI 官方博客。 |
| Mistral AI News | https://mistral.ai/news/ | Mistral 官方新闻。 |
| Hugging Face Blog | https://huggingface.co/blog | Hugging Face 官方博客。 |

**怎么用：** 正式产品能力、定价、可用性变更以官方源为准；社区解读需回链官方原文。

---

## 3. 每日更新机制（简版）

1. **扫 5 池**：模型榜单 → 官方发布 → 新闻快讯 → 工具目录 → 论文研究。  
2. **交叉验证**：同一事件至少 2 类来源；冲突时写清冲突点与判断依据。  
3. **入库字段**：名称、类别、热度、排名、可信度、更新时间、来源链接、PM 机会点。  
4. **输出形态**：日报 / 周报 / 排行榜变化 / 风险提醒 / 机会洞察。  
5. **边界**：情报源不自动改七维分数；日更抓取仍只走公开 RSS（见 `live-sources.ts`）。

页面入口：本地运行后打开 [`/sources`](http://localhost:3010/sources) 可点击全部站点链接。

---

## 4. 看板字段建议

| 字段 | 说明 |
|------|------|
| name | 事件 / 模型 / 工具 / 论文名称 |
| category | 模型 / 工具 / 论文 / 新闻 / 官方发布 / 融资并购 |
| pool | 五个监控池之一 |
| heat | 热度（高 / 中 / 低） |
| rank | 排名或排名变化（如有） |
| confidence | high / medium / low |
| updatedAt | 更新或发布时间 |
| sourceUrl | 来源链接 |
| pmInsight | PM 机会点或风险 |

---

## 5. 验收标准

- 任意推荐结论能点开来源链接。  
- 五个监控池齐全，且与 `research-sources.ts` 一致。  
- 榜单结论写清时间与口径，不出现无条件“全球最强”。  
- 官方源与社区源有等级区分。  
- 日报可在 10 分钟内形成：候选、风险、下一步行动。
