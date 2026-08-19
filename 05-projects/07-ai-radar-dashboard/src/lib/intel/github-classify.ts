import { GITHUB_CATEGORY_ORDER, type GithubCategory } from "./github-types";

export function classifyGithubStar(input: {
  fullName: string;
  description?: string | null;
  language?: string | null;
  topics?: string[];
}): GithubCategory {
  const topics = (input.topics || []).map((t) => t.toLowerCase());
  const blob = `${input.fullName} ${input.description || ""} ${topics.join(" ")} ${input.language || ""}`.toLowerCase();
  const has = (re: RegExp) => re.test(blob);

  if (
    has(
      /indie|1000user|aimoney|one-person-business|gtm-cofounder|job-search|独立开发|副业|出海|获客|early.?user|xhs-virtual/,
    )
  ) {
    return "growth";
  }
  if (
    has(
      /awesome|tutorial|beginners|handbook|howto|prompts\.chat|hello-agents|javaguide|build-your-own-x|面试指南|方法论/,
    )
  ) {
    return "learn";
  }
  if (
    has(
      /firecrawl|scrap|crawler|rsshub|trendradar|pixelrag|anysearch|pdf-inspector|agent-reach|yt-dlp|invidious|builderpulse|tidings|舆情|热搜|search.?engine/,
    )
  ) {
    return "intel";
  }
  if (
    has(
      /video|image-generation|tts|ocr|illustrat|humanizer|writing|xiaohongshu|wechat|公众号|短视频|seedance|pixelle|narrator|social-card|hook-lab|wewrite|aiwritex|html-anything|huashu|generative-media|screen.?record|cleanshot|capsoftware|snapzy|rescript|unlimited-ocr|voice-pro|drawdb|uiverse|genoffice|hyperframes|comfyui/,
    )
  ) {
    return "content";
  }
  if (has(/selfhosted|authentik|kubernetes|self-hosted|exo-explore\/exo/)) {
    return "infra";
  }
  if (
    has(
      /claude-code|openai\/codex|kilocode|carboncode|code-graph|coding.?agent|aider|mimo-code|code-graph-rag|\badhd\b|happy.*codex|coding agent cli/,
    )
  ) {
    return "coding";
  }
  if (
    has(
      /openclaw|autogpt|agent-skills|n8n|dify|superpowers|paperclip|auto-company|agency-agents|\bmcp\b|agentic.?workflow|personal ai assistant/,
    ) ||
    topics.some((t) => ["agent-skills", "ai-agents", "mcp", "n8n"].includes(t))
  ) {
    return "agent-office";
  }
  if (has(/claude|codex|cursor|skills/) && has(/code|coding|engineer|cli/)) return "coding";
  const lang = input.language || "";
  if (["TypeScript", "JavaScript", "Python", "Rust", "Go", "Shell"].includes(lang)) return "coding";
  return "other";
}

export function githubCategoryRank(cat: string): number {
  const i = GITHUB_CATEGORY_ORDER.indexOf(cat as GithubCategory);
  return i < 0 ? GITHUB_CATEGORY_ORDER.length : i;
}

export function formatStarHeat(n: number, locale: "zh" | "en" = "zh"): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (locale === "en") {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
    return String(n);
  }
  if (n >= 10_000) {
    const wan = n / 10_000;
    const s = wan >= 100 ? wan.toFixed(0) : wan.toFixed(1).replace(/\.0$/, "");
    return `${s} 万`;
  }
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
