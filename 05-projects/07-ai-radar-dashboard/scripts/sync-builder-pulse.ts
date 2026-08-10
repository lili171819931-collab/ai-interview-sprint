/**
 * 同步 BuilderPulse 中文日报 → data/builder-pulse-daily.json
 * 优先读 vendor/BuilderPulse；否则拉取 GitHub raw。
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { buildSeedPulseBrief } from "../src/data/pulse-seed";
import { builderPulseBriefSchema } from "../src/lib/pulse-schema";
import type {
  BuilderPulseBrief,
  PulseOpportunity,
  PulseOpportunityCategory,
  PulseTrackItem,
} from "../src/lib/pulse-types";

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const outFile = path.join(dataDir, "builder-pulse-daily.json");
const tmpFile = path.join(dataDir, "builder-pulse-daily.tmp.json");
const vendorZhDir = path.join(root, "vendor", "BuilderPulse", "zh");
const vendorReadme = path.join(root, "vendor", "BuilderPulse", "README.md");

const REMOTE_README =
  "https://raw.githubusercontent.com/BuilderPulse/BuilderPulse/main/README.md";
const REMOTE_ZH = (date: string) =>
  `https://raw.githubusercontent.com/BuilderPulse/BuilderPulse/main/zh/${date.slice(0, 4)}/${date}.md`;

function shanghaiDay(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function stripMd(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBlock(md: string, headingRe: RegExp): string {
  const match = headingRe.exec(md);
  if (!match || match.index === undefined) return "";
  const start = match.index + match[0].length;
  const rest = md.slice(start);
  const next = rest.search(/\n##\s+/);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function extractField(block: string, labelRe: RegExp): string {
  const m = labelRe.exec(block);
  if (!m) return "";
  const after = block.slice(m.index + m[0].length);
  const stop = after.search(/\n\n|\n\*\*|$\n### /);
  return stripMd(stop === -1 ? after : after.slice(0, stop));
}

function categorizeTitle(title: string): PulseOpportunityCategory {
  if (/发布|Product Hunt|solo/i.test(title)) return "launches";
  if (/搜索|暴涨|降温|关键词/i.test(title)) return "search_trends";
  if (/GitHub|开源|商业版本/i.test(title)) return "oss_gap";
  if (/抱怨|投诉/i.test(title)) return "complaints";
  if (/关闭|降级|开发者工具|HuggingFace|Show HN|技术栈/i.test(title)) return "tech_choice";
  if (/收入|定价|复活|已死|竞争/i.test(title)) return "competition";
  if (/VC|YC|新词|趋势/i.test(title)) return "trends";
  if (/2 小时|周末|变现|反直觉|重叠|行动/i.test(title)) return "action";
  return "trends";
}

function parseOpportunities(md: string): PulseOpportunity[] {
  const sectionNames = ["发现机会", "技术选型", "竞争情报", "趋势判断", "行动触发"];
  const ops: PulseOpportunity[] = [];

  for (const section of sectionNames) {
    const block = extractBlock(md, new RegExp(`^##\\s+.*${section}.*$`, "m"));
    if (!block) continue;
    const parts = block.split(/\n###\s+/).slice(1);
    for (const part of parts) {
      const lines = part.trim().split("\n");
      const title = stripMd(lines[0] || "").replace(/^\d+\.\s*/, "");
      if (!title) continue;
      const body = part.slice(lines[0].length);
      const signal =
        extractField(body, /\*\*🔍\s*信号\*\*[：:]\s*/i) ||
        extractField(body, /\*\*最佳 2 小时方案\*\*[：:]\s*/i) ||
        stripMd(body).slice(0, 220);
      const plainSpeak =
        extractField(body, /\*\*白话说[：:]\*\*\s*/i) ||
        extractField(body, /\*\*为什么今天选它\*\*[：:]\s*/i) ||
        signal;
      const judgment =
        extractField(body, /\*\*关键判断\*\*[：:]\s*/i) || undefined;
      const counterpoint =
        extractField(body, /\*\*反向视角\*\*[：:]\s*/i) || undefined;

      ops.push({
        id: `opp-${ops.length + 1}`,
        category: categorizeTitle(title),
        title,
        signal: signal || title,
        plainSpeak: plainSpeak || signal || title,
        judgment,
        counterpoint,
      });
      if (ops.length >= 12) return ops;
    }
  }
  return ops;
}

