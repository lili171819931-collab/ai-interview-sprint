/**
 * Optional push after brief generation.
 * Env (any one enables that channel):
 *   INTEL_FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/...
 *   INTEL_PUSH_WEBHOOK=https://example.com/hook   (generic JSON POST)
 *   INTEL_PUSH_DRY_RUN=1                          (print only)
 *   INTEL_DASHBOARD_URL=http://localhost:3010     (link in message)
 *
 *   npm run intel:push
 */
import { existsSync, readFileSync } from "fs";
import path from "path";
import { dailyBriefSchema } from "../../src/lib/intel/schema";
import type { DailyBrief } from "../../src/lib/intel/types";

function loadBrief(root: string): DailyBrief {
  const p = path.join(root, "data", "briefs", "latest.json");
  if (!existsSync(p)) {
    throw new Error("缺少 data/briefs/latest.json，请先 npm run intel:briefs");
  }
  return dailyBriefSchema.parse(JSON.parse(readFileSync(p, "utf8"))) as DailyBrief;
}

function formatText(brief: DailyBrief, baseUrl: string): string {
  const lines = [
    `智衡 AI Radar · 日报 ${brief.reportDate}`,
    brief.headline,
    "",
    brief.summary,
    "",
    "TOP:",
    ...brief.top.slice(0, 5).map((e, i) => `${i + 1}. [${e.trend_status}/${e.heat_score}] ${e.title}`),
    "",
    "AI/科技:",
    ...brief.aiTop.slice(0, 3).map((e, i) => `${i + 1}. ${e.title}`),
    "",
    `${baseUrl}${brief.dashboardPath}`,
  ];
  return lines.join("\n");
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text.slice(0, 400) };
}

export async function pushBrief(brief: DailyBrief): Promise<{
  dryRun: boolean;
  channels: { channel: string; ok: boolean; detail: string }[];
}> {
  const baseUrl = (process.env.INTEL_DASHBOARD_URL || "http://localhost:3010").replace(/\/$/, "");
  const text = formatText(brief, baseUrl);
  const dryRun = process.env.INTEL_PUSH_DRY_RUN === "1";
  const channels: { channel: string; ok: boolean; detail: string }[] = [];

  const feishu = process.env.INTEL_FEISHU_WEBHOOK?.trim();
  const generic = process.env.INTEL_PUSH_WEBHOOK?.trim();

  if (!feishu && !generic) {
    return {
      dryRun,
      channels: [
        {
          channel: "none",
          ok: true,
          detail: "未配置 INTEL_FEISHU_WEBHOOK / INTEL_PUSH_WEBHOOK，跳过推送",
        },
      ],
    };
  }

  if (dryRun) {
    if (feishu) channels.push({ channel: "feishu", ok: true, detail: `DRY_RUN\n${text.slice(0, 280)}` });
    if (generic) channels.push({ channel: "webhook", ok: true, detail: `DRY_RUN payload bytes=${text.length}` });
    return { dryRun: true, channels };
  }

  if (feishu) {
    try {
      const r = await postJson(feishu, {
        msg_type: "text",
        content: { text },
      });
      channels.push({
        channel: "feishu",
        ok: r.ok,
        detail: `HTTP ${r.status} ${r.body}`,
      });
    } catch (err) {
      channels.push({
        channel: "feishu",
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (generic) {
    try {
      const r = await postJson(generic, {
        source: "ai-radar-intel",
        kind: "daily_brief",
        reportDate: brief.reportDate,
        headline: brief.headline,
        text,
        brief,
        url: `${baseUrl}${brief.dashboardPath}`,
      });
      channels.push({
        channel: "webhook",
        ok: r.ok,
        detail: `HTTP ${r.status} ${r.body}`,
      });
    } catch (err) {
      channels.push({
        channel: "webhook",
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { dryRun: false, channels };
}

async function main() {
  const root = path.join(__dirname, "..", "..");
  const brief = loadBrief(root);
  const result = await pushBrief(brief);
  console.log("[intel:push]", JSON.stringify(result, null, 2));
  if (result.channels.some((c) => !c.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
