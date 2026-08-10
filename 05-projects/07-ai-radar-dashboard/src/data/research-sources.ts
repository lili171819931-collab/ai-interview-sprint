/**
 * AI 动态雷达 · 5 个监控池信息源矩阵
 * + 商业掘金情报源（并列展示于 /sources，不进入雷达日报 5 池校验）
 * 用于人工交叉验证与日报调研；日更自动抓取仍只用 LIVE_SOURCES。
 */

export type MonitorPool =
  | "model_leaderboard"
  | "tool_directory"
  | "news_brief"
  | "papers_research"
  | "official_release";

/** 商业热点 / 信息差 / 选品变现情报源（与 AI 5 池并列，不写入雷达信号 pool） */
export type CommerceIntelPool =
  | "search_trends"
  | "commerce_data"
  | "capital_industry"
  | "delivery_stack";

export type ResearchSource = {
  id: string;
  name: string;
  url: string;
  pool: MonitorPool;
  note: string;
  level: "official" | "first_hand" | "secondary";
};

export type CommerceIntelSource = {
  id: string;
  name: string;
  url: string;
  pool: CommerceIntelPool;
  note: string;
  level: "official" | "first_hand" | "secondary";
};

export const MONITOR_POOL_LABELS: Record<MonitorPool, string> = {
  model_leaderboard: "模型榜单",
  tool_directory: "工具目录",
  news_brief: "新闻快讯",
  papers_research: "论文研究",
  official_release: "官方发布",
};

/** @deprecated use MONITOR_POOL_LABELS */
export const RESEARCH_SOURCE_GROUP_LABELS = MONITOR_POOL_LABELS;
/** @deprecated use MonitorPool */
export type ResearchSourceGroup = MonitorPool;

