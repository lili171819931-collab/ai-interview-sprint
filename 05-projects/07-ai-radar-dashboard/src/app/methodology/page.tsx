import { FreshnessBadge } from "@/components/FreshnessBadge";
import { getBundleView } from "@/lib/data";
import { SCORE_LABELS } from "@/lib/types";
import { RefreshPipelineFlow } from "@/components/viz/FlowDiagram";

export default function MethodologyPage() {
  const { freshness, lastUpdatedDate, bundle } = getBundleView();
  const live = bundle.liveFetch;

  return (
    <div className="container py-10 space-y-8 max-w-3xl">
      <div className="space-y-3">
        <h1 className="display text-3xl font-semibold">数据口径与更新说明</h1>
        <p className="text-[var(--muted)] leading-relaxed">
          智衡把「主观评测」收成可审计字段：分数必须能指向证据与来源等级；日更拉取公开 RSS/Atom/Changelog，失败不覆盖昨日快照，也不自动改评分。
        </p>
        <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
      </div>

      <section className="surface p-5 space-y-3">
        <h2 className="display text-xl font-semibold">日更怎么跑</h2>
        <ol className="list-decimal pl-5 text-sm leading-relaxed space-y-2 text-[var(--muted)]">
          <li>
            维护 <code className="text-[var(--signal)]">src/data/seed.ts</code> 中的工具事实与评分（人工底座）。
          </li>
          <li>
            在 <code className="text-[var(--signal)]">src/data/live-sources.ts</code> 登记日更公开源；
            在 <code className="text-[var(--signal)]">src/data/research-sources.ts</code> 维护情报雷达站点链接。
          </li>
          <li>
            执行 <code className="text-[var(--signal)]">npm run data:refresh</code>
            （无网可用 <code className="text-[var(--signal)]">npm run data:refresh:offline</code>）。
          </li>
          <li>
            脚本抓取 RSS/Atom/公开 Changelog → 更新 changelog / 今日看点 → Zod 校验 → 原子写入{" "}
            <code className="text-[var(--signal)]">data/daily-bundle.json</code>。
          </li>
          <li>校验失败保留旧快照；单路源失败不影响其他路。</li>
        </ol>
        <p className="text-sm text-[var(--muted)]">当前方法：{bundle.methodNote}</p>
        {live ? (
          <div className="pt-3 border-t border-[var(--line)]">
            <p className="text-xs text-[var(--muted)] mb-2">日更管道（实时状态）</p>
            <RefreshPipelineFlow report={live} />
          </div>
        ) : null}
      </section>

      {live ? (
        <section className="surface p-5 space-y-3">
          <h2 className="display text-xl font-semibold">最近一次公开源抓取</h2>
          <p className="text-sm text-[var(--muted)]">
            {live.fetchedAt}
            {live.offline ? " · 离线模式" : ""} · 成功 {live.successCount} / 失败 {live.failureCount}
          </p>
          <ul className="space-y-2 text-sm">
            {live.items.map((item) => (
              <li
                key={item.sourceId}
                className="border border-[var(--line)] px-3 py-2 flex flex-col gap-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={item.status === "ok" ? "tag tag-signal" : "tag tag-amber"}>
                    {item.status === "ok" ? "ok" : "fail"}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-[var(--muted)] text-xs">
                    → {item.toolIds.join(", ")}
                  </span>
                </div>
                {item.status === "ok" ? (
                  item.url ? (
                    <a
                      href={item.url}
                      className="text-[var(--signal)] underline text-xs break-all"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">{item.title}</span>
                  )
                ) : (
                  <span className="text-xs text-[var(--amber)]">{item.error}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="surface p-5 space-y-3">
        <h2 className="display text-xl font-semibold">评分维度</h2>
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          {Object.entries(SCORE_LABELS).map(([k, label]) => (
            <li key={k}>
              <span className="text-[var(--text)]">{label}</span>
              {k === "cost" ? " — 5 表示更划算（非「更贵」）" : null}
            </li>
          ))}
        </ul>
        <p className="text-sm text-[var(--muted)]">
          日更只改 changelog / 看点 / 来源条目，不自动改七维分数。极端分（1 或 5）不得仅由{" "}
          <code>inferred</code> 支撑。
        </p>
      </section>

      <section className="surface p-5 space-y-3">
        <h2 className="display text-xl font-semibold">来源等级</h2>
        <ul className="text-sm text-[var(--muted)] space-y-1">
          <li>
            <span className="tag mr-2">official</span>官方 RSS / Changelog / 文档
          </li>
          <li>
            <span className="tag mr-2">first_hand</span>一手实测
          </li>
          <li>
            <span className="tag mr-2">secondary</span>可信镜像/综述（如 Anthropic 社区维护 feed）
          </li>
          <li>
            <span className="tag mr-2">inferred</span>推断（限制极端分）
          </li>
        </ul>
      </section>

      <section className="paper-block p-5 space-y-2 text-sm leading-relaxed">
        <p className="font-medium">我们刻意不做的事</p>
        <p className="muted">
          不宣称全球唯一排名；不做需登录的私有后台抓取；不把营销口号写成无对应劣势的「优势」；不因一条 RSS
          自动改评分。对比页给出的是场景建议，不是总冠军奖杯。
        </p>
      </section>
    </div>
  );
}
