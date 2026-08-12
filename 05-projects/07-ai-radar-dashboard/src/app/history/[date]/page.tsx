import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getHistoryDay, readArchiveJson } from "@/lib/history-data";

type Props = { params: Promise<{ date: string }> };

export default async function HistoryDayPage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const day = getHistoryDay(date);
  if (!day) notFound();

  const radar = readArchiveJson<{
    reportDate?: string;
    methodNote?: string;
    signals?: Array<{
      name: string;
      category: string;
      heat: number;
      pmOpportunity?: string;
      sourceUrl?: string;
    }>;
  }>(date, "radar-daily-report.json");

  const hot = readArchiveJson<{
    generatedAt?: string;
    stats?: { items?: number; sourcesOk?: number; sourcesTotal?: number };
    platforms?: Array<{
      name: string;
      region: string;
      items: Array<{ rank: number; title: string; url?: string; heat?: string | number | null }>;
    }>;
  }>(date, "global-hot-topics.json");

  const pulse = readArchiveJson<{
    reportDate?: string;
    buildIdea?: { title?: string; whyNow?: string };
  }>(date, "builder-pulse-daily.json");

  const radarTop = (radar?.signals || []).slice(0, 8);
  const hotPlatforms = (hot?.platforms || []).slice(0, 6);

  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-3">
        <Link href="/history" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">
          <ArrowLeft size={16} aria-hidden /> 返回历史列表
        </Link>
        <h1 className="display text-3xl font-semibold">{date} 报告快照</h1>
        <p className="text-sm text-[var(--muted)]">
          归档时间 {day.archivedAt} · 文件 {day.files.join(" · ")}
        </p>
        <p className="text-xs text-[var(--muted)]">
          路径：<code className="text-[var(--text)]">data/archive/{date}/</code>
        </p>
      </div>

      {pulse?.buildIdea ? (
        <section className="hero-panel px-5 py-6 space-y-2">
          <h2 className="display text-xl font-semibold">当日机会简报</h2>
          <p className="text-lg font-medium">{pulse.buildIdea.title}</p>
          <p className="text-sm text-[var(--muted)]">{pulse.buildIdea.whyNow}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">雷达信号（摘录）</h2>
        {radarTop.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">无雷达归档</p>
        ) : (
          <div className="space-y-2">
            {radarTop.map((s, i) => (
              <div key={`${s.name}-${i}`} className="surface p-3 text-sm space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-medium">{s.name}</span>
                  <span className="tag">{s.category}</span>
                  <span className="tag">热度 {s.heat}</span>
                </div>
                {s.pmOpportunity ? <p className="text-[var(--muted)]">{s.pmOpportunity}</p> : null}
                {s.sourceUrl ? (
                  <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--signal)] inline-flex items-center gap-1">
                    来源 <ExternalLink size={12} aria-hidden />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {radar?.methodNote ? <p className="text-xs text-[var(--muted)]">{radar.methodNote}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">热点平台（摘录）</h2>
        {hotPlatforms.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">无热点归档</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hotPlatforms.map((p) => (
              <div key={p.name} className="surface p-3 space-y-2">
                <h3 className="font-semibold text-sm">
                  {p.name} <span className="text-[var(--muted)] font-normal">· {p.region}</span>
                </h3>
                <ol className="space-y-1.5 text-sm">
                  {p.items.slice(0, 5).map((it) => (
                    <li key={`${p.name}-${it.rank}`} className="flex gap-2">
                      <span className="text-[var(--signal)] w-5">{it.rank}</span>
                      {it.url ? (
                        <a href={it.url} target="_blank" rel="noreferrer" className="hover:text-[var(--signal)] line-clamp-2">
                          {it.title}
                        </a>
                      ) : (
                        <span className="line-clamp-2">{it.title}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
        {hot?.stats ? (
          <p className="text-xs text-[var(--muted)]">
            热点条目 {hot.stats.items ?? "—"} · 源 {hot.stats.sourcesOk}/{hot.stats.sourcesTotal} ·{" "}
            {hot.generatedAt}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/hot" className="btn btn-primary">
          查看今日热点
        </Link>
        <Link href="/radar" className="btn btn-ghost">
          查看今日雷达
        </Link>
      </div>
    </div>
  );
}