export const RESEARCH_SOURCES: ResearchSource[] = [
  // 1) 模型榜单
  {
    id: "artificial-analysis",
    name: "Artificial Analysis",
    url: "https://artificialanalysis.ai/",
    pool: "model_leaderboard",
    note: "模型能力、速度、价格、上下文与 API 成本对比",
    level: "first_hand",
  },
  {
    id: "lmarena",
    name: "LMArena / Chatbot Arena",
    url: "https://lmarena.ai/",
    pool: "model_leaderboard",
    note: "基于用户偏好的大模型竞技场榜单",
    level: "first_hand",
  },
  {
    id: "hf-open-llm-leaderboard",
    name: "Hugging Face Open LLM Leaderboard",
    url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard",
    pool: "model_leaderboard",
    note: "开源模型排行榜",
    level: "first_hand",
  },
  {
    id: "swe-bench",
    name: "SWE-bench",
    url: "https://www.swebench.com/",
    pool: "model_leaderboard",
    note: "代码 / 软件工程能力评测",
    level: "first_hand",
  },
  {
    id: "papers-with-code-sota",
    name: "Papers with Code SOTA",
    url: "https://paperswithcode.com/sota",
    pool: "model_leaderboard",
    note: "论文任务榜单与 SOTA 模型追踪",
    level: "secondary",
  },
  {
    id: "epoch-ai",
    name: "Epoch AI",
    url: "https://epoch.ai/",
    pool: "model_leaderboard",
    note: "AI 趋势、算力、模型规模与产业研究",
    level: "first_hand",
  },
  {
    id: "stanford-ai-index",
    name: "Stanford AI Index",
    url: "https://aiindex.stanford.edu/",
    pool: "model_leaderboard",
    note: "年度 AI 行业权威报告",
    level: "first_hand",
  },

  // 2) 工具目录
  {
    id: "theres-an-ai-for-that",
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com/",
    pool: "tool_directory",
    note: "AI 工具目录，更新频繁，适合发现新工具",
    level: "secondary",
  },
  {
    id: "futurepedia",
    name: "Futurepedia",
    url: "https://www.futurepedia.io/",
    pool: "tool_directory",
    note: "AI 工具分类、趋势工具、场景筛选",
    level: "secondary",
  },
  {
    id: "product-hunt-ai",
    name: "Product Hunt AI",
    url: "https://www.producthunt.com/topics/artificial-intelligence",
    pool: "tool_directory",
    note: "新产品发布和社区热度",
    level: "secondary",
  },
  {
    id: "toolify",
    name: "Toolify",
    url: "https://www.toolify.ai/",
    pool: "tool_directory",
    note: "AI 工具库，适合按场景查找",
    level: "secondary",
  },
  {
    id: "topai-tools",
    name: "TopAI.tools",
    url: "https://topai.tools/",
    pool: "tool_directory",
    note: "AI 工具目录和分类榜单",
    level: "secondary",
  },
  {
    id: "g2-ai-software",
    name: "G2 AI Software",
    url: "https://www.g2.com/categories/artificial-intelligence",
    pool: "tool_directory",
    note: "偏企业软件评价，适合看真实用户反馈",
    level: "secondary",
  },

  // 3) 新闻快讯
  {
    id: "the-batch",
    name: "The Batch by DeepLearning.AI",
    url: "https://www.deeplearning.ai/the-batch/",
    pool: "news_brief",
    note: "高质量 AI 周报",
    level: "first_hand",
  },
  {
    id: "import-ai",
    name: "Import AI",
    url: "https://jack-clark.net/",
    pool: "news_brief",
    note: "偏前沿研究、政策和产业判断",
    level: "first_hand",
  },
  {
    id: "bens-bites",
    name: "Ben's Bites",
    url: "https://www.bensbites.com/",
    pool: "news_brief",
    note: "每日 AI 产品和新闻摘要",
    level: "secondary",
  },
  {
    id: "tldr-ai",
    name: "TLDR AI",
    url: "https://tldr.tech/ai",
    pool: "news_brief",
    note: "每日 AI 技术新闻",
    level: "secondary",
  },
  {
    id: "mit-tr-ai",
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/",
    pool: "news_brief",
    note: "AI 趋势和深度报道",
    level: "first_hand",
  },
  {
    id: "venturebeat-ai",
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/",
    pool: "news_brief",
    note: "AI 商业化、融资、产品动态",
    level: "secondary",
  },
  {
    id: "the-information",
    name: "The Information AI",
    url: "https://www.theinformation.com/",
    pool: "news_brief",
    note: "大厂、投资、AI 公司深度报道，部分付费",
    level: "secondary",
  },

  // 4) 论文研究（含必要时补充的社区信号）
  {
    id: "arxiv-cs-ai",
    name: "arXiv cs.AI",
    url: "https://arxiv.org/list/cs.AI/recent",
    pool: "papers_research",
    note: "人工智能论文最新列表",
    level: "first_hand",
  },
  {
    id: "arxiv-cs-lg",
    name: "arXiv cs.LG",
    url: "https://arxiv.org/list/cs.LG/recent",
    pool: "papers_research",
    note: "机器学习论文最新列表",
    level: "first_hand",
  },
  {
    id: "github-trending",
    name: "GitHub Trending",
    url: "https://github.com/trending",
    pool: "papers_research",
    note: "开源项目热度与新仓库信号（补充）",
    level: "secondary",
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    url: "https://news.ycombinator.com/",
    pool: "papers_research",
    note: "开发者社区讨论与突发动态（补充）",
    level: "secondary",
  },
  {
    id: "reddit-localllama",
    name: "Reddit r/LocalLLaMA",
    url: "https://www.reddit.com/r/LocalLLaMA/",
    pool: "papers_research",
    note: "本地/开源模型社区讨论（补充）",
    level: "secondary",
  },

  // 5) 官方发布
  {
    id: "openai-news",
    name: "OpenAI Blog / News",
    url: "https://openai.com/news/",
    pool: "official_release",
    note: "OpenAI 官方发布",
    level: "official",
  },
  {
    id: "anthropic-news",
    name: "Anthropic News",
    url: "https://www.anthropic.com/news",
    pool: "official_release",
    note: "Anthropic 官方发布",
    level: "official",
  },
  {
    id: "deepmind-blog",
    name: "Google DeepMind Blog",
    url: "https://deepmind.google/discover/blog/",
    pool: "official_release",
    note: "DeepMind 研究与产品发布",
    level: "official",
  },
  {
    id: "meta-ai-blog",
    name: "Meta AI Blog",
    url: "https://ai.meta.com/blog/",
    pool: "official_release",
    note: "Meta AI 官方博客",
    level: "official",
  },
  {
    id: "microsoft-ai-blog",
    name: "Microsoft AI Blog",
    url: "https://blogs.microsoft.com/ai/",
    pool: "official_release",
    note: "Microsoft AI 官方动态",
    level: "official",
  },
  {
    id: "nvidia-ai-blog",
    name: "NVIDIA Blog AI",
    url: "https://blogs.nvidia.com/blog/category/artificial-intelligence/",
    pool: "official_release",
    note: "NVIDIA AI 官方博客",
    level: "official",
  },
  {
    id: "mistral-news",
    name: "Mistral AI News",
    url: "https://mistral.ai/news/",
    pool: "official_release",
    note: "Mistral 官方新闻",
    level: "official",
  },
  {
    id: "huggingface-blog",
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog",
    pool: "official_release",
    note: "Hugging Face 官方博客",
    level: "official",
  },
];

