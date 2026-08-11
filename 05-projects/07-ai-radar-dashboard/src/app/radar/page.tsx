import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Flame,
  Lightbulb,
  Radar,
  Zap,
} from "lucide-react";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { MONITOR_POOL_LABELS, type MonitorPool } from "@/data/research-sources";
import { getBundleView } from "@/lib/data";
import { getPulseBriefView } from "@/lib/pulse-data";
import { getRadarReportView } from "@/lib/radar-data";
import { getTrendRadarView } from "@/lib/trendradar-data";
import type { Confidence, Heat, RadarSignal } from "@/lib/radar-types";

const CATEGORY_LABEL: Record<RadarSignal["category"], string> = {
  model: "模型",
  tool: "工具",
  paper: "论文",
  news: "新闻",
  official: "官方",
  funding: "融资",
  ranking: "榜单",
};

const FACT_LABEL: Record<RadarSignal["factKind"], string> = {
  confirmed: "已确认事实",
  inferred: "推测",
  rumor: "市场传闻",
  official: "官方发布",
};

function heatDots(heat: Heat) {
  return "●".repeat(heat) + "○".repeat(5 - heat);
}

function confidenceClass(c: Confidence) {
  if (c === "high") return "tag tag-signal";
  if (c === "medium") return "tag tag-amber";
  return "tag";
}

