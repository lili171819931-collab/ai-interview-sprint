"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { ToolRecord } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

export function ComparePicker({ tools }: { tools: ToolRecord[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const [selected, setSelected] = useState<string[]>(initial.slice(0, 4));
  const [pending, startTransition] = useTransition();

  const byCategory = useMemo(() => {
    const map = new Map<string, ToolRecord[]>();
    for (const t of tools) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [tools]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function apply() {
    startTransition(() => {
      const qs = selected.length ? `?ids=${selected.join(",")}` : "";
      router.push(`/compare${qs}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          勾选 2–4 款（同品类更有意义）。已选 {selected.length}/4
        </p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={selected.length < 2 || pending}
          onClick={apply}
        >
          {pending ? "更新中…" : "生成对比"}
        </button>
      </div>

      {[...byCategory.entries()].map(([cat, list]) => (
        <section key={cat}>
          <h3 className="display text-base mb-2 text-[var(--muted)]">
            {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {list.map((t) => {
              const on = selected.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`flex items-start gap-3 border px-3 py-3 cursor-pointer transition-colors ${
                    on
                      ? "border-[var(--signal)] bg-[var(--signal-dim)]"
                      : "border-[var(--line)] hover:border-[rgba(43,182,115,0.4)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(t.id)}
                    className="mt-1 accent-[var(--signal)]"
                  />
                  <span>
                    <span className="block font-medium">{t.name}</span>
                    <span className="block text-xs text-[var(--muted)] mt-0.5">{t.oneLiner}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