export const COMMERCE_INTEL_POOL_LABELS: Record<CommerceIntelPool, string> = {
  search_trends: "搜索与需求趋势",
  commerce_data: "跨境电商与选品数据",
  capital_industry: "资本与行业深度",
  delivery_stack: "落地交付工具栈",
};

/** 商业掘金 / 信息差实时工具（/sources 可点击；不改七维分、不进雷达 5 池） */
export const COMMERCE_INTEL_SOURCES: CommerceIntelSource[] = [
  // 搜索与需求趋势
  {
    id: "google-trends",
    name: "Google Trends",
    url: "https://trends.google.com/trends/",
    pool: "search_trends",
    note: "全球/分国搜索热度、Rising/Breakout 查询；内容与选品第一信号",
    level: "first_hand",
  },
  {
    id: "exploding-topics",
    name: "Exploding Topics",
    url: "https://explodingtopics.com/",
    pool: "search_trends",
    note: "上升期趋势与品类发现，适合筛萌芽/上升而非周爆款",
    level: "secondary",
  },
  {
    id: "exploding-topics-products",
    name: "Exploding Topics · Trending Products",
    url: "https://explodingtopics.com/feature/trending-products",
    pool: "search_trends",
    note: "复合增长产品库，可按 3–6 月或 2–5 年窗口过滤",
    level: "secondary",
  },
  {
    id: "pinterest-trends",
    name: "Pinterest Trends",
    url: "https://trends.pinterest.com/",
    pool: "search_trends",
    note: "视觉消费与生活方式趋势，适合美护/家居/穿搭选品",
    level: "first_hand",
  },
  {
    id: "answer-the-public",
    name: "AnswerThePublic",
    url: "https://answerthepublic.com/",
    pool: "search_trends",
    note: "用户提问图谱，挖隐性痛点与内容选题",
    level: "secondary",
  },
  {
    id: "answer-socrates",
    name: "Answer Socrates",
    url: "https://answersocrates.com/",
    pool: "search_trends",
    note: "搜索提问与需求侧问题挖掘",
    level: "secondary",
  },
  {
    id: "buzzsumo",
    name: "BuzzSumo",
    url: "https://buzzsumo.com/",
    pool: "search_trends",
    note: "内容传播与高互动选题验证",
    level: "secondary",
  },

  // 跨境电商与选品数据
  {
    id: "fastmoss",
    name: "FastMoss",
    url: "https://www.fastmoss.com/",
    pool: "commerce_data",
    note: "TikTok Shop 多市场销量/类目排行，欧新四国测款对照",
    level: "secondary",
  },
  {
    id: "kalodata",
    name: "Kalodata",
    url: "https://www.kalodata.com/",
    pool: "commerce_data",
    note: "社媒电商与 TTS 数据看板，国别 GMV/爆款追踪",
    level: "secondary",
  },
  {
    id: "asinsight",
    name: "ASInsight",
    url: "https://www.asinsight.com/",
    pool: "commerce_data",
    note: "Amazon 关键词销量与竞争度参考（如 PDRN 细分）",
    level: "secondary",
  },
  {
    id: "tiktok-newsroom-shop",
    name: "TikTok Newsroom · Shop",
    url: "https://newsroom.tiktok.com/",
    pool: "commerce_data",
    note: "TTS 开市、Sell Across Europe 等官方政策一手源",
    level: "official",
  },
  {
    id: "aibase",
    name: "AIbase",
    url: "https://www.aibase.com/",
    pool: "commerce_data",
    note: "国内 AI 产品/资讯聚合，补中文侧热点差",
    level: "secondary",
  },

  // 资本与行业深度
  {
    id: "cb-insights",
    name: "CB Insights",
    url: "https://www.cbinsights.com/",
    pool: "capital_industry",
    note: "融资、赛道与公司图谱；看资本集中度与退出信号",
    level: "first_hand",
  },
  {
    id: "cb-insights-ai-q2-2026",
    name: "CB Insights · State of AI Q2’26",
    url: "https://www.cbinsights.com/research/report/ai-trends-q2-2026/",
    pool: "capital_industry",
    note: "AI 融资结构（超大轮占比等）季报入口",
    level: "first_hand",
  },
  {
    id: "hbr-agentic-commerce",
    name: "HBR · Algorithmic Shopping",
    url: "https://hbr.org/2026/08/algorithmic-shopping-is-here-is-your-company-ready",
    pool: "capital_industry",
    note: "Agentic Commerce / 算法购物战略深度（2026-08）",
    level: "first_hand",
  },

  // 落地交付工具栈
  {
    id: "n8n",
    name: "n8n",
    url: "https://n8n.io/",
    pool: "delivery_stack",
    note: "事件驱动自动化；适合垂直 SOP Agent 编排层",
    level: "official",
  },
  {
    id: "dify",
    name: "Dify",
    url: "https://dify.ai/",
    pool: "delivery_stack",
    note: "RAG/Agent 应用构建；适合推理与知识层",
    level: "official",
  },
  {
    id: "langchain-blog",
    name: "LangChain Blog",
    url: "https://www.langchain.com/blog",
    pool: "delivery_stack",
    note: "Agent 框架与托管 Deep Agents 等发布",
    level: "official",
  },
  {
    id: "cursor-changelog",
    name: "Cursor Changelog",
    url: "https://cursor.com/changelog",
    pool: "delivery_stack",
    note: "IDE/Agent 工作流能力变更",
    level: "official",
  },
  {
    id: "comfyui-releases",
    name: "ComfyUI Releases",
    url: "https://github.com/Comfy-Org/ComfyUI/releases",
    pool: "delivery_stack",
    note: "图像工作流开源发布；内容/设计侧生产力信号",
    level: "official",
  },
];

export function researchSourcesByPool(): Record<MonitorPool, ResearchSource[]> {
  const pools = Object.keys(MONITOR_POOL_LABELS) as MonitorPool[];
  return pools.reduce(
    (acc, pool) => {
      acc[pool] = RESEARCH_SOURCES.filter((s) => s.pool === pool);
      return acc;
    },
    {} as Record<MonitorPool, ResearchSource[]>,
  );
}

export function commerceIntelSourcesByPool(): Record<
  CommerceIntelPool,
  CommerceIntelSource[]
> {
  const pools = Object.keys(COMMERCE_INTEL_POOL_LABELS) as CommerceIntelPool[];
  return pools.reduce(
    (acc, pool) => {
      acc[pool] = COMMERCE_INTEL_SOURCES.filter((s) => s.pool === pool);
      return acc;
    },
    {} as Record<CommerceIntelPool, CommerceIntelSource[]>,
  );
}

/** @deprecated use researchSourcesByPool */
export function researchSourcesByGroup() {
  return researchSourcesByPool();
}
