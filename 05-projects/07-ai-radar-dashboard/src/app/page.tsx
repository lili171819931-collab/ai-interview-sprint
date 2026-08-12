import Link from "next/link";
import { ArrowRight, Flame, Search, Sparkles } from "lucide-react";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { RefreshControls } from "@/components/RefreshControls";
import { EventsTopList } from "@/components/intel/EventCard";
import { GlobalDataChain } from "@/components/viz/DataChain";
import { CapabilityMindmap } from "@/components/viz/Mindmap";
import { BarChart } from "@/components/viz/charts/BarChart";
import { categoryCounts, getBundleView } from "@/lib/data";
import { getEventsView, getTopEvents } from "@/lib/intel/events-data";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { IconChip } from "@/components/IconChip";
import { CATEGORY_ICONS } from "@/components/icons";

const CAT_BAR_COLOR: Record<Category, string> = {
  assistant: "var(--viz-cat-assistant)",
  platform: "var(--viz-cat-platform)",
  agent: "var(--viz-cat-agent)",
  vertical: "var(--viz-cat-vertical)",
};

const SEARCH_HINTS = ["代码 Agent", "国内合规", "低成本 API", "视频生成", "企业知识库", "长上下文"];

export default function HomePage() {
  const { bundle, freshness, lastUpdatedDate } = getBundleView();
  const { snapshot, fromFile } = getEventsView();
  const topEvents = getTopEvents(10);
  const counts = categoryCounts(bundle.tools);
  const highlightTools = bundle.highlights
    .map((h) => ({ ...h, tool: bundle.tools.find((t) => t.id === h.toolId) }))
    .filter((h) => h.tool);
  const catKeys = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div>
      <section className="container py-10 lg:py-12 space-y-8">
        <div className="hero-panel px-5 py-8 sm:px-8 lg:px-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,182,115,0.45)] bg-[var(--signal-dim)] px-3 py-1 text-xs text-[#b7f0d2]">
            <Flame size={14} aria-hidden />
            Global Trend Intelligence · 5–10 分钟掌握核心变化
          </div>
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-end">
            <div className="space-y-3">
              <p className="display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02]">
                今日全球热点
              </p>
              <h1 className="text-base sm:text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
                多源采集 → 去重聚类 → TrendScore → AI 解读。不是新闻堆砌，而是事件级情报。
              </h1>
            </div>
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <div className="flex flex-wrap gap-2">
                <span className="tag">{fromFile ? "events 已同步" : "events 缺失"}</span>
                <span className="tag">事件 {snapshot.eventCount}</span>
                <span className="tag">条目 {snapshot.itemCount}</span>
              </div>
              <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
              <RefreshControls defaultMode={freshness === "stale" ? "full" : "quick"} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/trends" className="btn btn-primary">
              趋势雷达 <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href="/hot" className="btn btn-ghost">
              原始平台榜
            </Link>
            <Link href="/radar" className="btn btn-ghost">
              动态雷达日报
            </Link>
            <Link href="/tools" className="btn btn-ghost">
              工具目录
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="display text-2xl font-semibold">🔥 TOP 10</h2>
            <p className="text-xs text-[var(--muted)] max-w-xl">{snapshot.methodNote}</p>
          </div>
          <EventsTopList events={topEvents} />
        </div>
      </section>

      <section className="container pb-14 space-y-6 border-t border-[var(--line)] pt-10">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Sparkles size={14} aria-hidden />
          次级能力 · AI 工具选型看板（保留）
        </div>
        <div className="search-shell p-2 max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-3 flex-1 px-3 py-3 text-[var(--muted)]">
              <Search size={20} aria-hidden />
              <span className="text-sm">搜索 ChatGPT / Cursor / RAG / 企业合规</span>
            </div>
            <Link href="/tools" className="btn btn-ghost shrink-0">
              打开目录
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SEARCH_HINTS.map((hint) => (
            <Link key={hint} href={`/tools?q=${encodeURIComponent(hint)}`} className="tag hover:border-[var(--ai-accent)]">
              {hint}
            </Link>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <GlobalDataChain bundle={bundle} />
          <CapabilityMindmap tools={bundle.tools} />
        </div>
        <div className="surface p-4">
          <BarChart
            title="品类分布"
            unit="个"
            data={catKeys.map((k) => ({
              label: CATEGORY_LABELS[k],
              value: counts[k] ?? 0,
              color: CAT_BAR_COLOR[k],
            }))}
          />
        </div>
        {highlightTools.length ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {highlightTools.slice(0, 4).map((h) => (
              <Link key={h.toolId} href={`/tools/${h.toolId}`} className="surface p-4 hover:border-[rgba(139,92,246,0.4)]">
                <div className="flex items-center gap-2 mb-2">
                  <IconChip icon={CATEGORY_ICONS[h.tool!.category]} label={CATEGORY_LABELS[h.tool!.category]} />
                  <span className="font-medium">{h.tool!.name}</span>
                </div>
                <p className="text-sm text-[var(--muted)] line-clamp-2">{h.note}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
