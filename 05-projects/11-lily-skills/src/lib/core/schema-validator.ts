import type { Json } from "./types";

export interface SchemaProperty {
  type?: "string" | "number" | "boolean" | "array" | "object" | "any";
  description?: string;
  required?: boolean;
  enum?: unknown[];
  min?: number;
  max?: number;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
}

export interface JsonSchema {
  type?: "object";
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Lightweight JSON-schema validator used to validate skill inputs/outputs.
 * Supports the subset of JSON Schema used by Skill Manifests.
 */
export function validateInput(input: unknown, schema: JsonSchema | undefined): { ok: true } | { ok: false; errors: string[] } {
  if (!schema || !schema.properties) return { ok: true };
  const errors: string[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["input must be an object"] };
  }
  const obj = input as Record<string, unknown>;
  for (const key of schema.required ?? []) {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") {
      errors.push(`缺少必填参数: ${key}`);
    }
  }
  for (const [key, prop] of Object.entries(schema.properties)) {
    const val = obj[key];
    if (val === undefined || val === null) continue;
    const err = checkValue(key, val, prop);
    if (err) errors.push(err);
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

function checkValue(key: string, val: unknown, prop: SchemaProperty): string | null {
  const t = prop.type ?? "any";
  if (t === "any") return null;
  if (t === "array" && !Array.isArray(val)) return `${key} 必须是数组`;
  if (t === "object" && (typeof val !== "object" || val === null || Array.isArray(val))) return `${key} 必须是对象`;
  if (t === "string" && typeof val !== "string") return `${key} 必须是字符串`;
  if (t === "number" && typeof val !== "number") return `${key} 必须是数字`;
  if (t === "boolean" && typeof val !== "boolean") return `${key} 必须是布尔值`;
  if (prop.enum && !prop.enum.includes(val)) return `${key} 必须是 ${prop.enum.join(" / ")} 之一`;
  if (typeof val === "number") {
    if (prop.min !== undefined && val < prop.min) return `${key} 不能小于 ${prop.min}`;
    if (prop.max !== undefined && val > prop.max) return `${key} 不能大于 ${prop.max}`;
  }
  if (typeof val === "string") {
    if (prop.min !== undefined && val.length < prop.min) return `${key} 长度不能小于 ${prop.min}`;
    if (prop.max !== undefined && val.length > prop.max) return `${key} 长度不能大于 ${prop.max}`;
  }
  if (Array.isArray(val) && prop.items) {
    for (const item of val) {
      const err = checkValue(`${key}[]`, item, prop.items);
      if (err) return err;
    }
  }
  return null;
}
