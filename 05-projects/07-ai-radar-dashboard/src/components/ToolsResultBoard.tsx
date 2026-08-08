"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { Audience, Category, Integration, Region, ToolRecord } from "@/lib/types";
import { AUDIENCE_LABELS, CATEGORY_LABELS } from "@/lib/types";
import { averageScore } from "@/lib/compare";
import { MiniScoreBars } from "@/components/viz/charts/MiniScoreBars";
import { CATEGORY_ICONS } from "@/components/icons";
import { LayoutList, Table2, Search, X, SlidersHorizontal } from "lucide-react";

const REGION_LABELS: Record<Region, string> = {
  cn: "国内",
  global: "全球",
  restricted: "受限",
};

const INTEGRATION_LABELS: Record<Integration, string> = {
  web: "Web",
  api: "API",
  ide: "IDE",
  plugin: "插件",
  private: "私有化",
};

type SortKey = "avg" | "updated" | "name" | "cost";
type ViewMode = "list" | "table";

const QUICK_TERMS = ["代码 Agent", "国内合规", "低成本 API", "视频生成", "企业知识库", "长上下文"];

export function ToolsResultBoard({ tools }: { tools: ToolRecord[] }) {
  const params = useSearchParams();
  const [category, setCategory] = useState<Category | "all">("all");
  const [audience, setAudience] = useState<Audience | "all">("all");
  const [region, setRegion] = useState<Region | "all">("all");
  const [integration, setIntegration] = useState<Integration | "all">("all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<SortKey>("avg");
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = tools.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (audience !== "all" && !t.audience.includes(audience)) return false;
      if (region !== "all" && !t.regions.includes(region)) return false;
      if (integration !== "all" && !t.integration.includes(integration)) return false;
      if (q.trim()) {
        const s = q.trim().toLowerCase();
        const blob = `${t.name} ${t.vendor} ${t.oneLiner} ${t.capabilities.join(" ")}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "avg") return averageScore(b) - averageScore(a);
      if (sort === "cost") return b.scores.cost - a.scores.cost;
      if (sort === "name") return a.name.localeCompare(b.name, "zh");
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
    return list;
  }, [tools, category, audience, region, integration, q, sort]);

  const activeTags: { key: string; label: string; clear: () => void }[] = [];
  if (category !== "all")
    activeTags.push({ key: "cat", label: CATEGORY_LABELS[category], clear: () => setCategory("all") });
  if (audience !== "all")
    activeTags.push({ key: "aud", label: AUDIENCE_LABELS[audience], clear: () => setAudience("all") });
  if (region !== "all")
    activeTags.push({ key: "reg", label: REGION_LABELS[region], clear: () => setRegion("all") });
  if (integration !== "all")
    activeTags.push({
      key: "int",
      label: INTEGRATION_LABELS[integration],
      clear: () => setIntegration("all"),
    });
  if (q.trim())
    activeTags.push({ key: "q", label: q.trim(), clear: () => setQ("") });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  const cats = Object.keys(CATEGORY_LABELS) as Category[];
  const recommended = useMemo(
    () => ({
      hot: [...tools].sort((a, b) => averageScore(b) - averageScore(a)).slice(0, 4),
      updated: [...tools].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 4),
    }),
    [tools],
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Primary: search + sort + view — Linear/Figma style */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索工具、厂商或能力…"
            className="w-full bg-[var(--ink-2)] border border-[var(--line)] pl-10 pr-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--signal)]"
          />
        </label>
        <div className="flex gap-2 shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-[var(--ink-2)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)]"
            aria-label="排序"
          >
            <option value="avg">均分</option>
            <option value="updated">更新</option>
            <option value="name">名称</option>
            <option value="cost">成本</option>
          </select>
          <div className="flex border border-[var(--line)]">
            <button
              type="button"
              className={`px-2.5 ${view === "list" ? "bg-[var(--viz-primary-dim)] text-[var(--signal)]" : "text-[var(--muted)]"}`}
              onClick={() => setView("list")}
              aria-label="列表"
            >
              <LayoutList size={16} />
            </button>
            <button
              type="button"
              className={`px-2.5 ${view === "table" ? "bg-[var(--viz-primary-dim)] text-[var(--signal)]" : "text-[var(--muted)]"}`}
              onClick={() => setView("table")}
              aria-label="表格"
            >
              <Table2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[var(--muted)]">建议搜索</span>
        {QUICK_TERMS.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => setQ(term)}
            className="tag hover:border-[var(--ai-accent)] hover:text-[#d7ccff]"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Secondary: single-row category segmented control */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="品类">
        <SegBtn active={category === "all"} onClick={() => setCategory("all")} label="全部" />
        {cats.map((c) => {
          const Icon = CATEGORY_ICONS[c];
          return (
            <SegBtn
              key={c}
              active={category === c}
              onClick={() => setCategory((p) => (p === c ? "all" : c))}
              label={CATEGORY_LABELS[c]}
              icon={<Icon size={13} aria-hidden />}
            />
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border transition-colors ${
            moreOpen || audience !== "all" || region !== "all" || integration !== "all"
              ? "border-[var(--signal)] text-[var(--signal)] bg-[var(--signal-dim)]"
              : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <SlidersHorizontal size={13} aria-hidden />
          更多筛选
        </button>
      </div>

      {/* Tertiary: collapsed advanced filters */}
      {moreOpen ? (
        <div className="surface px-3 py-3 flex flex-wrap gap-4 text-xs">
          <FilterGroup
            label="受众"
            value={audience}
            onChange={(v) => setAudience(v as Audience | "all")}
            options={[["all", "不限"], ...Object.entries(AUDIENCE_LABELS)]}
          />
          <FilterGroup
            label="地区"
            value={region}
            onChange={(v) => setRegion(v as Region | "all")}
            options={[["all", "不限"], ...Object.entries(REGION_LABELS)]}
          />
          <FilterGroup
            label="集成"
            value={integration}
            onChange={(v) => setIntegration(v as Integration | "all")}
            options={[["all", "不限"], ...Object.entries(INTEGRATION_LABELS)]}
          />
        </div>
      ) : null}

      {/* Active chips — only when needed */}
      <div className="flex flex-wrap items-center gap-2 min-h-[28px]">
        <span className="text-sm text-[var(--muted)]">{filtered.length} 个结果</span>
        {activeTags.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={t.clear}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-[var(--signal)] text-[var(--signal)] bg-[var(--signal-dim)]"
          >
            {t.label}
            <X size={11} aria-hidden />
          </button>
        ))}
        {activeTags.length > 1 ? (
          <button
            type="button"
            className="text-xs text-[var(--muted)] underline"
            onClick={() => {
              setCategory("all");
              setAudience("all");
              setRegion("all");
              setIntegration("all");
              setQ("");
            }}
          >
            清除
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="surface p-10 text-center text-sm">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-[var(--ai-accent)] bg-[var(--ai-accent-dim)] text-[#d7ccff]">
            <Search size={28} aria-hidden />
          </div>
          <p className="display text-xl font-semibold text-[var(--text)]">没有找到匹配工具</p>
          <p className="mt-2 text-[var(--muted)]">换一个更宽泛的词，或从推荐词开始扫描。</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {QUICK_TERMS.slice(0, 4).map((term) => (
              <button key={term} type="button" className="tag tag-signal" onClick={() => setQ(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : view === "list" ? (
        <div className="space-y-4">
          {!q.trim() && category === "all" ? (
            <section className="grid lg:grid-cols-2 gap-3">
              <MiniRecommendation title="高分工具" items={recommended.hot} />
              <MiniRecommendation title="最近更新" items={recommended.updated} />
            </section>
          ) : null}
          <div className="surface divide-y divide-[var(--line)]">
          {filtered.map((t) => {
            const avg = averageScore(t).toFixed(1);
            const on = selected.includes(t.id);
            const Icon = CATEGORY_ICONS[t.category];
            return (
              <div key={t.id} className="px-4 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleSelect(t.id)}
                    className="mt-1.5 accent-[var(--signal)]"
                    aria-label={`选择 ${t.name}`}
                  />
                  <span className="mt-0.5 text-[var(--signal)] shrink-0" aria-hidden>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <Link href={`/tools/${t.id}`} className="display text-base font-semibold hover:text-[var(--signal)]">
                        {t.name}
                      </Link>
                      <span className="text-xs text-[var(--muted)]">{t.vendor}</span>
                      <span className="text-[10px] text-[var(--muted)] uppercase tracking-wide">
                        {CATEGORY_LABELS[t.category]}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-0.5 line-clamp-1">{t.oneLiner}</p>
                    <p className="text-[11px] text-[var(--muted)]/80 mt-1 truncate">
                      {t.capabilities.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 lg:w-48 justify-end">
                  <MiniScoreBars scores={t.scores} />
                  <div className="text-right w-10">
                    <div className="display text-xl text-[var(--signal)] leading-none">{avg}</div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        <div className="table-scroll surface">
          <table className="compare-table">
            <thead>
              <tr>
                <th>选</th>
                <th>工具</th>
                <th>品类</th>
                <th>均分</th>
                <th>成本</th>
                <th>更新</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      className="accent-[var(--signal)]"
                      aria-label={`选择 ${t.name}`}
                    />
                  </td>
                  <td>
                    <Link href={`/tools/${t.id}`} className="font-medium hover:text-[var(--signal)]">
                      {t.name}
                    </Link>
                    <div className="text-xs text-[var(--muted)]">{t.vendor}</div>
                  </td>
                  <td className="text-sm text-[var(--muted)]">{CATEGORY_LABELS[t.category]}</td>
                  <td className="text-[var(--signal)] font-semibold">{averageScore(t).toFixed(1)}</td>
                  <td>{t.scores.cost}/5</td>
                  <td className="text-xs text-[var(--muted)]">{t.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected.length > 0 ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 surface border border-[var(--signal)] px-4 py-3 flex items-center gap-4 shadow-lg">
          <span className="text-sm">已选 {selected.length}/4</span>
          <Link
            href={selected.length >= 2 ? `/compare?ids=${selected.join(",")}` : "/compare"}
            className={`btn btn-primary text-sm ${selected.length < 2 ? "opacity-50 pointer-events-none" : ""}`}
          >
            打开对比图
          </Link>
          <button type="button" className="text-xs text-[var(--muted)] underline" onClick={() => setSelected([])}>
            清空
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MiniRecommendation({ title, items }: { title: string; items: ToolRecord[] }) {
  return (
    <div className="insight-card p-4">
      <p className="text-xs text-[#d7ccff] mb-3">{title}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((t) => (
          <Link key={t.id} href={`/tools/${t.id}`} className="surface px-3 py-2 hover:border-[var(--signal)]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{t.name}</span>
              <span className="text-xs text-[var(--signal)]">{averageScore(t).toFixed(1)}</span>
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-1">{t.oneLiner}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border transition-colors ${
        active
          ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)]"
          : "border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[rgba(232,238,245,0.04)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--muted)] shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={`px-2 py-1 border text-[11px] ${
              value === k
                ? "border-[var(--signal)] text-[var(--signal)]"
                : "border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
