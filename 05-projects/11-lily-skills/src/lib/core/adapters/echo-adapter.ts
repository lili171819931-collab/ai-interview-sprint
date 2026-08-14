import type { Json, SkillRow, ExecutionContext } from "../types";

/** Echo adapter — returns the input verbatim. Used for demo/testing skills. */
export async function executeEchoSkill(skill: SkillRow, input: Json, _ctx: ExecutionContext): Promise<Json> {
  return {
    echoed: input,
    skill: skill.name,
    at: new Date().toISOString(),
  };
}
