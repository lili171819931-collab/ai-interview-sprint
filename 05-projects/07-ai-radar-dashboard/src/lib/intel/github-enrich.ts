import type { GithubStarItem } from "./github-types";

type KnownMeta = {
  homepage?: string;
  license?: string;
  features?: string[];
  openSource?: boolean;
};

/** Mature product sites + what the repo actually ships. */
const KNOWN: Record<string, KnownMeta> = {
  "codecrafters-io/build-your-own-x": {
    homepage: "https://codecrafters.io",
    license: "CC-BY-4.0",
    features: ["Rebuild Git, Docker, Redis from scratch", "Guided programming challenges", "Language-agnostic tutorials"],
  },
  "openclaw/openclaw": {
    homepage: "https://openclaw.ai",
    license: "MIT",
    features: ["Personal AI assistant", "Runs on any OS", "Local-first, own-your-data"],
  },
  "awesome-selfhosted/awesome-selfhosted": {
    homepage: "https://awesome-selfhosted.net",
    license: "CC-BY-SA-3.0",
    features: ["Curated self-hosted software list", "Network services catalog", "Privacy-friendly alternatives"],
  },
  "n8n-io/n8n": {
    homepage: "https://n8n.io",
    license: "Sustainable Use",
    features: ["Visual workflow automation", "400+ app integrations", "AI + human-in-the-loop agents", "Self-host or cloud"],
  },
  "Significant-Gravitas/AutoGPT": {
    homepage: "https://agpt.co",
    license: "MIT",
    features: ["Autonomous AI agents", "Multi-agent workflows", "Tool use and memory"],
  },
  "yt-dlp/yt-dlp": {
    license: "Unlicense",
    features: ["Download video/audio from 1000+ sites", "Format selection", "Playlists and live streams"],
  },
  "f/prompts.chat": {
    homepage: "https://prompts.chat",
    license: "MIT",
    features: ["ChatGPT prompt library", "Role-based prompt templates"],
  },
  "firecrawl/firecrawl": {
    homepage: "https://www.firecrawl.dev",
    license: "AGPL-3.0",
    features: ["Crawl sites to LLM-ready markdown", "Search and extract APIs", "Media parsing"],
  },
  "Snailclimb/JavaGuide": {
    homepage: "https://javaguide.cn",
    license: "MIT",
    features: ["Java interview guide", "Core + concurrent + JVM notes"],
  },
  "langgenius/dify": {
    homepage: "https://dify.ai",
    license: "Apache-2.0",
    features: ["LLM app orchestration", "RAG knowledge bases", "Agent workflows", "Prompt IDE"],
  },
  "anthropics/claude-code": {
    homepage: "https://code.claude.com",
    license: "MIT",
    features: ["Terminal coding agent", "Repo-scale context", "CLI and IDE workflows"],
  },
  "openai/codex": {
    homepage: "https://chatgpt.com/codex",
    license: "Apache-2.0",
    features: ["Coding agent CLI", "Local repo edits", "Task execution"],
  },
  "DIYgod/RSSHub": {
    homepage: "https://docs.rsshub.app",
    license: "MIT",
    features: ["RSS for sites without feeds", "Hundreds of route adapters", "Self-hostable"],
  },
  "exo-explore/exo": {
    homepage: "https://exo.dev",
    license: "GPL-3.0",
    features: ["Run models across devices", "Cluster everyday GPUs", "Self-hosted inference"],
  },
  "CapSoftware/Cap": {
    homepage: "https://cap.so",
    license: "AGPL-3.0",
    features: ["Open-source screen recording", "Shareable capture links", "Loom alternative"],
  },
  "drawdb-io/drawdb": {
    homepage: "https://www.drawdb.app",
    license: "AGPL-3.0",
    features: ["Database diagram editor", "Export SQL", "Collaborate on schemas"],
  },
  "goauthentik/authentik": {
    homepage: "https://goauthentik.io",
    license: "MIT",
    features: ["Identity provider", "SSO / MFA", "Self-hosted IdP"],
  },
  "iv-org/invidious": {
    homepage: "https://invidious.io",
    license: "AGPL-3.0",
    features: ["YouTube front-end", "No official JS client", "Privacy-friendly playback"],
  },
  "Kilo-Org/kilocode": {
    homepage: "https://kilo.ai",
    license: "Apache-2.0",
    features: ["AI coding agent", "Open-source VS Code fork workflows"],
  },
  "gitroomhq/postiz-app": {
    homepage: "https://postiz.com",
    license: "AGPL-3.0",
    features: ["Social scheduling", "Multi-platform posts", "Self-host or cloud"],
  },
  "uiverse-io/galaxy": {
    homepage: "https://uiverse.io",
    license: "MIT",
    features: ["Open UI element library", "Copy-paste components"],
  },
  "heygen-com/hyperframes": {
    homepage: "https://www.heygen.com",
    license: "MIT",
    features: ["AI video scene skills", "HeyGen HyperFrames workflows"],
  },
  "TestSprite/testsprite-cli": {
    homepage: "https://www.testsprite.com",
    license: "MIT",
    features: ["AI test generation CLI", "Automated QA workflows"],
  },
  "microsoft/AI-For-Beginners": {
    homepage: "https://microsoft.github.io/AI-For-Beginners/",
    license: "MIT",
    features: ["Beginner AI curriculum", "Hands-on lessons"],
  },
  "microsoft/TRELLIS.2": {
    homepage: "https://microsoft.github.io/TRELLIS/",
    license: "MIT",
    features: ["3D generation from images", "Structured latent 3D models"],
  },
  "sansan0/TrendRadar": {
    homepage: "https://github.com/sansan0/TrendRadar",
    license: "MIT",
    features: ["Hot-topic aggregation", "Multi-platform trend radar"],
  },
  "NanmiCoder/MediaCrawler": {
    license: "MIT",
    features: ["Crawl Weibo / Douyin / XHS", "Media content collection"],
  },
  "D4Vinci/Scrapling": {
    homepage: "https://scrapling.readthedocs.io",
    license: "BSD-3-Clause",
    features: ["Adaptive web scraping", "Resilient selectors"],
  },
  "Panniantong/Agent-Reach": {
    license: "MIT",
    features: ["Multi-platform social search", "Agent-ready collection APIs"],
  },
  "datawhalechina/hello-agents": {
    license: "MIT",
    features: ["Agent tutorial track", "Hands-on agent examples"],
  },
  "Shubhamsaboo/awesome-llm-apps": {
    license: "Apache-2.0",
    features: ["Curated LLM app examples", "RAG / agent recipes"],
  },
  "msitarzewski/agency-agents": {
    license: "MIT",
    features: ["Ready-made agency agent roles", "Skill packs for teams"],
  },
  "obra/superpowers": {
    license: "MIT",
    features: ["Agent skill collection", "Composable coding powers"],
  },
  "NousResearch/hermes-agent": {
    homepage: "https://nousresearch.com",
    license: "MIT",
    features: ["Hermes agent runtime", "Tool-using LLM agent"],
  },
  "paperclipai/paperclip": {
    homepage: "https://paperclip.ai",
    license: "MIT",
    features: ["AI office agent", "Document and task workflows"],
  },
  "slopus/happy": {
    license: "MIT",
    features: ["Codex / Claude Code mobile control", "Remote coding sessions"],
  },
  "baidu/Unlimited-OCR": {
    homepage: "https://ai.baidu.com",
    license: "Apache-2.0",
    features: ["OCR models and pipelines", "Document text extraction"],
  },
  "ATH-MaaS/Pixelle-Video": {
    license: "MIT",
    features: ["AI video generation workflows", "Composable media pipeline"],
  },
  "abus-aikorea/voice-pro": {
    license: "MIT",
    features: ["Voice cloning / TTS", "Speech processing toolkit"],
  },
  "StarTrail-org/PixelRAG": {
    license: "MIT",
    features: ["Visual RAG over screenshots", "Pixel-level retrieval"],
  },
  "easychen/one-person-businesses-methodology": {
    license: "CC-BY-4.0",
    features: ["One-person business playbook", "Indie methodology notes"],
  },
  "weijunext/indie-hacker-tools": {
    license: "MIT",
    features: ["Indie hacker tool list", "Growth and shipping stack"],
  },
  "naxiaoduo/1000UserGuide": {
    license: "MIT",
    features: ["First-1000-users playbook", "Acquisition tactics"],
  },
  "AIDevGTM/gtm-cofounder": {
    license: "MIT",
    features: ["GTM cofounder skill pack", "Developer go-to-market prompts"],
  },
  "iniwap/AIWriteX": {
    license: "MIT",
    features: ["AI writing for WeChat / content", "Multi-platform drafts"],
  },
  "HM-RunningHub/ComfyUI_RH_APICall": {
    homepage: "https://www.runninghub.ai",
    license: "MIT",
    features: ["ComfyUI API nodes", "RunningHub cloud workflows"],
  },
  "HM-RunningHub/ComfyUI_RH_OpenAPI": {
    homepage: "https://www.runninghub.ai",
    license: "MIT",
    features: ["ComfyUI OpenAPI nodes", "Remote Comfy workflows"],
  },
  "Zie619/n8n-workflows": {
    homepage: "https://n8n.io",
    license: "MIT",
    features: ["Ready-made n8n workflows", "Importable automation templates"],
  },
  "fuxiaoai/tidings-rss": {
    license: "MIT",
    features: ["RSS intelligence collection", "News digest pipelines"],
  },
  "1c7/chinese-independent-developer": {
    license: "MIT",
    features: ["Chinese indie maker list", "Product and story index"],
  },
};

