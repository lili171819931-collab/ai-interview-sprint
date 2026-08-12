import type { EventAnalysis, IntelEvent, IntelItem, TrendStatus } from "./types";

export type { EventAnalysis };

const ORG_PATTERNS: { re: RegExp; name: string }[] = [
  { re: /OpenAI|ChatGPT|GPT-?\d/i, name: "OpenAI" },
  { re: /Anthropic|Claude/i, name: "Anthropic" },
  { re: /Google|Gemini|DeepMind/i, name: "Google" },
  { re: /Meta\b|Llama/i, name: "Meta" },
  { re: /Microsoft|GitHub|Copilot/i, name: "Microsoft" },
  { re: /Apple|WWDC/i, name: "Apple" },
  { re: /NVIDIA|英伟达|黄仁勋/i, name: "NVIDIA" },
  { re: /Tesla|特斯拉|马斯克/i, name: "Tesla" },
  { re: /字节|抖音|TikTok/i, name: "ByteDance" },
  { re: /华为|昇腾|盘古/i, name: "Huawei" },
  { re: /MiniMax|H3/i, name: "MiniMax" },
  { re: /百度|文心/i, name: "Baidu" },
  { re: /阿里|通义/i, name: "Alibaba" },
  { re: /腾讯/i, name: "Tencent" },
  { re: /美联储|Fed\b/i, name: "Federal Reserve" },
];

function extractWho(title: string, platforms: string[]): string[] {
  const found: string[] = [];
  for (const p of ORG_PATTERNS) {
    if (p.re.test(title) && !found.includes(p.name)) found.push(p.name);
  }
  for (const plat of platforms.slice(0, 4)) {
    if (!found.includes(plat)) found.push(`平台:${plat}`);
  }
  return found.slice(0, 8);
}

function trendCopy(status: TrendStatus, velocity: number): string {
  switch (status) {
    case "emerging":
      return "当前热度仍有限，但增速较快，未来 24–72 小时值得盯盘，确认是否从社区扩散到主流媒体。";
    case "rising":
      return `热度仍在抬升（velocity≈${velocity}）。若权威媒体跟进，可能在 1–2 天内进入「hot」。`;
    case "hot":
      return "已跨平台发酵。短期仍会占据议程；关注是否出现辟谣、政策回应或二次爆点。";
    case "stable":
      return "热度平台期。适合做结构化跟踪（时间线/影响面），而非追热点情绪。";
    case "cooling":
      return "热度回落中。除非出现新变量，否则优先级可下调。";
    case "fading":
      return "热度明显衰减，可归档观察，避免占用决策带宽。";
  }
}

function whyCopy(event: IntelEvent): string {
  const bits: string[] = [];
  if (event.platform_count >= 2) bits.push(`已覆盖 ${event.platform_count} 个平台`);
  if (event.countries.length >= 2) bits.push("同时出现在国内与海外信源");
  if (event.heat_score >= 40) bits.push(`综合热度 ${event.heat_score}`);
  if (event.user_relevance >= 0.55) bits.push("与你配置的关注领域匹配度较高");
  if (event.categories.includes("ai") || /AI|大模型|Agent|芯片|机器人/i.test(event.representative_title)) {
    bits.push("触及 AI/科技主线，可能影响产品与投资判断");
  }
  if (!bits.length) bits.push("处于公开议程中，需结合来源判断可信度");
  return bits.join("；") + "。";
}

function impactCopy(event: IntelEvent): string {
  const t = event.representative_title;
  if (/AI|大模型|Agent|芯片|算力|机器人/i.test(t)) {
    return "可能影响 AI 产品路线、模型选型、算力成本预期，以及相关创业叙事。建议对照权威源与官方公告再行动。";
  }
  if (/股|市|美联储|原油|黄金|回购/i.test(t)) {
    return "偏宏观/市场情绪事件；对科技股与风险偏好有传导，不宜仅凭热搜做交易决策。";
  }
  if (/台风|地震|救援|事故/i.test(t)) {
    return "公共安全/民生类事件：优先核实官方通报；对供应链与出行可能有短期扰动。";
  }
  return "影响面取决于后续权威报道与政策/企业回应；当前以跟踪与交叉验证为主。";
}

