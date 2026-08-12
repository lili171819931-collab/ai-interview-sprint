import { getEventById, getEventsByStatus, getEventsView, getTopEvents } from "@/lib/intel/events-data";
import type { IntelEvent, TrendStatus } from "@/lib/intel/types";

export type AgentSource = { title: string; url: string; platform: string; eventId: string };

export type AgentToolResult = {
  tool: string;
  ok: boolean;
  data: unknown;
};

function summarizeEvent(e: IntelEvent) {
  return {
    id: e.id,
    title: e.representative_title,
    heat_score: e.heat_score,
    velocity: e.velocity,
    trend_status: e.trend_status,
    platforms: e.platforms,
    countries: e.countries,
    categories: e.categories,
    one_liner: e.analysis?.one_liner || e.representative_title,
    why: e.analysis?.why,
    impact: e.analysis?.impact,
    confidence: e.analysis?.confidence,
    sources: (e.analysis?.sources || e.sample_items.filter((s) => s.url)).slice(0, 5),
  };
}

function isAiRelated(e: IntelEvent): boolean {
  const blob = `${e.representative_title} ${e.categories.join(" ")} ${(e.analysis?.who || []).join(" ")}`;
  return (
    e.categories.includes("ai") ||
    e.categories.includes("tech") ||
    /AI|Agent|大模型|LLM|GPT|Claude|芯片|机器人|OpenAI|Anthropic|NVIDIA|算力/i.test(blob)
  );
}

export function search_news(query: string, limit = 10): AgentToolResult {
  const q = query.trim().toLowerCase();
  const { snapshot } = getEventsView();
  const hits = snapshot.events
    .filter((e) => {
      const blob = `${e.representative_title} ${e.platforms.join(" ")} ${e.analysis?.one_liner || ""}`.toLowerCase();
      return !q || blob.includes(q) || q.split(/\s+/).some((t) => t && blob.includes(t));
    })
    .slice(0, limit)
    .map(summarizeEvent);
  return { tool: "search_news", ok: true, data: { query, count: hits.length, events: hits } };
}

export function get_trending_topics(limit = 10, filter?: "ai" | "all"): AgentToolResult {
  const { snapshot } = getEventsView();
  let events =
    filter === "ai"
      ? [...snapshot.events].filter(isAiRelated).sort((a, b) => b.heat_score - a.heat_score)
      : getTopEvents(limit);
  events = events.slice(0, limit);
  return {
    tool: "get_trending_topics",
    ok: true,
    data: { filter: filter || "all", count: events.length, events: events.map(summarizeEvent) },
  };
}

export function get_event(id: string): AgentToolResult {
  const e = getEventById(id);
  if (!e) return { tool: "get_event", ok: false, data: { error: "not_found", id } };
  return { tool: "get_event", ok: true, data: summarizeEvent(e) };
}

export function compare_regions(): AgentToolResult {
  const { snapshot } = getEventsView();
  const cn = snapshot.events.filter((e) => e.countries.includes("CN") && !e.countries.includes("US"));
  const us = snapshot.events.filter((e) => e.countries.includes("US") && !e.countries.includes("CN"));
  const both = snapshot.events.filter((e) => e.countries.includes("CN") && e.countries.includes("US"));
  return {
    tool: "compare_regions",
    ok: true,
    data: {
      cnOnly: cn.slice(0, 8).map(summarizeEvent),
      overseasOnly: us.slice(0, 8).map(summarizeEvent),
      both: both.slice(0, 8).map(summarizeEvent),
      counts: { cnOnly: cn.length, overseasOnly: us.length, both: both.length },
    },
  };
}

export function compare_platforms(): AgentToolResult {
  const { snapshot } = getEventsView();
  const map = new Map<string, number>();
  for (const e of snapshot.events) {
    for (const p of e.platforms) map.set(p, (map.get(p) || 0) + 1);
  }
  const ranking = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const cross = snapshot.events
    .filter((e) => e.platform_count >= 2)
    .slice(0, 10)
    .map(summarizeEvent);
  return { tool: "compare_platforms", ok: true, data: { platformCounts: ranking, crossPlatformEvents: cross } };
}

export function analyze_topic(topic: string): AgentToolResult {
  const found = search_news(topic, 8);
  const events = (found.data as { events: ReturnType<typeof summarizeEvent>[] }).events;
  return {
    tool: "analyze_topic",
    ok: true,
    data: {
      topic,
      matched: events.length,
      top: events[0] || null,
      related: events,
      note: events.length
        ? "以下结论均来自已聚类事件与其抓取来源链接。"
        : "未匹配到相关事件，请换关键词或先运行 npm run intel:refresh。",
    },
  };
}

export function get_fastest_rising(limit = 10, filter?: "ai" | "all"): AgentToolResult {
  const { snapshot } = getEventsView();
  let events = [...snapshot.events].sort(
    (a, b) => b.velocity - a.velocity || b.heat_score - a.heat_score,
  );
  if (filter === "ai") events = events.filter(isAiRelated);
  return {
    tool: "get_fastest_rising",
    ok: true,
    data: { count: Math.min(limit, events.length), events: events.slice(0, limit).map(summarizeEvent) },
  };
}

export function generate_report(kind: "daily" | "ai" = "daily"): AgentToolResult {
  const top = kind === "ai" ? get_trending_topics(8, "ai") : get_trending_topics(10, "all");
  const rising = get_fastest_rising(5, kind === "ai" ? "ai" : "all");
  const buckets = getEventsByStatus();
  const topEvents = (top.data as { events: unknown[] }).events;
  const risingEvents = (rising.data as { events: unknown[] }).events;
  return {
    tool: "generate_report",
    ok: true,
    data: {
      kind,
      generatedAt: getEventsView().snapshot.generatedAt,
      events: topEvents,
      top: topEvents,
      rising: risingEvents,
      statusCounts: Object.fromEntries(
        (Object.keys(buckets) as TrendStatus[]).map((k) => [k, buckets[k].length]),
      ),
    },
  };
}

export function get_category_trends(category: string, limit = 10): AgentToolResult {
  const cat = category.trim().toLowerCase();
  const { snapshot } = getEventsView();
  const events = snapshot.events
    .filter((e) => {
      if (!cat) return true;
      if (e.categories.some((c) => c.toLowerCase() === cat || c.toLowerCase().includes(cat))) return true;
      return isAiRelated(e) && /ai|tech|人工智能/.test(cat);
    })
    .slice(0, limit)
    .map(summarizeEvent);
  return {
    tool: "get_category_trends",
    ok: true,
    data: { category: cat || "all", count: events.length, events },
  };
}

export function compare_period(): AgentToolResult {
  // MVP: no historical event store yet — explain and return today's velocity leaders
  const rising = get_fastest_rising(8, "all");
  return {
    tool: "compare_period",
    ok: true,
    data: {
      note: "历史事件时序对比将在后续 Phase 接入 archive；当前返回今日 velocity 领先事件作为近似。",
      todayRising: (rising.data as { events: unknown[] }).events,
    },
  };
}
