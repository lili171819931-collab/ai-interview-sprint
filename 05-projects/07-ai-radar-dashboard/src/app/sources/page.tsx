import Link from "next/link";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { IconChip } from "@/components/IconChip";
import { BarChart } from "@/components/viz/charts/BarChart";
import { SOURCE_LEVEL_ICONS } from "@/components/icons";
import { getBundleView } from "@/lib/data";
import { LIVE_SOURCES } from "@/data/live-sources";
import {
  RESEARCH_SOURCES,
  MONITOR_POOL_LABELS,
  researchSourcesByPool,
  type MonitorPool,
} from "@/data/research-sources";
import { ExternalLink, Database, FileJson, Code2, Globe2, Radar } from "lucide-react";

const ASSETS = [
  {
    name: "Daily Bundle",
    type: "本地 JSON",
    path: "data/daily-bundle.json",
    note: "页面事实源（工具、看点、liveFetch）",
    icon: FileJson,
  },
  {
    name: "Live Fetch Report",
    type: "本地 JSON",
    path: "data/live-fetch-report.json",
    note: "最近一次公开源抓取明细",
    icon: FileJson,
  },
  {
    name: "Radar Daily Report",
    type: "本地 JSON",
    path: "data/radar-daily-report.json",
    note: "AI 动态雷达日报（5 监控池信号）",
    icon: Radar,
  },
  {
    name: "Seed 底座",
    type: "源码",
    path: "src/data/seed.ts",
    note: "人工维护的工具事实与七维评分",
    icon: Code2,
  },
  {
    name: "Live Sources Registry",
    type: "源码",
    path: "src/data/live-sources.ts",
    note: "公开 RSS/Atom/Changelog 登记表",
    icon: Code2,
  },
  {
    name: "Research Sources Registry",
    type: "源码",
    path: "src/data/research-sources.ts",
    note: "5 监控池信息源矩阵（可点击站点）",
    icon: Globe2,
  },
  {
    name: "Schema 契约",
    type: "源码",
    path: "src/lib/schema.ts",
    note: "Zod 校验与极端分护栏",
    icon: Database,
  },
];

const POOL_ORDER = Object.keys(MONITOR_POOL_LABELS) as MonitorPool[];

