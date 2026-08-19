import type { GithubCategory } from "./github-types";

/** Product Hunt App → 本项目场景分类（按标题 / 简介关键词） */
export function classifyProductHunt(title: string, tagline: string): GithubCategory {
  const blob = `${title} ${tagline}`.toLowerCase();
  const has = (re: RegExp) => re.test(blob);

  if (has(/\b(ai|llm|gpt|claude|gemini|agents?|copilot|assistant|neural|model|智能|代理)\b|ai[- ]?native|agentic/i)) {
    if (has(/code|dev|cli|terminal|browser test|code review|programming|developer|sdk|api|devops|repo|debug/)) return "coding";
    if (has(/analytics|research|search|monitor|observability|data|tracking|crawl|scrape/)) return "intel";
    if (has(/video|image|design|illustrat|photo|camera|music|write|doc|markdown|content|transcod/)) return "content";
    if (has(/meeting|office|workflow|productivity|automation|task|assistant/)) return "agent-office";
    if (has(/learn|course|education|tutorial|explain|teach|quiz/)) return "learn";
    if (has(/market|growth|seo|sales|launch|customer|community|lead/)) return "growth";
    if (has(/security|infra|host|network|cloud|vpn|starlink|monitor/)) return "intel";
    return "agent-office";
  }

  if (has(/code|dev|cli|terminal|browser test|code review|programming|developer|sdk|api|devops|repo|debug|deploy|git/)) return "coding";
  if (has(/video|image|design|illustrat|photo|camera|music|write|doc|markdown|content|transcod|figma|illustration/)) return "content";
  if (has(/analytics|research|search|monitor|observability|data|tracking|crawl|scrape|dashboard|metric/)) return "intel";
  if (has(/meeting|office|workflow|productivity|automation|task|assistant|schedule|calendar/)) return "agent-office";
  if (has(/learn|course|education|tutorial|explain|teach|quiz|class/)) return "learn";
  if (has(/market|growth|seo|sales|launch|customer|community|lead|email|ads/)) return "growth";
  if (has(/security|infra|host|network|cloud|vpn|server|storage/)) return "infra";
  if (has(/token|prompt|llm|inference|fine-tun|model/)) return "coding";
  return "other";
}
