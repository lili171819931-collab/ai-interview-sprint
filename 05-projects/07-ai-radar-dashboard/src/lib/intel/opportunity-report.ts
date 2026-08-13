import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { queryHotTopics } from "@/lib/intel/feed";
import { getGlobalHotTopicsView } from "@/lib/global-hot-data";
import { getPulseBriefView } from "@/lib/pulse-data";
import type { HotRankItem } from "@/lib/intel/aihot-types";
import type { GlobalHotItem } from "@/lib/global-hot-types";
import type {
  OpportunityArchiveIndexItem,
  OpportunityDailyReport,
  OpportunityEvidence,
} from "@/lib/intel/opportunity-types";
import { shanghaiDay } from "@/lib/intel/time";

const DATA = path.join(process.cwd(), "data");
const LATEST = path.join(DATA, "opportunity-report-daily.json");
const DATED_DIR = path.join(DATA, "opportunities");

function aiRelated(title: string): boolean {
  return /AI|GPT|Claude|Grok|Gemini|LLM|大模型|人工智能|ChatGPT|OpenAI|Anthropic|DeepSeek|Qwen|智能体|Agent|模型/i.test(
    title,
  );
}

function pickHot(items: GlobalHotItem[], n: number) {
  const ai = items.filter((it) => aiRelated(it.title));
  const pool = ai.length >= 3 ? ai : items;
  return pool.slice(0, n);
}

function evidenceFromSignals(signals: string[]): OpportunityEvidence[] {
  return signals.slice(0, 4).map((s) => {
    const short = s.length > 48 ? `${s.slice(0, 48)}…` : s;
    return {
      label: short,
      discussion: "多源交叉验证公开讨论",
      meaning: s,
    };
  });
}

/** 按 BuilderPulse 方法合成：一条建议 + Why now + Top 信号 + 题库（信号/白话/判断/反方）+ 三棱镜 */
export function buildOpportunityReport(reportDate?: string): OpportunityDailyReport {
  const hot = queryHotTopics();
  const global = getGlobalHotTopicsView();
  const { brief } = getPulseBriefView();
  const date = reportDate || brief.reportDate || shanghaiDay();

  const cnItems = global.snapshot.platforms
    .filter((p) => p.region === "国内")
    .flatMap((p) => p.items)
    .sort((a, b) => a.rank - b.rank);
  const intlItems = global.snapshot.platforms
    .filter((p) => p.region === "海外")
    .flatMap((p) => p.items)
    .sort((a, b) => a.rank - b.rank);

  const rankTop = hot.items.slice(0, 5);
  const cnTop = pickHot(cnItems, 5);
  const intlTop = pickHot(intlItems, 5);

  const buildIdea = {
    title: brief.buildIdea.title,
    whyNow: brief.buildIdea.whyNow,
    timeboxTitle: brief.buildIdea.timeboxTitle,
    timeboxDetail: brief.buildIdea.timeboxDetail,
  };

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    reportDate: date,
    timezone: "Asia/Shanghai",
    method: "builderpulse-aligned",
    attribution: brief.attribution,
    sourceUrl: brief.sourceUrl,
    editorNote: brief.editorNote,
    plainBrief: brief.plainBrief,
    headline: buildIdea.title,
    summary: brief.plainBrief,
    buildIdea,
    topSignals: brief.topSignals.slice(0, 5),
    evidence: evidenceFromSignals(brief.topSignals),
    lenses: [
      {
        id: "ai-rank",
        title: "AI 热点榜信号",
        blurb: "精选事件热度 · 对齐热点榜名次",
        items: rankTop.map((it: HotRankItem) => ({
          title: it.title,
          meta: `${it.sourceName} · 热度值 ${it.heat}`,
          href: it.href,
          note: it.status === "fermenting" ? "发酵中" : it.status === "new" ? "新" : undefined,
        })),
      },
      {
        id: "cn-hot",
        title: "国内热点切入",
        blurb: "公开聚合榜 · 优先 AI 相关",
        items: cnTop.map((it) => ({
          title: it.title,
          meta: `${it.platform} · #${it.rank}${it.heat != null ? ` · 热度 ${it.heat}` : ""}`,
          href: it.url || `https://www.google.com/search?q=${encodeURIComponent(it.title.slice(0, 80))}`,
        })),
      },
      {
        id: "intl-hot",
        title: "海外热点切入",
        blurb: "HN / PH / TechCrunch 等",
        items: intlTop.map((it) => ({
          title: it.title,
          meta: `${it.platform} · #${it.rank}${it.heat != null ? ` · 热度 ${it.heat}` : ""}`,
          href: it.url || `https://www.google.com/search?q=${encodeURIComponent(it.title.slice(0, 80))}`,
        })),
      },
    ],
    opportunities: brief.opportunities.slice(0, 12),
    trackRecord: brief.trackRecord.slice(0, 7).map((t) => ({
      ...t,
      reportPath: t.reportPath?.startsWith("http")
        ? t.reportPath
        : t.reportPath
          ? `https://github.com/BuilderPulse/BuilderPulse/blob/main/${t.reportPath}`
          : `/opportunities?date=${t.date}`,
    })),
    methodNote:
      "方法对齐 BuilderPulse（CC BY-NC）：跨源交叉验证 → 一条高置信构建建议 + Why now + Top 信号 + 机会题库（信号／白话／关键判断／反向视角）。本地再叠 AI 热点榜与国内／海外看板。命令：npm run opp:sync",
    stats: {
      aiHot: rankTop.length,
      cnHot: cnTop.length,
      intlHot: intlTop.length,
      opportunities: Math.min(12, brief.opportunities.length),
    },
  };
}