export default function SourcesPage() {
  const { bundle, freshness, lastUpdatedDate } = getBundleView();
  const live = bundle.liveFetch;
  const byId = new Map(live?.items.map((i) => [i.sourceId, i]) ?? []);
  const researchByPool = researchSourcesByPool();

  const ok = live?.successCount ?? 0;
  const fail = live?.failureCount ?? 0;

  return (
    <div className="container py-10 space-y-10">
      <div className="space-y-3">
        <h1 className="display text-3xl font-semibold">数据来源报告</h1>
        <p className="text-[var(--muted)] max-w-2xl leading-relaxed">
          本页审计「数据从哪来、写到哪、是否抓取成功」，并提供全球 AI 情报雷达信息源链接。
          本项目使用 JSON bundle，不伪造数据库连接串。
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="tag tag-signal">日更公开源 {LIVE_SOURCES.length} 路</span>
          <span className="tag">监控池站点 {RESEARCH_SOURCES.length} 个</span>
          <Link href="/radar" className="tag tag-signal hover:opacity-90">
            打开动态雷达日报 →
          </Link>
        </div>
        <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
        <p className="text-sm text-[var(--muted)]">{bundle.methodNote}</p>
      </div>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">数据资产地址</h2>
        <div className="table-scroll surface">
          <table className="compare-table">
            <thead>
              <tr>
                <th>资产</th>
                <th>类型</th>
                <th>路径 / 地址</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {ASSETS.map((a) => (
                <tr key={a.path}>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <a.icon size={14} aria-hidden className="text-[var(--signal)]" />
                      {a.name}
                    </span>
                  </td>
                  <td className="text-sm text-[var(--muted)]">{a.type}</td>
                  <td>
                    <code className="text-xs text-[var(--signal)]">{a.path}</code>
                  </td>
                  <td className="text-sm text-[var(--muted)]">{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--muted)]">
          说明：以上为仓库相对路径。运行时 cwd 为项目根目录；无外部 DB host/port/账号。
        </p>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <BarChart
          title="公开源抓取结果"
          unit="路数"
          data={[
            { label: "成功", value: ok, color: "var(--viz-primary)" },
            { label: "失败", value: fail, color: "var(--viz-danger)" },
          ]}
          insight={
            fail === 0
              ? "本轮全部公开源可用，changelog 与看点可信度更高。"
              : `有 ${fail} 路失败已跳过，不影响昨日快照与其他源合并。`
          }
        />
        <div className="paper-block p-5 space-y-3">
          <h2 className="display text-xl font-semibold">可信声明</h2>
          <ul className="text-sm space-y-2 leading-relaxed muted">
            <li>· RSS 只更新 changelog / 看点 / 来源条目，不自动改七维分数。</li>
            <li>· Anthropic 等无官方 RSS 时使用社区镜像，标记 secondary。</li>
            <li>· 校验失败不覆盖 `data/daily-bundle.json`。</li>
            <li>
              · 评分口径见{" "}
              <Link href="/methodology" className="underline">
                口径页
              </Link>
              。
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="display text-xl font-semibold">5 监控池信息源矩阵（可点击）</h2>
          <p className="text-sm text-[var(--muted)] max-w-3xl leading-relaxed">
            模型榜单 / 工具目录 / 新闻快讯 / 论文研究 / 官方发布。这些站点用于交叉验证与日报调研，
            不直接改七维分数；自动抓取仍仅使用下方公开 RSS/Atom/Changelog。详见{" "}
            <Link href="/radar" className="underline">
              动态雷达日报
            </Link>
            、
            <code className="text-[var(--signal)]">docs/12-ai-radar-research-system.md</code>。
          </p>
        </div>
        <div className="space-y-6">
          {POOL_ORDER.map((pool) => (
            <div key={pool} className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {MONITOR_POOL_LABELS[pool]}
                <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                  {researchByPool[pool].length} 个
                </span>
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {researchByPool[pool].map((s) => (
                  <div key={s.id} className="surface px-4 py-3 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <IconChip
                        icon={SOURCE_LEVEL_ICONS[s.level]}
                        label={s.level}
                        tone={s.level === "official" ? "signal" : s.level === "first_hand" ? "signal" : "amber"}
                      />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--signal)] underline break-all inline-flex items-center gap-1"
                    >
                      {s.url}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">{s.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">公开源清单（日更抓取，可点击）</h2>
        <div className="space-y-2">
          {LIVE_SOURCES.map((s) => {
            const item = byId.get(s.id);
            const status = item?.status ?? "fail";
            return (
              <div key={s.id} className="surface px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={status === "ok" ? "tag tag-signal" : "tag tag-amber"}>
                      {status === "ok" ? "ok" : "fail/未知"}
                    </span>
                    <IconChip
                      icon={SOURCE_LEVEL_ICONS[s.level]}
                      label={s.level}
                      tone={s.level === "official" ? "signal" : "amber"}
                    />
                    <span className="font-medium">{s.label}</span>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[var(--signal)] underline break-all inline-flex items-center gap-1"
                  >
                    {s.url}
                    <ExternalLink size={12} aria-hidden />
                  </a>
                  <p className="text-xs text-[var(--muted)]">绑定：{s.toolIds.join(", ")}</p>
                  {item?.title ? (
                    <p className="text-xs text-[var(--text)]/80">最新：{item.title}</p>
                  ) : null}
                  {item?.error ? (
                    <p className="text-xs text-[var(--amber)]">错误：{item.error}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="display text-xl font-semibold">工具 → 来源映射（抽样展开）</h2>
        <div className="space-y-2">
          {bundle.tools.slice(0, 12).map((t) => (
            <details key={t.id} className="surface px-4 py-3">
              <summary className="cursor-pointer font-medium">
                {t.name}{" "}
                <span className="text-xs text-[var(--muted)] font-normal">
                  · {t.sources.length} 条来源
                </span>
              </summary>
              <ul className="mt-3 space-y-2 text-sm">
                {t.sources.map((s, i) => (
                  <li key={`${t.id}-${i}`} className="text-[var(--muted)]">
                    <span className="tag mr-2">{s.level}</span>
                    {s.url ? (
                      <a href={s.url} className="text-[var(--signal)] underline break-all" target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ul>
              <Link href={`/tools/${t.id}`} className="inline-block mt-3 text-xs text-[var(--signal)] underline">
                打开详情
              </Link>
            </details>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)]">
          完整工具列表见{" "}
          <Link href="/tools" className="underline">
            目录
          </Link>
          ；此处展示前 12 条以保持报告可读。
        </p>
      </section>
    </div>
  );
}
