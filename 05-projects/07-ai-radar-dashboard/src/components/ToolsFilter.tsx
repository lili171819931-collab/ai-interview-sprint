"use client";

import { useMemo, useState } from "react";
import type { Audience, Category, Integration, Region, ToolRecord } from "@/lib/types";
import {
  AUDIENCE_LABELS,
  CATEGORY_LABELS,
} from "@/lib/types";
import { ToolCard } from "@/components/ToolCard";
import { IconChip } from "@/components/IconChip";
import { CATEGORY_ICONS, iconForIntegration } from "@/components/icons";
import { Filter, Search } from "lucide-react";

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

export function ToolsFilter({ tools }: { tools: ToolRecord[] }) {
  const [category, setCategory] = useState<Category | "all">("all");
  const [audience, setAudience] = useState<Audience | "all">("all");
  const [region, setRegion] = useState<Region | "all">("all");
  const [integration, setIntegration] = useState<Integration | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return tools.filter((t) => {
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
  }, [tools, category, audience, region, integration, q]);

  return (
    <div className="space-y-6">
      <div className="surface p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Filter size={16} strokeWidth={2} aria-hidden />
          筛选条件
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-[var(--muted)] space-y-1 block">
            <span className="flex items-center gap-1"><Search size={12} aria-hidden /> 搜索</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="名称 / 能力"
              className="w-full bg-[var(--ink-2)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--signal)]"
            />
          </label>
          <Select
            label="品类"
            value={category}
            onChange={(v) => setCategory(v as Category | "all")}
            options={[
              ["all", "全部"],
              ...Object.entries(CATEGORY_LABELS),
            ]}
          />
          <Select
            label="受众"
            value={audience}
            onChange={(v) => setAudience(v as Audience | "all")}
            options={[
              ["all", "全部"],
              ...Object.entries(AUDIENCE_LABELS),
            ]}
          />
          <Select
            label="地区"
            value={region}
            onChange={(v) => setRegion(v as Region | "all")}
            options={[
              ["all", "全部"],
              ...Object.entries(REGION_LABELS),
            ]}
          />
          <Select
            label="集成"
            value={integration}
            onChange={(v) => setIntegration(v as Integration | "all")}
            options={[
              ["all", "全部"],
              ...Object.entries(INTEGRATION_LABELS),
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory((prev) => (prev === c ? "all" : c))}
              className="focus:outline-none"
            >
              <IconChip
                icon={CATEGORY_ICONS[c]}
                label={CATEGORY_LABELS[c]}
                tone={category === c ? "signal" : "neutral"}
              />
            </button>
          ))}
          {(["api", "ide", "plugin", "private"] as Integration[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIntegration((prev) => (prev === i ? "all" : i))}
              className="focus:outline-none"
            >
              <IconChip
                icon={iconForIntegration(i)}
                label={INTEGRATION_LABELS[i]}
                tone={integration === i ? "signal" : "neutral"}
              />
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">{filtered.length} 个结果</p>
      <div className="surface px-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[var(--muted)]">无匹配工具，试试放宽筛选。</p>
        ) : (
          filtered.map((t, i) => <ToolCard key={t.id} tool={t} index={i} />)
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][] | [string, string][];
}) {
  return (
    <label className="text-xs text-[var(--muted)] space-y-1 block">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--ink-2)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--signal)]"
      >
        {options.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