const SKIP_TOPICS = new Set([
  "awesome",
  "awesome-list",
  "free",
  "programming",
  "tutorial-exercises",
  "crustacean",
  "molty",
  "own-your-data",
  "personal",
  "cloud",
  "hosting",
  "privacy",
  "ai",
]);

const TOPIC_LABEL: Record<string, string> = {
  tutorials: "Tutorials",
  "tutorial-code": "Hands-on tutorials",
  "self-hosted": "Self-hostable",
  selfhosted: "Self-hostable",
  "free-software": "Free software",
  "ai-agents": "AI agents",
  agents: "AI agents",
  mcp: "MCP tools",
  rag: "RAG retrieval",
  n8n: "n8n workflows",
  workflow: "Workflow automation",
  ocr: "OCR",
  tts: "Text-to-speech",
  llm: "LLM apps",
  assistant: "AI assistant",
  crawler: "Web crawler",
  scraping: "Web scraping",
  rss: "RSS feeds",
  video: "Video generation",
  "image-generation": "Image generation",
  cli: "Command-line tool",
  kubernetes: "Kubernetes",
  sso: "SSO / identity",
};

function featuresFromTopics(topics: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of topics) {
    const key = raw.trim().toLowerCase();
    if (!key || SKIP_TOPICS.has(key)) continue;
    const label = TOPIC_LABEL[key] || key.replace(/[-_]/g, " ");
    if (seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push(label);
    if (out.length >= 5) break;
  }
  return out;
}

function looksLikeUrl(s: string | null | undefined): s is string {
  return Boolean(s && /^https?:\/\//i.test(s.trim()));
}

export function enrichGithubStarItem(it: GithubStarItem): GithubStarItem {
  const known = KNOWN[it.fullName] || KNOWN[it.id];
  const homepage = looksLikeUrl(it.homepage) ? it.homepage!.trim() : known?.homepage || null;
  const license = (it.license || "").trim() || known?.license || "Public";
  const openSource = it.openSource ?? known?.openSource ?? true;
  const existing = (it.features || []).map((s) => s.trim()).filter(Boolean);
  const features = existing.length ? existing.slice(0, 6) : known?.features || featuresFromTopics(it.topics || []);
  return {
    ...it,
    homepage,
    license,
    openSource,
    features,
  };
}
