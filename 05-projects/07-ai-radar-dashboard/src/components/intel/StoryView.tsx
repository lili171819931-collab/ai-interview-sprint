import Link from "next/link";
import {
  ArrowLeft,
  BookOpenText,
  Calculator,
  Clock3,
  ExternalLink,
  Flame,
  Radar,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waypoints,
} from "lucide-react";
import type { StoryView } from "@/lib/intel/story-types";
import { storyDurationDays } from "@/lib/intel/story";
import { formatRelativeZh, formatUpdatedAt } from "@/lib/intel/time";
import { StoryHeatChart } from "./StoryHeatChart";

const STATUS_LABEL: Record<string, string> = {
  active: "进行中",
  ended: "已结束",
  paused: "暂停更新",
};

function fmtShanghai(iso: string | null): string {
  return formatUpdatedAt(iso);
}

function Digest({ digest }: { digest: string | null }) {
  if (!digest?.trim()) return null;
  const paras = digest.split(/\n+/).filter((p) => p.trim());
  if (!paras.length) return null;
  return (
    <section className="surface rounded-xl border border-[var(--line)] p-5 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">DIGEST</p>
          <h2 className="display text-lg font-semibold">事件全貌</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">AI 综述 · 随事件进展持续更新</p>
      </div>
      <div className="space-y-2.5">
        {paras.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-[var(--text)]">
            {p}
          </p>
        ))}
      </div>
      <p className="text-[11px] text-[var(--muted)] leading-relaxed">
        本综述由 AI 汇总全部报道生成；下方时间线中的单篇报道保留其发布时的原貌。
      </p>
    </section>
  );
}