export default function RadarPage() {
  const { report, fromFile } = getRadarReportView();
  const { brief: pulse } = getPulseBriefView();
  const { snapshot: trend, fromFile: trendFromFile } = getTrendRadarView();
  const { freshness, lastUpdatedDate } = getBundleView();
  const byPool = (Object.keys(MONITOR_POOL_LABELS) as MonitorPool[]).map((pool) => ({
    pool,
    label: MONITOR_POOL_LABELS[pool],
    signals: report.signals.filter((s) => s.pool === pool),
    meta: report.monitorPools.find((p) => p.pool === pool),
  }));

  const topSignals = [...report.signals]
    .sort((a, b) => b.heat - a.heat || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12);

  const trendTop = [...trend.items].sort((a, b) => a.rank - b.rank).slice(0, 18);
  const trendAi = trend.items.filter((i) => i.aiRelated).slice(0, 8);

  return (
    <div className="container py-10 space-y-10">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.45)] bg-[var(--ai-accent-dim)] px-3 py-1 text-xs text-[#d7ccff]">
          <Radar size={14} aria-hidden />
          AI 动态雷达 · 5 监控池 + TrendRadar 热点融合
        </div>
        <h1 className="display text-3xl sm:text-4xl font-semibold">AI 动态雷达日报</h1>
        <p className="text-[var(--muted)] max-w-3xl leading-relaxed">
          覆盖模型榜单、工具目录、新闻快讯、论文研究、官方发布；并融合 TrendRadar 多平台热搜。
          输出日报 / 排行观察 / 风险提醒 / 机会洞察；不自动改七维分数。
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag tag-signal">{report.reportDate}</span>
          <span className="tag">{report.kind === "weekly" ? "周报" : "日报"}</span>
          <span className="tag">{fromFile ? "已落盘 JSON" : "seed 降级"}</span>
          <span className="tag">信号 {report.signals.length}</span>
          <span className="tag">{trendFromFile ? "TrendRadar 已同步" : "TrendRadar seed"}</span>
        </div>
        <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
        <p className="text-sm text-[var(--muted)]">{report.methodNote}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pulse" className="btn btn-primary">
            机会简报 <ArrowRight size={16} aria-hidden />
          </Link>
          <a href="#trendradar-hot" className="btn btn-ghost">
            跳转热点融合
          </a>
          <Link href="/hot" className="btn btn-ghost">
            国内外实时热点
          </Link>
          <Link href="/sources" className="btn btn-ghost">
            查看来源矩阵
          </Link>
          <Link href="/tools" className="btn btn-ghost">
            进入工具目录
          </Link>
        </div>
      </div>

      <section className="hero-panel px-5 py-6 space-y-3">
        <div className="flex items-center gap-2 text-[var(--signal)]">
          <Zap size={18} aria-hidden />
          <h2 className="display text-xl font-semibold">BuilderPulse · 今日构建建议</h2>
        </div>
        <p className="display text-2xl font-semibold leading-snug">{pulse.buildIdea.title}</p>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="text-[var(--amber)] font-medium">为什么是现在：</span>
          {pulse.buildIdea.whyNow}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pulse" className="btn btn-primary">
            打开完整机会简报 <ArrowRight size={16} aria-hidden />
          </Link>
          <a
            href="https://github.com/BuilderPulse/BuilderPulse#chinese"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost inline-flex items-center gap-1"
          >
            原项目说明 <ExternalLink size={14} aria-hidden />
          </a>
        </div>
      </section>

      <section id="trendradar-hot" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--amber)]">
              <Flame size={18} aria-hidden />
              <h2 className="display text-xl font-semibold">TrendRadar · 多平台热点融合</h2>
            </div>
            <p className="text-sm text-[var(--muted)] max-w-3xl leading-relaxed">
              学习并对齐{" "}
              <a
                href="https://github.com/sansan0/TrendRadar"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--signal)] underline"
              >
                sansan0/TrendRadar
              </a>
              ：聚合头条 / 百度 / 微博 / 抖音 / 知乎等热搜，同步进智衡雷达，辅助发现舆情与产品机会。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="tag tag-signal">抓取 {trend.crawlTime}</span>
            <span className="tag">条目 {trend.totalItems}</span>
            <span className="tag">平台 {trend.successPlatforms} 成功</span>
            <span className="tag">{trend.source}</span>
          </div>
        </div>

        {trend.platforms.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {trend.platforms.map((p) => (
              <div key={p.id} className="metric-card px-3 py-3 space-y-1">
                <p className="text-xs text-[var(--muted)] truncate">{p.name}</p>
                <p className="display text-lg font-semibold">{p.itemCount}</p>
                <p className="text-[10px] text-[var(--muted)]">
                  {p.status === "success" ? "成功" : p.status === "failed" ? "失败" : "未知"}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {trendAi.length > 0 ? (
          <div className="insight-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">AI 相关热点速览</h3>
            <ul className="space-y-2">
              {trendAi.map((item) => (
                <li key={item.id} className="text-sm leading-relaxed">
                  <span className="tag tag-signal mr-2">#{item.rank}</span>
                  <span className="text-xs text-[var(--muted)] mr-2">{item.platformName}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text)] hover:text-[var(--signal)] underline-offset-2 hover:underline"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="table-scroll surface">
          <table className="compare-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>标题</th>
                <th>平台</th>
                <th>标签</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>
              {trendTop.map((item) => (
                <tr key={item.id}>
                  <td className="text-[var(--signal)] font-medium">#{item.rank}</td>
                  <td className="min-w-[16rem] font-medium">{item.title}</td>
                  <td className="text-sm text-[var(--muted)]">{item.platformName}</td>
                  <td>{item.aiRelated ? <span className="tag tag-signal">AI</span> : <span className="tag">一般</span>}</td>
                  <td>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--signal)] underline inline-flex items-center gap-1"
                    >
                      打开
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href={trend.htmlReportUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary inline-flex items-center gap-1"
          >
            打开 TrendRadar HTML 报告 <ExternalLink size={14} aria-hidden />
          </a>
          <a
            href="https://github.com/sansan0/TrendRadar"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost inline-flex items-center gap-1"
          >
            TrendRadar 仓库 <ExternalLink size={14} aria-hidden />
          </a>
        </div>
        <p className="text-xs text-[var(--muted)]">{trend.methodNote}</p>
      </section>

      <section className="insight-card p-5 space-y-3">
        <h2 className="display text-xl font-semibold">执行摘要</h2>
        <ol className="space-y-2 text-sm leading-relaxed text-[var(--muted)] list-decimal pl-5">
          {report.executiveSummary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">5 个监控池</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {byPool.map((p) => (
            <div key={p.pool} className="metric-card px-3 py-4 space-y-2">
              <p className="text-xs text-[var(--muted)]">{p.label}</p>
              <p className="display text-2xl font-semibold">{p.meta?.sourceCount ?? 0}</p>
              <p className="text-xs text-[var(--muted)]">登记源 · 今日信号 {p.signals.length}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">看板信号（名称 / 类别 / 热度 / 排名 / 可信度 / 更新 / 来源 / PM 机会）</h2>
        <div className="table-scroll surface">
          <table className="compare-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>类别</th>
                <th>监控池</th>
                <th>热度</th>
                <th>排名</th>
                <th>可信度</th>
                <th>更新</th>
                <th>来源</th>
                <th>PM 机会点</th>
              </tr>
            </thead>
            <tbody>
              {topSignals.map((s) => (
                <tr key={s.id}>
                  <td className="min-w-[12rem]">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{s.summary}</p>
                    <p className="text-xs text-[var(--amber)] mt-1">{FACT_LABEL[s.factKind]}</p>
                  </td>
                  <td>{CATEGORY_LABEL[s.category]}</td>
                  <td>{MONITOR_POOL_LABELS[s.pool]}</td>
                  <td className="text-[var(--signal)] tracking-tight" title={`heat ${s.heat}`}>
                    {heatDots(s.heat)}
                  </td>
                  <td className="text-sm text-[var(--muted)]">{s.rank ?? "—"}</td>
                  <td>
                    <span className={confidenceClass(s.confidence)}>{s.confidence}</span>
                  </td>
                  <td className="text-sm">{s.updatedAt}</td>
                  <td className="min-w-[9rem]">
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--signal)] underline inline-flex items-center gap-1 break-all"
                    >
                      {s.sourceName}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  </td>
                  <td className="text-sm text-[var(--muted)] min-w-[12rem]">{s.pmOpportunity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="paper-block p-5 space-y-3">
          <h2 className="display text-xl font-semibold">排行榜观察</h2>
          <ul className="text-sm space-y-2 text-[var(--muted)] leading-relaxed">
            {report.rankingNotes.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        </div>
        <div className="warning-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[var(--amber)]" aria-hidden />
            <h2 className="display text-xl font-semibold">风险提醒</h2>
          </div>
          <ul className="text-sm space-y-2 text-[var(--muted)] leading-relaxed">
            {report.riskAlerts.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="insight-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-[var(--signal)]" aria-hidden />
            <h2 className="display text-xl font-semibold">机会洞察</h2>
          </div>
          <ul className="text-sm space-y-2 text-[var(--muted)] leading-relaxed">
            {report.opportunities.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        </div>
        <div className="paper-block p-5 space-y-3">
          <h2 className="display text-xl font-semibold">今日行动建议</h2>
          <div className="space-y-3">
            {report.actions.map((a) => (
              <div key={a.title} className="surface px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="tag tag-signal">{a.priority}</span>
                  <p className="font-medium">{a.title}</p>
                </div>
                <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">按监控池浏览信号</h2>
        <div className="space-y-6">
          {byPool.map((p) => (
            <div key={p.pool} className="space-y-2">
              <h3 className="text-sm font-semibold">
                {p.label}
                <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                  {p.signals.length} 条
                </span>
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {p.signals.slice(0, 6).map((s) => (
                  <div key={s.id} className="surface px-4 py-3 space-y-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="tag">{CATEGORY_LABEL[s.category]}</span>
                      <span className={confidenceClass(s.confidence)}>{s.confidence}</span>
                      <span className="text-xs text-[var(--signal)]">{heatDots(s.heat)}</span>
                    </div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">{s.pmOpportunity}</p>
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--signal)] underline inline-flex items-center gap-1"
                    >
                      {s.sourceName}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-[var(--muted)]">
        数据文件：<code className="text-[var(--signal)]">data/radar-daily-report.json</code> · 命令：
        <code className="text-[var(--signal)]"> npm run radar:daily</code> · Prompt：
        <code className="text-[var(--signal)]">docs/极致Prompt-AI动态雷达日更.md</code>
      </p>
    </div>
  );
}
