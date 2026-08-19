export type TextScript = "zh" | "en" | "und";

export function detectScript(text: string): TextScript {
  const s = text.replace(/\s+/g, " ").trim();
  if (!s) return "und";
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  if (cjk >= 2 && cjk * 2 >= latin) return "zh";
  if (latin >= 4 && cjk === 0) return "en";
  if (cjk >= 2) return "zh";
  if (latin >= 4) return "en";
  return "und";
}

export function needsTranslation(text: string, locale: "zh" | "en"): boolean {
  const script = detectScript(text);
  if (script === "und") return false;
  if (locale === "zh") return script === "en";
  return script === "zh";
}
