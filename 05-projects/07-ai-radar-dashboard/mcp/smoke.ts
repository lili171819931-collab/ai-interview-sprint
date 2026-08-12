/**
 * Smoke: spawn MCP stdio server, list tools, call get_latest_trends.
 * Usage: npx tsx mcp/smoke.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function main() {
  const cwd = process.cwd();
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", path.join(cwd, "mcp/server.ts")],
    cwd,
  });
  const client = new Client({ name: "intel-smoke", version: "0.1.0" });
  await client.connect(transport);
  const tools = await client.listTools();
  console.log(
    "tools:",
    tools.tools.map((t) => t.name).join(", "),
  );
  const res = await client.callTool({
    name: "get_latest_trends",
    arguments: { limit: 3, filter: "ai" },
  });
  const text = (res.content as { type: string; text?: string }[])
    .filter((c) => c.type === "text")
    .map((c) => c.text || "")
    .join("\n");
  const parsed = JSON.parse(text) as { data?: { count?: number; events?: { title: string }[] } };
  console.log("get_latest_trends count:", parsed.data?.count, "first:", parsed.data?.events?.[0]?.title?.slice(0, 60));
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
