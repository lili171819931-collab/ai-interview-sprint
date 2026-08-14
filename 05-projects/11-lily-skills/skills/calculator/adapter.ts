export async function execute(input: Record<string, any>, ctx: any) {
  const expr = String(input.expression ?? "").replace(/\s+/g, "");
  if (!/^[0-9+\-*/().^%]+$/.test(expr)) throw new Error("表达式包含非法字符");
  const safe = expr.replace(/\^/g, "**");
  // eslint-disable-next-line no-new-func
  const result = new Function(`"use strict"; return (${safe});`)();
  if (typeof result !== "number" || !isFinite(result)) throw new Error("无法计算该表达式");
  return { expression: input.expression, result: Math.round(result * 1e6) / 1e6 };
}