function parseTopSignals(md: string): string[] {
  const block = extractBlock(md, /^##\s+.*今日 Top 3 信号.*$/m);
  if (!block) return [];
  return [...block.matchAll(/^\d+\.\s+(.+)$/gm)]
    .map((m) => stripMd(m[1]))
    .filter(Boolean)
    .slice(0, 3);
}

function parseEditorNote(md: string): string {
  const block = extractBlock(md, /^##\s+.*刘小排说.*$/m);
  if (!block) return "";
  const paras = block
    .split(/\n\n+/)
    .map((p) => stripMd(p))
    .filter((p) => p && !p.startsWith("**"));
  return paras.slice(0, 2).join(" ");
}

function parsePlainBrief(md: string): string {
  const block = extractBlock(md, /^##\s+.*白话简报.*$/m);
  const quote = block.match(/>\s*(.+)/);
  return quote ? stripMd(quote[1]) : stripMd(block).slice(0, 280);
}

function parseTimebox(md: string): { title: string; detail: string } {
  const block = extractBlock(md, /^##\s+.*今日 2 小时构建.*$/m);
  const bold = block.match(/\*\*([^*]+)\*\*/);
  const title = bold ? stripMd(bold[1]) : "今日 2 小时构建";
  const detail = stripMd(block.replace(/\*\*[^*]+\*\*/, "")).slice(0, 400);
  return { title, detail: detail || title };
}

function parseReadmeIdea(readme: string): { title: string; whyNow: string } | null {
  const zh = readme.split(/##\s+💡\s*今日建议/)[1] || readme.split(/## 💡 今日建议/)[1];
  if (!zh) return null;
  const chunk = zh.slice(0, 1200);
  const titleMatch = chunk.match(/>\s*\*\*(.+?)\*\*/);
  const whyMatch = chunk.match(/\*\*为什么是现在:\*\*\s*(.+)/);
  if (!titleMatch) return null;
  return {
    title: stripMd(titleMatch[1]),
    whyNow: whyMatch ? stripMd(whyMatch[1]) : "",
  };
}

function parseTrackRecord(readme: string): PulseTrackItem[] {
  const section = readme.split(/###\s+7 天命中记录/)[1]?.slice(0, 2500) || "";
  const items: PulseTrackItem[] = [];
  const re = /\*\*\[([^\]]+)]\(([^)]+)\):\*\*\s*(.+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(section))) {
    items.push({
      date: stripMd(m[1]),
      summary: stripMd(m[3]),
      reportPath: m[2],
    });
    if (items.length >= 7) break;
  }
  return items;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ai-radar-dashboard-pulse-sync/0.1" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function readLocalReport(date: string): { md: string; source: BuilderPulseBrief["source"] } | null {
  const file = path.join(vendorZhDir, date.slice(0, 4), `${date}.md`);
  if (!existsSync(file)) return null;
  return { md: readFileSync(file, "utf8"), source: "builderpulse-local" };
}

async function loadMarkdown(date: string): Promise<{
  md: string;
  readme: string;
  source: BuilderPulseBrief["source"];
  sourceUrl: string;
} | null> {
  const local = readLocalReport(date);
  const localReadme = existsSync(vendorReadme) ? readFileSync(vendorReadme, "utf8") : "";

  if (local) {
    return {
      md: local.md,
      readme: localReadme,
      source: "builderpulse-local",
      sourceUrl: `https://github.com/BuilderPulse/BuilderPulse/blob/main/zh/${date.slice(0, 4)}/${date}.md`,
    };
  }

  const [md, readme] = await Promise.all([fetchText(REMOTE_ZH(date)), fetchText(REMOTE_README)]);
  if (!md) return null;
  return {
    md,
    readme: readme || "",
    source: "builderpulse-remote",
    sourceUrl: REMOTE_ZH(date),
  };
}

function buildBriefFromMarkdown(
  md: string,
  readme: string,
  reportDate: string,
  source: BuilderPulseBrief["source"],
  sourceUrl: string,
): BuilderPulseBrief {
  const idea = parseReadmeIdea(readme);
  const timebox = parseTimebox(md);
  const opportunities = parseOpportunities(md);
  const topSignals = parseTopSignals(md);
  const editorNote = parseEditorNote(md);
  const plainBrief = parsePlainBrief(md);
  const trackRecord = parseTrackRecord(readme);

  const seed = buildSeedPulseBrief();
  return {
    generatedAt: new Date().toISOString(),
    reportDate,
    timezone: "Asia/Shanghai",
    source,
    sourceUrl,
    attribution:
      "内容解析自 BuilderPulse 公开中文日报（CC BY-NC 4.0，非商业用途）。原作者：Liu Xiaopai / BuilderPulse。",
    editorNote: editorNote || seed.editorNote,
    plainBrief: plainBrief || seed.plainBrief,
    buildIdea: {
      title: idea?.title || seed.buildIdea.title,
      whyNow: idea?.whyNow || seed.buildIdea.whyNow,
      timeboxTitle: timebox.title || seed.buildIdea.timeboxTitle,
      timeboxDetail: timebox.detail || seed.buildIdea.timeboxDetail,
    },
    topSignals: topSignals.length ? topSignals : seed.topSignals,
    opportunities: opportunities.length ? opportunities : seed.opportunities,
    trackRecord: trackRecord.length ? trackRecord : seed.trackRecord,
    methodNote:
      "同步自 BuilderPulse：跨 HN / GitHub / Product Hunt / Trends 等公开信号 → 一条今日构建建议 + 机会发现题库。命令：npm run pulse:sync",
  };
}

async function main() {
  mkdirSync(dataDir, { recursive: true });
  const preferred = process.env.PULSE_DATE?.trim() || shanghaiDay();

  let loaded = await loadMarkdown(preferred);
  if (!loaded) {
    // try previous day once
    const prev = shanghaiDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
    loaded = await loadMarkdown(prev);
  }

  let brief: BuilderPulseBrief;
  if (!loaded) {
    console.warn("⚠️  未能读取 BuilderPulse 日报，写入 seed 降级数据。可先运行 npm run pulse:install");
    brief = buildSeedPulseBrief();
  } else {
    brief = buildBriefFromMarkdown(
      loaded.md,
      loaded.readme,
      preferred,
      loaded.source,
      loaded.sourceUrl,
    );
  }

  const parsed = builderPulseBriefSchema.parse(brief);
  writeFileSync(tmpFile, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  renameSync(tmpFile, outFile);

  console.log("✅ BuilderPulse brief synced");
  console.log(`   date     : ${parsed.reportDate}`);
  console.log(`   source   : ${parsed.source}`);
  console.log(`   idea     : ${parsed.buildIdea.title}`);
  console.log(`   opps     : ${parsed.opportunities.length}`);
  console.log(`   out      : ${path.relative(root, outFile)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