function SearchLogicSection({ view }: { view: StoryView }) {
  const { search, heat } = view;
  const trend = heat.trend;
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;
  return (
    <section className="surface rounded-xl border border-[var(--line)] overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">SEARCH · COMPUTE</p>
        <h2 className="display text-lg font-semibold mt-0.5">搜索与计算逻辑</h2>
        <p className="text-xs text-[var(--muted)] mt-1">本项目本地检索 + 热度计算口径（不依赖外部站内逻辑）</p>
      </div>
      <div className="grid gap-px bg-[var(--line)] md:grid-cols-2">
        <div className="bg-[var(--panel)] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Search size={15} className="text-[var(--signal)]" aria-hidden /> 检索逻辑
          </div>
          <div className="flex flex-wrap gap-1.5">
            {search.keywords.map((k) => (
              <span key={k} className="rounded-full border border-[var(--line)] bg-[var(--signal-dim)] px-2.5 py-0.5 text-xs text-[var(--text)]">
                {k}
              </span>
            ))}
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--text)]">{search.strategy}</p>
          <p className="text-xs text-[var(--muted)]">
            {search.scope} · 窗口 {search.windowLabel}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {search.sourceBreakdown.map((s) => (
              <span key={s.kind} className="text-xs text-[var(--muted)]">
                {s.kind} <b className="text-[var(--text)]">{s.count}</b>
              </span>
            ))}
          </div>
          <details className="text-xs text-[var(--muted)]">
            <summary className="cursor-pointer hover:text-[var(--text)]">查看全部 {search.sources.length} 个信源</summary>
            <ul className="mt-2 space-y-1 max-h-44 overflow-y-auto pr-2">
              {search.sources.map((s) => (
                <li key={s} className="leading-snug">
                  {s}
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="bg-[var(--panel)] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Calculator size={15} className="text-[var(--signal)]" aria-hidden /> 热度计算
          </div>
          <code className="block rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-xs font-mono text-[var(--text)]">
            {heat.formula}
          </code>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-[var(--muted)]">信源数</dt>
              <dd className="font-mono text-sm">{heat.inputs.sourceCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">信号数</dt>
              <dd className="font-mono text-sm">{heat.inputs.signalCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">当前热度</dt>
              <dd className="font-mono text-sm text-[var(--signal)]">{heat.current}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">峰值</dt>
              <dd className="font-mono text-sm text-[var(--amber)]">
                {heat.peak}
                <span className="ml-1 text-[11px] text-[var(--muted)]">{fmtShanghai(heat.peakAt)}</span>
              </dd>
            </div>
          </dl>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            趋势：
            {trend === "up" ? (
              <span className="inline-flex items-center gap-1 text-[var(--signal)]">
                <TrendingUp size={14} aria-hidden /> 上升
              </span>
            ) : trend === "down" ? (
              <span className="inline-flex items-center gap-1 text-[var(--amber)]">
                <TrendingDown size={14} aria-hidden /> 回落
              </span>
            ) : (
              <span>平稳</span>
            )}
            <span>· 半衰期 {heat.inputs.halfLifeHours}h · 最近更新 {fmtShanghai(heat.inputs.latestAt)}</span>
          </div>
          <StoryHeatChart points={heat.points} peakAt={heat.peakAt} />
        </div>
      </div>
    </section>
  );
}

function RecommendationSection({ view }: { view: StoryView }) {
  const { recommendation } = view;
  return (
    <section className="surface rounded-xl border border-[var(--line)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-[var(--amber)]" aria-hidden />
        <h2 className="display text-lg font-semibold">推荐理由</h2>
        <span className="text-xs text-[var(--muted)]">{recommendation.overallBasis}</span>
      </div>
      <p className="rounded-lg border-l-3 border-[var(--signal)] bg-[var(--signal-dim)] px-4 py-3 text-sm leading-relaxed">
        {recommendation.overall}
      </p>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--muted)]">逐篇理由</p>
        <ul className="grid gap-2 md:grid-cols-2">
          {recommendation.perReport.map((r) => (
            <li key={r.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5">
              <p className="text-[13px] font-medium leading-snug line-clamp-2">{r.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed line-clamp-3">{r.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TimelineSection({ view }: { view: StoryView }) {
  const { story } = view;
  const firstParty = story.reports.filter((r) => r.source.firstParty).length;
  return (
    <section className="surface rounded-xl border border-[var(--line)] overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">TIMELINE</p>
          <h2 className="display text-lg font-semibold mt-0.5">报道故事线</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">
          {story.reports.length} 条公开报道 · 官方一手 {firstParty} 条 · 最新在前
        </p>
      </div>
      <ol className="divide-y divide-[var(--line)]">
        {story.reports.map((r) => (
          <li key={r.id} className="grid gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[92px_minmax(0,1fr)]">
            <time dateTime={r.publishedAt} className="text-xs font-mono text-[var(--muted)] pt-0.5">
              {fmtShanghai(r.publishedAt)}
            </time>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <a
                  href={r.links.original || r.links.aihot || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="zh-title"
                  style={{ fontSize: "0.95rem" }}
                >
                  {r.title}
                </a>
                {r.source.firstParty ? <span className="hot-badge hot-badge-new">官方一手</span> : null}
                {r.links.original ? (
                  <a
                    href={r.links.original}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    原文 <ExternalLink size={11} aria-hidden />
                  </a>
                ) : null}
              </div>
              <p className="text-xs text-[var(--muted)]">{r.source.name}</p>
              {r.summary ? <p className="text-[13px] leading-relaxed text-[var(--text)]">{r.summary}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StorylineSection({ view }: { view: StoryView }) {
  const { story } = view;
  if (!story.storyline?.length) return null;
  return (
    <section className="surface rounded-xl border border-[var(--line)] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Waypoints size={15} className="text-[var(--signal)]" aria-hidden />
        <h2 className="display text-lg font-semibold">相关故事线</h2>
      </div>
      <ul className="space-y-2">
        {story.storyline.map((s) => (
          <li key={s.publicId} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Link href={`/story/${s.publicId}`} className="zh-title hover:underline" style={{ fontSize: "0.92rem" }}>
              {s.title}
            </Link>
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
              {s.relation || "同一故事线"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StoryView({ view }: { view: StoryView }) {
  const { story, topic } = view;
  const status = STATUS_LABEL[story.status] || story.status || "进行中";
  const days = storyDurationDays(story);
  const latestTime = story.latestAt ? formatRelativeZh(story.latestAt) : null;

  return (
    <div className="page-main space-y-5 max-w-4xl">
      <Link href="/ranking" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={14} aria-hidden /> 返回热点榜
      </Link>

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,182,115,0.4)] bg-[var(--signal-dim)] px-3 py-1 text-xs text-[#b7f0d2]">
          <Flame size={14} aria-hidden />
          STORY · 事件故事线
          <span className="rounded-full bg-[var(--signal)]/15 px-2 py-0.5 text-[11px]">{status}</span>
        </div>
        <h1 className="page-title">{story.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
          <span>
            {story.sourceCount} 个精选信源 · {story.reportCount} 篇报道
          </span>
          <span aria-hidden>·</span>
          <span>持续 {days} 天</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={12} aria-hidden /> 最新动态 {latestTime}
          </span>
          {topic?.rank ? (
            <>
              <span aria-hidden>·</span>
              <span className="text-[var(--amber)]">热点榜 第 {topic.rank} 名</span>
            </>
          ) : null}
        </div>
      </header>

      <section className="surface rounded-xl border border-[var(--line)] p-5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">LATEST · 最新进展</p>
        <p className="mt-1 text-sm leading-relaxed">{story.latest}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">{fmtShanghai(story.latestAt)}</p>
      </section>

      <Digest digest={story.digest} />
      <SearchLogicSection view={view} />
      <RecommendationSection view={view} />
      <TimelineSection view={view} />
      <StorylineSection view={view} />

      <footer className="space-y-2 text-xs text-[var(--muted)] leading-relaxed">
        <p className="inline-flex items-center gap-1.5">
          <Radar size={13} aria-hidden /> 数据来源 AIHOT 公开 API（个人非商业 / 面试演示），故事线缓存于{" "}
          <code className="font-mono">data/aihot/stories/</code>，刷新：<code className="font-mono">npm run aihot:sync</code>
        </p>
        <p>
          搜索与热度为本项目本地计算口径；第三方原文版权归原作者。使用规则见{" "}
          <a href="https://aihot.virxact.com/terms" className="text-[var(--signal)] hover:underline" target="_blank" rel="noreferrer">
            aihot.virxact.com/terms
          </a>
          。
        </p>
      </footer>
    </div>
  );
}
