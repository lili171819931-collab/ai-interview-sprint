import Link from "next/link";
import { notFound } from "next/navigation";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { IconChip } from "@/components/IconChip";
import { ToolSourceChain } from "@/components/viz/DataChain";
import { getBundleView, getToolById, getTools } from "@/lib/data";
import {
  AUDIENCE_LABELS,
  CATEGORY_LABELS,
  SCORE_LABELS,
  type ScoreKey,
} from "@/lib/types";
import { CATEGORY_ICONS, iconForIntegration } from "@/components/icons";
import { averageScore, COMPARE_KEYS } from "@/lib/compare";

export function generateStaticParams() {
  return getTools().map((t) => ({ id: t.id }));
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = getToolById(id);
  if (!tool) notFound();
  const { freshness, lastUpdatedDate } = getBundleView();
  const avg = averageScore(tool);
  const strongest = [...COMPARE_KEYS].sort((a, b) => tool.scores[b] - tool.scores[a])[0];
  const weakest = [...COMPARE_KEYS].sort((a, b) => tool.scores[a] - tool.scores[b])[0];

  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <Link href="/tools" className="hover:text-[var(--signal)]">
            目录
          </Link>
          <span>/</span>
          <span>{tool.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display text-3xl sm:text-4xl font-semibold">{tool.name}</h1>
          <IconChip icon={CATEGORY_ICONS[tool.category]} label={CATEGORY_LABELS[tool.category]} />
          <span className="tag">{tool.vendor}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tool.integration.map((int) => (
            <IconChip key={int} icon={iconForIntegration(int)} label={int} />
          ))}
        </div>
        <p className="text-lg text-[var(--muted)] max-w-3xl">{tool.oneLiner}</p>
        <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
      </div>

      <section className="grid sm:grid-cols-3 gap-3">
        <div className="metric-card p-4">
          <p className="text-xs text-[var(--muted)]">综合均分</p>
          <p className="display text-4xl text-[var(--signal)] mt-1">{avg.toFixed(1)}</p>
        </div>
        <div className="metric-card p-4">
          <p className="text-xs text-[var(--muted)]">最强维度</p>
          <p className="display text-2xl text-[#d7ccff] mt-2">{SCORE_LABELS[strongest]}</p>
        </div>
        <div className="warning-card p-4">
          <p className="text-xs text-[var(--amber)]">重点核对</p>
          <p className="display text-2xl mt-2">{SCORE_LABELS[weakest]}</p>
        </div>
      </section>

      <section className="insight-card p-5">
        <p className="text-xs text-[#d7ccff] mb-2">本工具结论</p>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          <span className="text-[var(--signal)] font-medium">{tool.name}</span>
          更适合关注「{SCORE_LABELS[strongest]}」的场景；正式采用前请重点核对
          <span className="text-[var(--amber)] font-medium"> {SCORE_LABELS[weakest]} </span>
          与数据来源链。
        </p>
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="surface p-5 space-y-4">
          <h2 className="display text-xl font-semibold">功能介绍</h2>
          <p className="leading-relaxed text-[var(--text)]/90">{tool.description}</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {tool.capabilities.map((c) => (
              <li key={c} className="text-sm border border-[var(--line)] px-3 py-2">
                {c}
              </li>
            ))}
          </ul>
          <div className="text-sm text-[var(--muted)] space-y-1">
            <p>定价摘要：{tool.pricingSummary}</p>
            <p>受众：{tool.audience.map((a) => AUDIENCE_LABELS[a]).join(" · ")}</p>
            <p>集成：{tool.integration.join(" / ")}</p>
            <p>地区：{tool.regions.join(" / ")}</p>
            {tool.website ? (
              <p>
                官网：{" "}
                <a className="text-[var(--signal)] underline" href={tool.website} target="_blank" rel="noreferrer">
                  {tool.website}
                </a>
              </p>
            ) : null}
            {tool.changelogSummary ? <p>最近变更：{tool.changelogSummary}</p> : null}
          </div>
        </div>

        <div className="surface p-5 space-y-4">
          <h2 className="display text-xl font-semibold">维度评分</h2>
          {(Object.keys(SCORE_LABELS) as ScoreKey[]).map((k) => (
            <div key={k} className="space-y-1">
              <ScoreBar score={tool.scores[k]} label={SCORE_LABELS[k]} />
              {tool.scoreEvidence[k] ? (
                <p className="text-xs text-[var(--muted)]">{tool.scoreEvidence[k]}</p>
              ) : null}
            </div>
          ))}
          <Link
            href={`/compare?ids=${tool.id}`}
            className="btn btn-ghost w-full mt-2"
          >
            加入对比
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="surface p-5">
          <h2 className="display text-xl font-semibold text-[var(--signal)] mb-3">优势</h2>
          <ul className="space-y-2 text-sm leading-relaxed">
            {tool.pros.map((p) => (
              <li key={p} className="border-l-2 border-[var(--signal)] pl-3">
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="surface p-5">
          <h2 className="display text-xl font-semibold text-[var(--amber)] mb-3">劣势</h2>
          <ul className="space-y-2 text-sm leading-relaxed">
            {tool.cons.map((c) => (
              <li key={c} className="border-l-2 border-[var(--amber)] pl-3">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="display text-xl font-semibold mb-3">来源数据链</h2>
        <p className="text-xs text-[var(--muted)] mb-4">按来源等级串联；official 优先。</p>
        <ToolSourceChain sources={tool.sources} />
      </section>
    </div>
  );
}