/** Grounded heuristic analysis — sources ONLY from related sample_items with real URLs. */
export function analyzeEventHeuristic(
  event: IntelEvent,
  itemById?: Map<string, IntelItem>,
): EventAnalysis {
  const sources = event.sample_items
    .filter((s) => Boolean(s.url?.trim()))
    .map((s) => ({ title: s.title, url: s.url, platform: s.platform }))
    .slice(0, 8);

  // Enrich who from full titles if map provided
  const titleBlob = [
    event.representative_title,
    ...event.sample_items.map((s) => s.title),
    ...(itemById
      ? event.related_items.map((id) => itemById.get(id)?.title || "").filter(Boolean)
      : []),
  ].join(" · ");

  const who = extractWho(titleBlob, event.platforms);
  const region =
    event.countries.includes("CN") && event.countries.includes("US")
      ? "国内与海外同步讨论"
      : event.countries.includes("CN")
        ? "以国内平台为主"
        : event.countries.includes("US")
          ? "以海外信源为主"
          : "区域分布待补全";

  const one_liner = `${event.representative_title}（${region}，热度 ${event.heat_score}，状态 ${event.trend_status}）`;

  const what = [
    `公开议程出现「${event.representative_title}」。`,
    `相关条目 ${event.source_count} 条，覆盖平台：${event.platforms.join("、") || "未知"}。`,
    sources.length
      ? `可核验来源 ${sources.length} 条（见 Sources，均为抓取得到的真实链接）。`
      : "当前样本缺少可点击 URL，请回到原始热点页核对。",
  ].join("");

  // Confidence: more platforms + real urls + not single low-rank noise
  let confidence = 0.42;
  confidence += Math.min(0.2, (event.platform_count - 1) * 0.07);
  confidence += sources.length ? 0.12 : -0.08;
  confidence += event.heat_score >= 35 ? 0.08 : 0;
  confidence += event.score_breakdown.sourceAuthority * 0.15;
  confidence = Math.max(0.2, Math.min(0.78, confidence));

  return {
    one_liner,
    what,
    why: whyCopy(event),
    who,
    impact: impactCopy(event),
    trend: trendCopy(event.trend_status, event.velocity),
    confidence: Math.round(confidence * 100) / 100,
    analysisMode: "heuristic",
    sources,
  };
}

export async function analyzeEvent(
  event: IntelEvent,
  itemById?: Map<string, IntelItem>,
): Promise<EventAnalysis> {
  // Optional LLM hook — only if explicitly configured; always ground sources from samples.
  const base = analyzeEventHeuristic(event, itemById);
  const endpoint = process.env.INTEL_LLM_URL?.trim();
  const apiKey = process.env.INTEL_LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!endpoint || !apiKey) return base;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.INTEL_LLM_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "你是热点情报分析师。只根据给定事件与来源写作。禁止编造 URL。输出 JSON：one_liner,what,why,who(array),impact,trend,confidence(0-1)。",
          },
          {
            role: "user",
            content: JSON.stringify({
              event: {
                title: event.representative_title,
                platforms: event.platforms,
                countries: event.countries,
                heat_score: event.heat_score,
                trend_status: event.trend_status,
                sources: base.sources,
              },
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return base;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return base;
    const parsed = JSON.parse(content) as Partial<EventAnalysis>;
    return {
      one_liner: String(parsed.one_liner || base.one_liner),
      what: String(parsed.what || base.what),
      why: String(parsed.why || base.why),
      who: Array.isArray(parsed.who) ? parsed.who.map(String) : base.who,
      impact: String(parsed.impact || base.impact),
      trend: String(parsed.trend || base.trend),
      confidence: Math.max(0.2, Math.min(0.95, Number(parsed.confidence ?? base.confidence))),
      analysisMode: "llm",
      sources: base.sources, // never trust model for URLs
    };
  } catch {
    return base;
  }
}
