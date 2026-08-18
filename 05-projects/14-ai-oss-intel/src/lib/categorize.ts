/**
 * Best-effort category guessing for repos not in the local snapshot.
 * Used by My GitHub grouped view, category boards, and the add-project flow
 * so that added/starred repos can be linked into the platform taxonomy.
 */
import type { CategoryId } from "@/lib/types";

export function guessCategoryFromRepo(input: {
  name: string;
  description?: string | null;
  topics?: string[];
  language?: string | null;
}): CategoryId | "other" {
  const hay = `${input.name} ${input.description ?? ""} ${(input.topics ?? []).join(" ")} ${input.language ?? ""}`.toLowerCase();
  const rules: [RegExp, CategoryId][] = [
    [/agent|autogen|crew|langgraph|smolagents|browser-use|orchestrat/i, "agent"],
    [/mcp|model-context/i, "mcp"],
    [/llm|gpt|transformer|ollama|inference|finetun|model/i, "llm"],
    [/rag|retriev|knowledge|qa|vector|embedding|chroma|qdrant|search/i, "rag"],
    [/code|coding|ide|editor|compiler|language-model/i, "coding"],
    [/video|ffmpeg|text-to-video|sora|generation/i, "video"],
    [/image|diffusion|stable-diffusion|photo|segment|vision|cv|detect|design/i, "image"],
    [/audio|speech|tts|voice|asr|music|sound/i, "audio"],
    [/db|database|sql|duckdb|warehouse|analytics|data/i, "data"],
    [/saas|billing|subscription|serverless|payment|commerce|shop/i, "saas"],
    [/automation|workflow|rpa|zapier/i, "automation"],
    [/chat|ui|web|app|assistant|desktop|notebook|productivity/i, "productivity"],
    [/skill|prompt|claude-code/i, "skill"],
    [/content|writing|blog|marketing|social/i, "content"],
  ];
  for (const [re, cat] of rules) if (re.test(hay)) return cat;
  return "other";
}
