import Link from "next/link";
import { ExternalLink, Flame, Radar } from "lucide-react";
import { HotTopicsBoard } from "@/components/HotTopicsBoard";
import { getGlobalHotTopicsView } from "@/lib/global-hot-data";

export default function HotTopicsPage() {
  const { snapshot, fromFile } = getGlobalHotTopicsView();
  const { stats } = snapshot;

  return (
    <div className="container py-10 space-y-10">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(230,179,90,0.45)] bg-[color-mix(in_srgb,var(--amber)_16%,transparent)] px-3 py-1 text-xs text-[#f0d7a8]">
          <Flame size={14} aria-hidden />
          Agent Reach 能力层 · 国内外实时热点
        </div>
        <h1 className="display text-3xl sm:text-4xl font-semibold">实时热点看板</h1>
        <p className="text-[var(--muted)] max-w-3xl leading-relaxed">
          对齐{" "}
          <a
            href={snapshot.agentReachUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--signal)] hover:underline inline-flex items-center gap-1"
          >
            Agent Reach <ExternalLink size={13} aria-hidden />
          </a>
          ：公开聚合（微博/抖音/B站/知乎/头条/小红书）+ RSS（HN/TechCrunch/PH）+
          Agent Reach CLI（V2EX/B站热门/雪球）+ 可选 Exa/OpenCLI。失败源见页脚，不假装全绿。
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag tag-signal">{snapshot.generatedAt}</span>
          <span className="tag">{fromFile ? "已同步 JSON" : "seed 降级"}</span>
          <span className="tag">{snapshot.source}</span>
          <span className="tag">
            源 {stats.sourcesOk}/{stats.sourcesTotal}
          </span>
          <span className="tag">条目 {stats.items}</span>
          <span className="tag">
            国内 {stats.byRegion.国内} · 海外 {stats.byRegion.海外}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">{snapshot.methodNote}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/radar" className="btn btn-ghost inline-flex items-center gap-1">
            <Radar size={16} aria-hidden />
            动态雷达
          </Link>
          <Link href="/pulse" className="btn btn-ghost">
            机会简报
          </Link>
          <Link href="/sources" className="btn btn-primary">
            来源报告
          </Link>
        </div>
      </div>

      <HotTopicsBoard platforms={snapshot.platforms} />

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">数据源状态</h2>
        <div className="overflow-x-auto surface">
          <table className="compare-table w-full text-sm">
            <thead>
              <tr>
                <th>来源</th>
                <th>区域</th>
                <th>模式</th>
                <th>条目</th>
                <th>错误</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.sources.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        s.ok ? "bg-[var(--signal)]" : "bg-[var(--danger,#e26d6d)]"
                      }`}
                      aria-hidden
                    />
                    {s.label}
                  </td>
                  <td>{s.region}</td>
                  <td className="text-[var(--muted)]">{s.mode}</td>
                  <td>{s.hits}</td>
                  <td className="text-[var(--amber)] max-w-xs break-words">{s.error || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          刷新：在项目根执行 <code className="text-[var(--text)]">npm run hot:sync</code>
          （会调用研究仓脚本并写入 <code className="text-[var(--text)]">data/global-hot-topics.json</code>）。
          也可并入 <code className="text-[var(--text)]">npm run data:refresh</code>。
        </p>
      </section>
    </div>
  );
}
