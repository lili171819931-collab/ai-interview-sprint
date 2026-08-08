export const SCENARIO_MODES = [
  { code: "A", name: "单票速报", must: true },
  { code: "B", name: "批量月结", must: true },
  { code: "C", name: "差旅全包", must: true },
  { code: "D", name: "招待审查", must: true },
  { code: "E", name: "专票进项", must: false },
  { code: "F", name: "驳回重提", must: true },
  { code: "G", name: "审计抽查", must: false },
  { code: "H", name: "制度测算", must: false },
  { code: "I", name: "境外多币种", must: false },
  { code: "J", name: "垫付清算", must: false },
] as const;

export type ScenarioMode = (typeof SCENARIO_MODES)[number]["code"];

export function modeLabel(code: string): string {
  return SCENARIO_MODES.find((m) => m.code === code)?.name ?? code;
}
