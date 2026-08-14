export async function execute(input: Record<string, any>, ctx: any) {
  const text = String(input.text ?? "");
  const op = String(input.operation ?? "trim");
  switch (op) {
    case "uppercase": return { text: text.toUpperCase(), operation: op };
    case "lowercase": return { text: text.toLowerCase(), operation: op };
    case "dedupe_lines":
      return { text: [...new Set(text.split("\n").map((l) => l.trim()).filter(Boolean))].join("\n"), operation: op };
    case "word_count":
      return { chars: text.length, words: text.trim().split(/\s+/).filter(Boolean).length, lines: text.split("\n").length, operation: op };
    default:
      return { text: text.trim(), operation: "trim" };
  }
}
