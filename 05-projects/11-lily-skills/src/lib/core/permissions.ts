import type { Json, RiskLevel, SkillRow } from "./types";
import { parseJson } from "./types";

/**
 * Permission & risk policy.
 *
 * Risk levels map to approval requirements:
 *   low      → auto-execute
 *   medium   → auto-execute, unless the skill touches sensitive capabilities
 *   high     → human approval required
 *   critical → human approval required (destructive / irreversible)
 */
export const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

const SENSITIVE_CAPABILITIES = new Set(["social_media", "email", "payment", "database", "write"]);

export function requiresApproval(skill: SkillRow): boolean {
  if (skill.risk_level === "critical" || skill.risk_level === "high") return true;
  if (skill.risk_level === "medium") {
    const perms = parseJson<string[]>(skill.permissions, []);
    if (perms.some((p) => SENSITIVE_CAPABILITIES.has(p))) return true;
  }
  return false;
}

/** Effective permission set implied by the execution type. */
export function impliedPermissions(skill: SkillRow): string[] {
  switch (skill.execution_type) {
    case "http":
    case "api":
      return ["external_api", "network"];
    case "cli":
      return ["write", "file"];
    case "local":
      return ["read", "file"];
    case "composite":
      return ["read", "external_api"];
    default:
      return ["read"];
  }
}

/** Combine declared + implied permissions, deduped. */
export function effectivePermissions(skill: SkillRow): string[] {
  const declared = parseJson<string[]>(skill.permissions, []);
  return [...new Set([...declared, ...impliedPermissions(skill)])];
}

export function permissionLabel(permission: string): string {
  const labels: Record<string, string> = {
    read: "读取",
    write: "写入",
    external_api: "外部 API",
    file: "文件系统",
    browser: "浏览器",
    social_media: "社交媒体",
    email: "邮件",
    database: "数据库",
    payment: "支付",
    network: "网络",
  };
  return labels[permission] ?? permission;
}

export function riskLabel(risk: RiskLevel): string {
  return { low: "低风险", medium: "中风险", high: "高风险", critical: "严重风险" }[risk] ?? risk;
}
