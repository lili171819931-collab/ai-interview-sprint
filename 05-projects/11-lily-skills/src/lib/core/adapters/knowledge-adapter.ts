import type { Json, SkillRow, ExecutionContext } from "../types";

/**
 * Knowledge adapter — for imported Agent Skills / instruction documents.
 * Execution returns the skill's source reference + purpose, so the Agent can
 * retrieve and apply the instructions rather than run a binary.
 */
export async function executeKnowledgeSkill(skill: SkillRow, _input: Json, _ctx: ExecutionContext): Promise<Json> {
  return {
    skill: skill.name,
    kind: "knowledge",
    description: skill.description,
    ai_description: skill.ai_description ?? skill.description,
    source_path: skill.source_path ?? null,
    note: "这是一个说明文档型 Skill（Agent Skill），执行即返回其能力说明与来源，供 Agent 阅读并应用。",
  };
}
