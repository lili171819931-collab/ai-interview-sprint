export type LiveSourceDef = {
  id: string;
  label: string;
  url: string;
  kind: "rss" | "html-changelog";
  /** Tools that receive this feed's latest item as changelog */
  toolIds: string[];
  level: "official" | "secondary";
};

/**
 * Public, login-free feeds only.
 * - Prefer vendor RSS / GitHub Atom releases
 * - Anthropic uses community-maintained mirror (secondary)
 * - No private dashboards, no credentialed scrape
 */
export const LIVE_SOURCES: LiveSourceDef[] = [
  {
    id: "openai-news",
    label: "OpenAI News RSS",
    url: "https://openai.com/news/rss.xml",
    kind: "rss",
    toolIds: ["chatgpt", "openai-api"],
    level: "official",
  },
  {
    id: "anthropic-news-mirror",
    label: "Anthropic News (Turing Institute feed mirror)",
    url: "https://raw.githubusercontent.com/alan-turing-institute/ai-rss-feeds/refs/heads/main/feeds/anthropic-news.xml",
    kind: "rss",
    toolIds: ["claude", "anthropic-api", "claude-code"],
    level: "secondary",
  },
  {
    id: "google-ai-blog",
    label: "Google AI Blog RSS",
    url: "https://blog.google/innovation-and-ai/technology/ai/rss/",
    kind: "rss",
    toolIds: ["gemini"],
    level: "official",
  },
  {
    id: "mistral-news",
    label: "Mistral News RSS",
    url: "https://mistral.ai/news/rss",
    kind: "rss",
    toolIds: ["mistral"],
    level: "official",
  },
  {
    id: "huggingface-blog",
    label: "Hugging Face Blog RSS",
    url: "https://huggingface.co/blog/feed.xml",
    kind: "rss",
    toolIds: ["huggingface"],
    level: "official",
  },
  {
    id: "langchain-blog",
    label: "LangChain Blog RSS",
    url: "https://www.langchain.com/blog/rss.xml",
    kind: "rss",
    toolIds: ["langchain"],
    level: "official",
  },
  {
    id: "cursor-changelog",
    label: "Cursor Changelog",
    url: "https://cursor.com/changelog",
    kind: "html-changelog",
    toolIds: ["cursor"],
    level: "official",
  },
  {
    id: "dify-releases",
    label: "Dify GitHub Releases Atom",
    url: "https://github.com/langgenius/dify/releases.atom",
    kind: "rss",
    toolIds: ["dify"],
    level: "official",
  },
  {
    id: "n8n-releases",
    label: "n8n GitHub Releases Atom",
    url: "https://github.com/n8n-io/n8n/releases.atom",
    kind: "rss",
    toolIds: ["n8n"],
    level: "official",
  },
  {
    id: "langchain-releases",
    label: "LangChain GitHub Releases Atom",
    url: "https://github.com/langchain-ai/langchain/releases.atom",
    kind: "rss",
    toolIds: ["langchain"],
    level: "official",
  },
  {
    id: "llamaindex-releases",
    label: "LlamaIndex GitHub Releases Atom",
    url: "https://github.com/run-llama/llama_index/releases.atom",
    kind: "rss",
    toolIds: ["llamaindex"],
    level: "official",
  },
  {
    id: "comfyui-releases",
    label: "ComfyUI GitHub Releases Atom",
    url: "https://github.com/comfyanonymous/ComfyUI/releases.atom",
    kind: "rss",
    toolIds: ["comfyui"],
    level: "official",
  },
  {
    id: "firecrawl-releases",
    label: "Firecrawl GitHub Releases Atom",
    url: "https://github.com/mendableai/firecrawl/releases.atom",
    kind: "rss",
    toolIds: ["firecrawl"],
    level: "official",
  },
];
