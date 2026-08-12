/**
 * Trend Intelligence MCP server (stdio).
 * Run from project root: npm run mcp:intel
 * Cursor mcp.json example — see docs/16-... § MCP Tools
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  analyze_topic,
  compare_period,
  compare_platforms,
  compare_regions,
  generate_report,
  get_category_trends,
  get_event,
  get_fastest_rising,
  get_trending_topics,
  search_news,
} from "../src/lib/intel/agent-tools";

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function createServer() {
  const server = new McpServer({
    name: "ai-radar-intel",
    version: "0.1.0",
  });

  server.registerTool(
    "get_latest_trends",
    {
      description: "今日热度最高的聚类事件。filter=ai 仅 AI/科技。",
      inputSchema: {
        limit: z.number().int().min(1).max(30).optional().describe("返回条数，默认 10"),
        filter: z.enum(["all", "ai"]).optional().describe("all | ai"),
      },
    },
    async ({ limit, filter }) => textResult(get_trending_topics(limit ?? 10, filter ?? "all")),
  );

  server.registerTool(
    "search_trends",
    {
      description: "按关键词搜索今日事件聚类。",
      inputSchema: {
        query: z.string().describe("搜索词"),
        limit: z.number().int().min(1).max(30).optional(),
      },
    },
    async ({ query, limit }) => textResult(search_news(query, limit ?? 10)),
  );

  server.registerTool(
    "get_topic_detail",
    {
      description: "按事件 id 取详情，或按主题词做 analyze_topic。",
      inputSchema: {
        id: z.string().optional().describe("事件 id（优先）"),
        topic: z.string().optional().describe("主题关键词"),
      },
    },
    async ({ id, topic }) => {
      if (id?.trim()) return textResult(get_event(id.trim()));
      if (topic?.trim()) return textResult(analyze_topic(topic.trim()));
      return textResult({ ok: false, error: "需要 id 或 topic" });
    },
  );

  server.registerTool(
    "compare_trends",
    {
      description: "对比维度：regions | platforms | period（period 暂为 velocity 近似）。",
      inputSchema: {
        dimension: z.enum(["regions", "platforms", "period"]).describe("对比维度"),
      },
    },
    async ({ dimension }) => {
      if (dimension === "regions") return textResult(compare_regions());
      if (dimension === "platforms") return textResult(compare_platforms());
      return textResult(compare_period());
    },
  );

  server.registerTool(
    "get_platform_trends",
    {
      description: "各平台事件计数 + 跨平台事件。",
      inputSchema: {},
    },
    async () => textResult(compare_platforms()),
  );

  server.registerTool(
    "get_category_trends",
    {
      description: "按类别过滤热点（如 ai、tech、funding）。",
      inputSchema: {
        category: z.string().describe("类别关键词"),
        limit: z.number().int().min(1).max(30).optional(),
      },
    },
    async ({ category, limit }) => textResult(get_category_trends(category, limit ?? 10)),
  );

  server.registerTool(
    "get_fastest_rising",
    {
      description: "velocity 领先事件（无完整历史时序时的近似）。",
      inputSchema: {
        limit: z.number().int().min(1).max(30).optional(),
        filter: z.enum(["all", "ai"]).optional(),
      },
    },
    async ({ limit, filter }) => textResult(get_fastest_rising(limit ?? 10, filter ?? "all")),
  );

  server.registerTool(
    "generate_daily_report",
    {
      description: "生成今日热点简报（top + rising + 状态分布）。",
      inputSchema: {
        kind: z.enum(["daily", "ai"]).optional().describe("daily | ai"),
      },
    },
    async ({ kind }) => textResult(generate_report(kind ?? "daily")),
  );

  server.registerTool(
    "generate_weekly_report",
    {
      description: "周报占位：当前返回今日简报 + 说明（完整周环比待 archive）。",
      inputSchema: {},
    },
    async () => {
      const daily = generate_report("daily");
      const period = compare_period();
      return textResult({
        tool: "generate_weekly_report",
        ok: true,
        data: {
          note: "完整 7 日事件时序尚未接入；以下为今日简报 + period 近似。",
          daily: daily.data,
          period: period.data,
        },
      });
    },
  );

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[ai-radar-intel] MCP server on stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