function readStoredReport(file: string): OpportunityDailyReport | null {
  try {
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf8")) as OpportunityDailyReport;
  } catch {
    return null;
  }
}

/** 页面只读已落盘报告，避免写入 data/ 触发 Next 热更新死循环。日更请跑 npm run opp:sync。 */
export function getLatestOpportunityReport(): OpportunityDailyReport | null {
  const stored = readStoredReport(LATEST);
  if (stored) {
    try {
      const { brief } = getPulseBriefView();
      if (brief.buildIdea?.title && brief.buildIdea.title !== stored.buildIdea?.title) {
        return {
          ...stored,
          generatedAt: brief.generatedAt || stored.generatedAt,
          reportDate: brief.reportDate || stored.reportDate,
          headline: brief.buildIdea.title,
          summary: brief.plainBrief || stored.summary,
          editorNote: brief.editorNote || stored.editorNote,
          plainBrief: brief.plainBrief || stored.plainBrief,
          buildIdea: brief.buildIdea,
          topSignals: brief.topSignals?.length ? brief.topSignals.slice(0, 5) : stored.topSignals,
          evidence: brief.topSignals?.length ? evidenceFromSignals(brief.topSignals) : stored.evidence,
          opportunities: brief.opportunities?.length ? brief.opportunities.slice(0, 12) : stored.opportunities,
          trackRecord: brief.trackRecord?.length
            ? brief.trackRecord.slice(0, 7).map((t) => ({
                ...t,
                reportPath: t.reportPath?.startsWith("http")
                  ? t.reportPath
                  : t.reportPath
                    ? `https://github.com/BuilderPulse/BuilderPulse/blob/main/${t.reportPath}`
                    : `/opportunities?date=${t.date}`,
              }))
            : stored.trackRecord,
        };
      }
    } catch {
      /* keep stored */
    }
    return stored;
  }
  try {
    return buildOpportunityReport();
  } catch {
    return null;
  }
}

export function getOpportunityReportByDate(date: string): OpportunityDailyReport | null {
  const dated = path.join(DATED_DIR, `${date}.json`);
  const archived = path.join(DATA, "archive", date, "opportunity-report.json");
  for (const p of [dated, archived]) {
    const hit = readStoredReport(p);
    if (hit) return hit;
  }
  const latest = readStoredReport(LATEST);
  if (latest?.reportDate === date) return latest;
  return null;
}

export function listOpportunityArchives(limit = 14): OpportunityArchiveIndexItem[] {
  const items: OpportunityArchiveIndexItem[] = [];
  if (existsSync(DATED_DIR)) {
    const files = readdirSync(DATED_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
      .reverse()
      .slice(0, limit);
    for (const f of files) {
      try {
        const report = JSON.parse(readFileSync(path.join(DATED_DIR, f), "utf8")) as OpportunityDailyReport;
        items.push({
          date: report.reportDate,
          headline: report.headline || report.buildIdea.title,
          whyNow: report.buildIdea.whyNow,
          href: `/opportunities?date=${report.reportDate}`,
        });
      } catch {
        /* skip */
      }
    }
  }
  if (!items.length) {
    const latest = getLatestOpportunityReport();
    if (latest) {
      items.push({
        date: latest.reportDate,
        headline: latest.headline,
        whyNow: latest.buildIdea.whyNow,
        href: `/opportunities?date=${latest.reportDate}`,
      });
    }
  }
  return items;
}

/** 写入最新 + 按日归档（供脚本与页面生成调用） */
export function persistOpportunityReport(report: OpportunityDailyReport): {
  latest: string;
  dated: string;
} {
  mkdirSync(DATA, { recursive: true });
  mkdirSync(DATED_DIR, { recursive: true });
  const dated = path.join(DATED_DIR, `${report.reportDate}.json`);
  const body = JSON.stringify(report, null, 2) + "\n";
  writeFileSync(LATEST, body, "utf8");
  writeFileSync(dated, body, "utf8");

  const archiveDir = path.join(DATA, "archive", report.reportDate);
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(path.join(archiveDir, "opportunity-report.json"), body, "utf8");

  return { latest: LATEST, dated };
}
