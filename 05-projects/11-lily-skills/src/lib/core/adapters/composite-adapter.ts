import type { Json, SkillRow, ExecutionContext } from "../types";
import { parseJson } from "../types";

/**
 * Composite adapter — runs an ordered list of sub-skills, feeding each step's
 * output into the next. Steps are declared in the skill manifest `config.steps`:
 *   [{ "skill_id": "skill_xxx", "input_map": { "query": "{{input.query}}" } }]
 */
export async function executeCompositeSkill(
  skill: SkillRow,
  input: Json,
  ctx: ExecutionContext,
  runSubSkill: (skillId: string, stepInput: Json, trigger: string) => Promise<Json>,
): Promise<Json> {
  const config = parseJson<{ steps?: { skill_id: string; input_map?: Record<string, string> }[] }>(skill.config, {});
  const steps = config.steps ?? [];
  if (steps.length === 0) throw new Error(`Composite skill "${skill.name}" declares no steps in config`);

  const outputs: Json[] = [];
  let current = input;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepInput: Json = {};
    for (const [outKey, mapExpr] of Object.entries(step.input_map ?? {})) {
      stepInput[outKey] = resolveMapExpr(mapExpr, input, outputs, current);
    }
    ctx.log("info", `composite step ${i + 1}/${steps.length}: ${step.skill_id}`);
    const result = await runSubSkill(step.skill_id, stepInput, "composite");
    outputs.push(result);
    current = result;
  }
  return { steps: outputs, final: current };
}

function resolveMapExpr(expr: string, original: Json, outputs: Json[], current: Json): unknown {
  if (expr.startsWith("{{input.")) {
    const key = expr.slice(8, -2);
    return key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], original);
  }
  if (expr.startsWith("{{prev.")) {
    const key = expr.slice(7, -2);
    return key.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], current);
  }
  if (expr.startsWith("{{step")) {
    const m = /^\{\{step(\d+)\.(.*)\}\}$/.exec(expr);
    if (m) {
      const idx = Number(m[1]);
      const rest = m[2];
      return rest
        .split(".")
        .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], outputs[idx]);
    }
  }
  return expr;
}
