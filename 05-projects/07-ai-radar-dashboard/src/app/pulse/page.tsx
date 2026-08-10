import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Lightbulb,
  Radar,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { getPulseBriefView } from "@/lib/pulse-data";
import type { PulseOpportunityCategory } from "@/lib/pulse-types";

const CATEGORY_LABEL: Record<PulseOpportunityCategory, string> = {
  launches: "产品发布",
  search_trends: "搜索暴涨",
  oss_gap: "开源缺口",
  complaints: "开发者抱怨",
  tech_choice: "技术选型",
  competition: "竞争情报",
  trends: "趋势判断",
  action: "行动触发",
};

export default function PulsePage() {
  const { brief, fromFile } = getPulseBriefView();

  return (
    <div className="container py-10 space-y-10">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,182,115,0.45)] bg-[var(--signal-dim)] px-3 py-1 text-xs text-[#b7f0d1]">
          <Zap size={14} aria-hidden />
          BuilderPulse 风格 · 每日机会简报
        </div>
        <h1 className="display text-3xl sm:text-4xl font-semibold">今日构建建议</h1>
        <p className="text-[var(--muted)] max-w-3xl leading-relaxed">
          对齐 BuilderPulse：从多源公开信号交叉验证，每天给独立开发者 / 一人公司一条高置信构建方向，
          并拆开机会发现题库（发布、搜索、开源缺口、抱怨、行动）。
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag tag-signal">{brief.reportDate}</span>
          <span className="tag">{fromFile ? "已同步 JSON" : "seed 降级"}</span>
          <span className="tag">{brief.source}</span>
          <span className="tag">机会 {brief.opportunities.length}</span>
        </div>
        <p className="text-sm text-[var(--muted)]">{brief.methodNote}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/BuilderPulse/BuilderPulse#chinese"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost inline-flex items-center gap-1"
          >
            原项目中文说明 <ExternalLink size={14} aria-hidden />
          </a>
          <Link href="/radar" className="btn btn-ghost">
            返回动态雷达
          </Link>
          <Link href="/tools" className="btn btn-primary">
            进入工具目录 <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>

      <section className="hero-panel px-5 py-7 sm:px-8 space-y-4">
        <div className="flex items-center gap-2 text-[var(--signal)]">
          <Target size={18} aria-hidden />
          <h2 className="display text-xl font-semibold">今日建议</h2>
        </div>
        <p className="display text-2xl sm:text-3xl font-semibold leading-snug">
          {brief.buildIdea.title}
        </p>
        <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
          <span className="text-[var(--amber)] font-medium">为什么是现在：</span>
          {brief.buildIdea.whyNow}
        </p>
        <div className="insight-card p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb size={16} className="text-[var(--signal)]" aria-hidden />
            {brief.buildIdea.timeboxTitle}
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {brief.buildIdea.timeboxDetail}
          </p>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="paper-block p-5 space-y-3">
          <h2 className="display text-xl font-semibold">编辑视角</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{brief.editorNote}</p>
        </div>
        <div className="insight-card p-5 space-y-3">
          <h2 className="display text-xl font-semibold">白话简报</h2>
          <p className="text-sm leading-relaxed">{brief.plainBrief}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Radar size={18} className="text-[var(--signal)]" aria-hidden />
          <h2 className="display text-xl font-semibold">今日 Top 信号</h2>
        </div>
        <ol className="space-y-2 list-decimal pl-5 text-sm text-[var(--muted)] leading-relaxed">
          {brief.topSignals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--ai-accent)]" aria-hidden />
          <h2 className="display text-xl font-semibold">发现机会</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {brief.opportunities.map((op) => (
            <article key={op.id} className="surface px-4 py-4 space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="tag tag-signal">{CATEGORY_LABEL[op.category]}</span>
              </div>
              <h3 className="font-semibold leading-snug">{op.title}</h3>
              <p className="text-xs text-[var(--amber)] leading-relaxed">
                信号：{op.signal}
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{op.plainSpeak}</p>
              {op.judgment ? (
                <p className="text-xs leading-relaxed">
                  <span className="text-[var(--signal)]">关键判断：</span>
                  {op.judgment}
                </p>
              ) : null}
              {op.counterpoint ? (
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  <span className="text-[var(--amber)]">反向视角：</span>
                  {op.counterpoint}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {brief.trackRecord.length > 0 ? (
        <section className="space-y-3">
          <h2 className="display text-xl font-semibold">近期命中记录</h2>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {brief.trackRecord.map((t) => (
              <li key={`${t.date}-${t.summary}`} className="surface px-4 py-3">
                <span className="text-[var(--signal)] font-medium">{t.date}</span>
                <span className="mx-2">·</span>
                {t.summary}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="warning-card p-5 space-y-2 text-sm text-[var(--muted)] leading-relaxed">
        <p>{brief.attribution}</p>
        <p>
          本地安装：
          <code className="text-[var(--signal)]"> npm run pulse:install</code>
          {" · "}
          同步日报：
          <code className="text-[var(--signal)]"> npm run pulse:sync</code>
          {" · "}
          源文件：
          <code className="text-[var(--signal)]"> data/builder-pulse-daily.json</code>
        </p>
        <a
          href={brief.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[var(--signal)] underline"
        >
          查看来源 <ExternalLink size={12} aria-hidden />
        </a>
      </section>
    </div>
  );
}
