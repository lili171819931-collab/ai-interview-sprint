import {
  analyze_topic,
  compare_period,
  compare_platforms,
  compare_regions,
  generate_report,
  get_event,
  get_fastest_rising,
  get_trending_topics,
  search_news,
  type AgentToolResult,
} from "@/lib/intel/agent-tools";
import { getEventsView } from "@/lib/intel/events-data";

export type AgentAnswer = {
  ok: boolean;
  question: string;
  intent: string;
  answer: string;
  bullets: string[];
  toolsUsed: AgentToolResult[];
  sources: { title: string; url: string; platform: string; eventId?: string }[];
  generatedAt: string;
  mode: "tools" | "tools+llm";
};

type Intent =
  | "trending_all"
  | "trending_ai"
  | "search"
  | "compare_regions"
  | "compare_platforms"
  | "rising"
  | "report_ai"
  | "report_daily"
  | "analyze"
  | "period"
  | "event";

export function detectIntent(q: string): { intent: Intent; query: string } {
  const s = q.trim();
  const lower = s.toLowerCase();

  if (/事件\s*[#:]?\s*([a-f0-9]{8,})/i.test(s) || /^[a-f0-9]{12,}$/i.test(s)) {
    const m = s.match(/([a-f0-9]{8,})/i);
    return { intent: "event", query: m?.[1] || s };
  }
  if (/中国|国内/.test(s) && /美国|海外|全球/.test(s) && /对比|比较|差异/.test(s)) {
    return { intent: "compare_regions", query: s };
  }
  if (/平台/.test(s) && /对比|比较|分布/.test(s)) return { intent: "compare_platforms", query: s };
  if (/7\s*天|一周|过去一周|环比|同比|变化/.test(s)) return { intent: "period", query: s };
  if (/增长最快|涨得最快|velocity|爆发/.test(s)) return { intent: "rising", query: s };
  if (/简报|日报|发生了什么/.test(s) && /AI|人工智能|大模型|Agent/.test(s)) {
    return { intent: "report_ai", query: s };
  }
  if (/简报|日报|今天全球|今日热点|发生了什么/.test(s)) return { intent: "report_daily", query: s };
  if (/AI|Agent|大模型|芯片|机器人|创业/.test(s) && /热点|趋势|关注/.test(s)) {
    return { intent: "trending_ai", query: s };
  }
  if (/分析|怎么看|影响|机会/.test(s)) {
    const topic = s.replace(/请|帮我|分析一下|分析|怎么看|？|\?/g, " ").trim() || s;
    return { intent: "analyze", query: topic };
  }
  if (/搜索|找找|有没有|关于/.test(s) || s.length <= 24) {
    const topic = s.replace(/请|帮我|搜索|找找|有没有|关于|？|\?/g, " ").trim() || s;
    return { intent: "search", query: topic };
  }
  return { intent: "trending_all", query: s };
}

type EventLike = {
  id: string;
  title?: string;
  sources?: { title: string; url: string; platform: string }[];
};

function asEventList(v: unknown): EventLike[] {
  if (Array.isArray(v)) return v as EventLike[];
  if (v && typeof v === "object" && "id" in (v as object)) return [v as EventLike];
  return [];
}

function collectSources(tools: AgentToolResult[]) {
  const out: AgentAnswer["sources"] = [];
  const seen = new Set<string>();
  for (const t of tools) {
    const data = t.data as Record<string, unknown>;
    const events = [
      ...asEventList(data.events),
      ...asEventList(data.related),
      ...asEventList(data.top),
      ...asEventList(data.rising),
      ...asEventList(data.todayRising),
      ...asEventList(data.cnOnly),
      ...asEventList(data.overseasOnly),
      ...asEventList(data.both),
      ...asEventList(data.crossPlatformEvents),
    ];
    for (const e of events) {
      for (const s of e.sources || []) {
        if (!s.url || seen.has(s.url)) continue;
        seen.add(s.url);
        out.push({ ...s, eventId: e.id });
      }
    }
  }
  return out.slice(0, 12);
}

function bulletsFromEvents(
  events: { title: string; heat_score: number; trend_status: string; one_liner?: string; platforms?: string[] }[],
  n = 5,
): string[] {
  return events.slice(0, n).map((e, i) => {
    const plat = e.platforms?.length ? ` · ${e.platforms.slice(0, 3).join("/")}` : "";
    return `${i + 1}. [${e.trend_status}/${e.heat_score}] ${e.one_liner || e.title}${plat}`;
  });
}

function runTools(intent: Intent, query: string): AgentToolResult[] {
  switch (intent) {
    case "trending_all":
      return [get_trending_topics(10, "all"), generate_report("daily")];
    case "trending_ai":
      return [get_trending_topics(8, "ai"), get_fastest_rising(5, "ai")];
    case "search":
      return [search_news(query, 10)];
    case "compare_regions":
      return [compare_regions(), get_trending_topics(5, "ai")];
    case "compare_platforms":
      return [compare_platforms()];
    case "rising":
      return [get_fastest_rising(/AI|人工智能/.test(query) ? 10 : 10, /AI|人工智能/.test(query) ? "ai" : "all")];
    case "report_ai":
      return [generate_report("ai"), get_fastest_rising(5, "ai")];
    case "report_daily":
      return [generate_report("daily"), get_fastest_rising(5, "all")];
    case "analyze":
      return [analyze_topic(query)];
    case "period":
      return [compare_period(), get_fastest_rising(8, "all")];
    case "event":
      return [get_event(query)];
    default:
      return [get_trending_topics(10, "all")];
  }
}

function synthesize(intent: Intent, question: string, tools: AgentToolResult[]): Omit<AgentAnswer, "generatedAt" | "mode"> {
  const snap = getEventsView().snapshot;
  const meta = `数据快照：${snap.generatedAt || "无"} · 事件 ${snap.eventCount}`;

  if (intent === "event") {
    const t = tools[0];
    const e = t.data as { title?: string; one_liner?: string; why?: string; impact?: string; error?: string };
    if (!t.ok) {
      return {
        ok: false,
        question,
        intent,
        answer: `未找到事件 ${querySafe(question)}。`,
        bullets: [],
        toolsUsed: tools,
        sources: [],
      };
    }
    return {
      ok: true,
      question,
      intent,
      answer: `${e.one_liner || e.title}\n\n${e.why || ""}\n${e.impact || ""}\n\n${meta}`,
      bullets: [e.one_liner || e.title || ""].filter(Boolean),
      toolsUsed: tools,
      sources: collectSources(tools),
    };
  }

  if (intent === "compare_regions") {
    const d = tools[0].data as {
      counts: { cnOnly: number; overseasOnly: number; both: number };
      cnOnly: { title: string; heat_score: number; trend_status: string; one_liner?: string }[];
      overseasOnly: { title: string; heat_score: number; trend_status: string; one_liner?: string }[];
    };
    return {
      ok: true,
      question,
      intent,
      answer: `中国/海外热点对比（今日聚类结果）：仅国内 ${d.counts.cnOnly} · 仅海外 ${d.counts.overseasOnly} · 双边 ${d.counts.both}。\n${meta}`,
      bullets: [
        `国内代表：${d.cnOnly[0]?.title || "—"}`,
        `海外代表：${d.overseasOnly[0]?.title || "—"}`,
        ...bulletsFromEvents(d.cnOnly.slice(0, 3), 3).map((b) => `CN ${b}`),
        ...bulletsFromEvents(d.overseasOnly.slice(0, 3), 3).map((b) => `US ${b}`),
      ],
      toolsUsed: tools,
      sources: collectSources(tools),
    };
  }

  if (intent === "analyze") {
    const d = tools[0].data as {
      topic: string;
      matched: number;
      top: { title: string; one_liner?: string; why?: string; impact?: string } | null;
      note: string;
    };
    return {
      ok: true,
      question,
      intent,
      answer: d.top
        ? `关于「${d.topic}」：${d.top.one_liner || d.top.title}\n为什么重要：${d.top.why || "见事件详情"}\n影响：${d.top.impact || "—"}\n${d.note}\n${meta}`
        : `${d.note}\n${meta}`,
      bullets: bulletsFromEvents(
        ((tools[0].data as { related?: { title: string; heat_score: number; trend_status: string; one_liner?: string }[] })
          .related || []) as { title: string; heat_score: number; trend_status: string; one_liner?: string }[],
        5,
      ),
      toolsUsed: tools,
      sources: collectSources(tools),
    };
  }

  // default: trending / report / rising / search
  type Ev = { title: string; heat_score: number; trend_status: string; one_liner?: string; platforms?: string[] };
  const primary = tools[0]?.data as {
    events?: Ev[];
    top?: Ev[];
    rising?: Ev[];
    statusCounts?: Record<string, number>;
  };
  const secondary = tools[1]?.data as { events?: Ev[] } | undefined;
  const events: Ev[] =
    primary?.events ||
    [
      ...(primary?.top || []),
      ...(primary?.rising || []),
      ...(secondary?.events || []),
    ].filter((e, i, arr) => arr.findIndex((x) => x.title === e.title) === i);
  const statusNote = primary?.statusCounts
    ? `状态分布：${Object.entries(primary.statusCounts)
        .map(([k, v]) => `${k} ${v}`)
        .join(" · ")}。`
    : "";
  const lead =
    intent === "rising"
      ? "过去快照窗口内 velocity 较高的事件（无完整历史时序时的近似）："
      : intent === "trending_ai" || intent === "report_ai"
        ? "今日 AI/科技相关热点："
        : intent === "search"
          ? `与「${question}」相关的事件：`
          : "今日全球热点（已聚类）：";

  return {
    ok: true,
    question,
    intent,
    answer: `${lead}\n共命中 ${events.length} 条。${statusNote}${meta}\n结论均绑定下方 Sources 中的真实链接。`,
    bullets: bulletsFromEvents(events, 8),
    toolsUsed: tools,
    sources: collectSources(tools),
  };
}

function querySafe(s: string) {
  return s.slice(0, 80);
}

export async function answerQuestion(question: string): Promise<AgentAnswer> {
  const q = question.trim();
  if (!q) {
    return {
      ok: false,
      question,
      intent: "empty",
      answer: "请输入问题。",
      bullets: [],
      toolsUsed: [],
      sources: [],
      generatedAt: new Date().toISOString(),
      mode: "tools",
    };
  }

  const { intent, query } = detectIntent(q);
  const toolsUsed = runTools(intent, query);
  const base = synthesize(intent, q, toolsUsed);

  // Optional LLM polish — never replace sources
  const endpoint = process.env.INTEL_LLM_URL?.trim();
  const apiKey = process.env.INTEL_LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (endpoint && apiKey) {
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
                "你是趋势情报助手。只用工具结果回答，禁止编造链接。输出简洁中文段落+要点。",
            },
            {
              role: "user",
              content: JSON.stringify({ question: q, intent, toolResults: toolsUsed, draft: base }),
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          return {
            ...base,
            answer: content,
            sources: base.sources,
            generatedAt: new Date().toISOString(),
            mode: "tools+llm",
          };
        }
      }
    } catch {
      // fall through
    }
  }

  return {
    ...base,
    generatedAt: new Date().toISOString(),
    mode: "tools",
  };
}
