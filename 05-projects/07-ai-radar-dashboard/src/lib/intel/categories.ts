/** AIHOT-aligned feed taxonomy used by 精选 / 全部 / 日报 / v1 API. */

export const FEED_WINDOWS = ["24h", "7d"] as const;
export type FeedWindow = (typeof FEED_WINDOWS)[number];

export const FEED_MODES = ["selected", "all"] as const;
export type FeedMode = (typeof FEED_MODES)[number];

export const FEED_CATEGORIES = ["ai-models", "ai-products", "industry", "paper", "tip"] as const;
export type FeedCategory = (typeof FEED_CATEGORIES)[number] | "general";

export const FEED_CATEGORY_LABELS: Record<FeedCategory, string> = {
  "ai-models": "模型",
  "ai-products": "产品",
  industry: "行业",
  paper: "论文",
  tip: "技巧",
  general: "综合",
};

export const FEED_CATEGORY_CHIPS: { id: "" | (typeof FEED_CATEGORIES)[number]; label: string }[] = [
  { id: "", label: "全部主题" },
  { id: "ai-models", label: "模型" },
  { id: "ai-products", label: "产品" },
  { id: "industry", label: "行业" },
  { id: "paper", label: "论文" },
  { id: "tip", label: "技巧" },
];

const KNOWN = new Set<string>(FEED_CATEGORIES);

export function isFeedCategory(v: string): v is Exclude<FeedCategory, "general"> {
  return KNOWN.has(v);
}

export function mapToFeedCategory(raw: string | null | undefined, title = "", summary = ""): FeedCategory {
  const given = (raw || "").trim();
  if (isFeedCategory(given)) return given;
  const blob = `${given} ${title} ${summary}`;
  if (/arxiv|paper|论文|research|研究指出|HuggingFace Daily Papers/i.test(blob)) return "paper";
  if (/GPT|Claude|Grok|Gemini|Llama|Qwen|DeepSeek|Nemotron|大模型|模型权重|开源模型|MAI-Thinking/i.test(blob)) {
    return "ai-models";
  }
  if (/Cursor|Claude in Chrome|WorkBuddy|产品发布|上线|Chrome|Cowork|OpenRouter/i.test(blob)) {
    return "ai-products";
  }
  if (/NVIDIA|融资|监管|投资|行业|工厂算力|月活|下载破/i.test(blob)) return "industry";
  if (/技巧|教程|how to|指南|tip|评测|基准/i.test(blob)) return "tip";
  if (given === "ai" || given === "tech") return "ai-products";
  return "general";
}

export function isAiSelectedBlob(title: string, category: string, summary = ""): boolean {
  if (isFeedCategory(category) || category === "ai" || category === "tech") return true;
  return isAiRelatedText(`${title} ${summary}`);
}

/** AI / 模型 / 开发相关：英文避免匹配 said 里的 AI 片段。 */
export function isAiRelatedText(text: string): boolean {
  const blob = (text || "").trim();
  if (!blob) return false;
  return /人工智能|生成式|大模型|大语言模型|智能体|机器学习|深度学习|神经网络|计算机视觉|自然语言处理|多模态|AIGC|ChatGPT|Claude|Gemini|Grok|DeepSeek|Qwen|Llama|Mistral|Nemotron|OpenAI|Anthropic|xAI|Hugging\s?Face|Midjourney|Stable Diffusion|Sora|Runway|Cursor|Copilot|Codex|Windsurf|Devin|Manus|Kimi|通义|文心|豆包|即梦|可灵|\bLLMs?\b|\bGPTs?\b|GPT-?\d|(?:^|[^A-Za-z])AI(?:[^A-Za-z]|$)|Agentic|\bAgents?\b|\bRAG\b|\bMCP\b|微调|推理引擎|模型权重|模型训练|模型开发|开源模型|闭源模型|foundation model|transformer|diffusion|CUDA|算力|英伟达|NVIDIA|数字人|AI编程|AI视频|AI绘画|AI写作|AI搜索|AI助手|coding agent|LLMOps|MLOps|vLLM|Ollama|ComfyUI|LangChain|LlamaIndex/i.test(
    blob,
  );
}

/** Stricter AI filter for mixed consumer hot lists (Weibo / Douyin / etc.). */
export function isAiHotTitle(title: string, extra = ""): boolean {
  return isAiRelatedText(`${title} ${extra}`);
}

export function beijingTime(iso: string | null | undefined): string {
  if (!iso) return "时间未知";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(t));
}

export function parseTimeMs(raw: string | null | undefined, fallbackIso: string): number {
  const parsed = coerceTimeMs(raw);
  if (parsed != null) return parsed;
  const fb = coerceTimeMs(fallbackIso);
  return fb != null ? fb : Date.now();
}

/** Reject TrendRadar-style "14-32" / "19-03" clock stamps that Date.parse mishandles. */
function coerceTimeMs(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d{1,2}-\d{2}$/.test(s)) return null;
  if (/^\d{1,2}:\d{2}$/.test(s)) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

export function toIsoOr(raw: string | null | undefined, fallbackIso: string): string {
  const ms = parseTimeMs(raw, fallbackIso);
  return new Date(ms).toISOString();
}

export function windowStartMs(window: FeedWindow, now = Date.now()): number {
  return now - (window === "24h" ? 24 : 24 * 7) * 60 * 60 * 1000;
}

/** AIHOT timeline axis: slow sources stay in 24h if discovered recently; backfills >72h use publishedAt. */
export function timelineMs(publishedAt: string | null, discoveredAt: string, generatedAt: string): number {
  const disc = parseTimeMs(discoveredAt, generatedAt);
  if (!publishedAt) return disc;
  const pub = parseTimeMs(publishedAt, discoveredAt);
  if (disc - pub > 72 * 60 * 60 * 1000) return pub;
  return disc;
}

export function buildQueryString(params: {
  window?: string;
  category?: string;
  q?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.window && params.window !== "24h") sp.set("window", params.window);
  if (params.category) sp.set("category", params.category);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  const s = sp.toString();
  return s ? `?${s}` : "";
}
