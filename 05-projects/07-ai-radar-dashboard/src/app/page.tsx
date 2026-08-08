import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowRight, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { RadarHero } from "@/components/RadarHero";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { GlobalDataChain } from "@/components/viz/DataChain";
import { CapabilityMindmap } from "@/components/viz/Mindmap";
import { BarChart } from "@/components/viz/charts/BarChart";
import { categoryCounts, getBundleView } from "@/lib/data";
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
  const counts = categoryCounts(bundle.tools);
  const highlightTools = bundle.highlights
    .map((h) => ({ ...h, tool: bundle.tools.find((t) => t.id === h.toolId) }))
    .filter((h) => h.tool);
  const catKeys = Object.keys(CATEGORY_LABELS) as Category[];
  const topCat = [...catKeys].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];
  const live = bundle.liveFetch;
  const recentlyUpdated = [...bundle.tools]
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 4);
  const costFriendly = [...bundle.tools].sort((a, b) => b.scores.cost - a.scores.cost).slice(0, 4);
  const enterpriseReady = [...bundle.tools]
    .filter((t) => t.audience.includes("enterprise"))
    .sort((a, b) => b.scores.compliance - a.scores.compliance)
    .slice(0, 4);

  return (
    <div>
      <section className="container py-10 lg:py-14">
        <div className="hero-panel px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="grid lg:grid-cols-[1.12fr_0.88fr] gap-10 items-center">
            <div className="space-y-6 rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.45)] bg-[var(--ai-accent-dim)] px-3 py-1 text-xs text-[#d7ccff]">
                <Sparkles size={14} aria-hidden />
                每日扫描公开源 · 情报站点可追溯 · 生成 AI 工具选型信号
              </div>
              <div>
                <p className="display hero-title text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[0.98]">
                  发现 AI 工具信号
                </p>
                <h1 className="mt-4 text-lg sm:text-2xl text-[var(--text)] font-medium max-w-2xl leading-snug">
                  追踪平台变化、来源可信度与七维评分，辅助产品经理做更稳的 AI 选型判断。
                </h1>
              </div>

              <div className="search-shell p-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-3 flex-1 px-3 py-3 text-[var(--muted)]">
                    <Search size={20} aria-hidden />
                    <span className="text-sm sm:text-base">
                      搜索 ChatGPT / Cursor / RAG / 视频生成 / 企业合规
                    </span>
                  </div>
                  <Link href="/tools" className="btn btn-primary shrink-0">
                    开始分析 <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {SEARCH_HINTS.map((hint) => (
                  <Link key={hint} href={`/tools?q=${encodeURIComponent(hint)}`} className="tag hover:border-[var(--ai-accent)] hover:text-[#d7ccff]">
                    {hint}
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/radar" className="btn btn-ghost">
                  打开动态雷达日报
                </Link>
                <Link href="/sources" className="btn btn-ghost">
                  查看来源报告
                </Link>
                <Link href="/compare?ids=chatgpt,claude" className="btn btn-ghost">
                  示例对比
                </Link>
              </div>
              <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
            </div>
            <div className="rise rise-delay-2 space-y-5">
              <RadarHero />
              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="收录工具" value={bundle.tools.length} icon={<Zap size={16} />} />
                <MetricCard label="成功源" value={live?.successCount ?? 0} icon={<ShieldCheck size={16} />} />
                <MetricCard label="最近更新" value={recentlyUpdated.length} icon={<Activity size={16} />} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-16 space-y-12">
        <section className="insight-card p-5">
          <p className="text-xs text-[#d7ccff] mb-2">本页结论</p>
          <p className="display text-2xl font-semibold">
            当前收录更偏 <span className="text-[var(--signal)]">{CATEGORY_LABELS[topCat]}</span>，
            建议先按场景筛选，再做同品类对比。
          </p>
          <p className="text-sm text-[var(--muted)] mt-2">
            公开源日更只更新变更摘要与来源，不自动改写分数，保证结论可追溯。
          </p>
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((key, i) => (
            <div
              key={key}
              className={`metric-card px-4 py-5 rise rise-delay-${Math.min(i + 1, 4)}`}
            >
              <IconChip icon={CATEGORY_ICONS[key]} label={CATEGORY_LABELS[key]} className="mb-3" />
              <div className="display text-3xl text-[var(--signal)]">{counts[key] ?? 0}</div>
              <div className="text-xs text-[var(--muted)] mt-1">收录工具</div>
            </div>
          ))}
        </div>

        <section className="grid lg:grid-cols-3 gap-4">
          <RecommendationBlock title="今日推荐" items={recentlyUpdated} tone="signal" />
          <RecommendationBlock title="成本友好" items={costFriendly} tone="amber" />
          <RecommendationBlock title="企业稳妥" items={enterpriseReady} tone="neutral" />
        </section>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="display text-2xl font-semibold">数据来源链</h2>
            <Link href="/sources" className="text-sm text-[var(--signal)] underline">
              来源报告
            </Link>
          </div>
          <GlobalDataChain bundle={bundle} />
        </div>

        <BarChart
          title="四品类收录分布"
          unit="工具数"
          data={catKeys.map((k) => ({
            label: CATEGORY_LABELS[k],
            value: counts[k] ?? 0,
            color: CAT_BAR_COLOR[k],
          }))}
          insight={`当前收录最集中的是「${CATEGORY_LABELS[topCat]}」，对比时建议优先同品类勾选。`}
        />

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="display text-2xl font-semibold">能力地图</h2>
            <span className="text-sm text-[var(--muted)]">节点可点击进入详情</span>
          </div>
          <div className="surface p-4">
            <CapabilityMindmap tools={bundle.tools} />
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="display text-2xl font-semibold">今日看点</h2>
            <span className="text-sm text-[var(--muted)]">共 {bundle.tools.length} 款 · 变更摘要</span>
          </div>
          <ul className="surface divide-y divide-[var(--line)]">
            {highlightTools.map((h, i) => (
              <li key={h.toolId} className={`px-4 py-4 rise rise-delay-${Math.min(i + 1, 4)}`}>
                <Link href={`/tools/${h.toolId}`} className="block hover:text-[var(--signal)]">
                  <div className="font-medium">{h.tool!.name}</div>
                  <p className="text-sm text-[var(--muted)] mt-1">{h.note}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="paper-block px-5 py-5 space-y-2">
          <p className="text-sm font-medium">更新方法</p>
          <p className="muted text-sm leading-relaxed">{bundle.methodNote}</p>
          {bundle.liveFetch ? (
            <p className="muted text-xs">
              公开源抓取：成功 {bundle.liveFetch.successCount} · 失败 {bundle.liveFetch.failureCount}
              {bundle.liveFetch.offline ? " · 离线" : ""} · 明细见{" "}
              <Link href="/methodology" className="underline">
                口径页
              </Link>
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="metric-card p-3">
      <div className="flex items-center justify-between text-[var(--muted)]">
        <span className="text-xs">{label}</span>
        <span className="text-[var(--signal)]">{icon}</span>
      </div>
      <div className="display text-3xl text-[var(--text)] mt-2">{value}</div>
    </div>
  );
}

function RecommendationBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ id: string; name: string; oneLiner: string }>;
  tone: "signal" | "amber" | "neutral";
}) {
  const toneClass =
    tone === "signal" ? "text-[var(--signal)]" : tone === "amber" ? "text-[var(--amber)]" : "text-[#d7ccff]";
  return (
    <div className="surface p-4">
      <h2 className={`display text-lg font-semibold ${toneClass}`}>{title}</h2>
      <div className="mt-3 space-y-3">
        {items.map((tool) => (
          <Link key={tool.id} href={`/tools/${tool.id}`} className="block group">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium group-hover:text-[var(--signal)]">{tool.name}</p>
              <ArrowRight size={14} className="text-[var(--muted)]" aria-hidden />
            </div>
            <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{tool.oneLiner}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
