import type { Json, SkillRow, ExecutionContext } from "../types";

/**
 * HTTP / API adapter — POSTs the input as JSON to the skill endpoint.
 * Blocked when AGENT_OFFLINE_ONLY=true.
 */
export async function executeHttpSkill(skill: SkillRow, input: Json, ctx: ExecutionContext): Promise<Json> {
  const endpoint = skill.endpoint;
  if (!endpoint) throw new Error(`Skill "${skill.name}" has no endpoint configured`);
  if (process.env.AGENT_OFFLINE_ONLY === "true") {
    throw new Error("Network execution is disabled (AGENT_OFFLINE_ONLY=true)");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${endpoint}: ${(await res.text()).slice(0, 500)}`);
    }
    const text = await res.text();
    try {
      return JSON.parse(text) as Json;
    } catch {
      return { status: res.status, body: text };
    }
  } finally {
    clearTimeout(timer);
  }
}
