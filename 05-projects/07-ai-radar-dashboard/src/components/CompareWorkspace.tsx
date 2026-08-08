"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ToolRecord } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CompareModal } from "@/components/CompareModal";
import { CATEGORY_ICONS } from "@/components/icons";
import { IconChip } from "@/components/IconChip";

export function CompareWorkspace({
  tools,
  lastUpdatedDate,
}: {
  tools: ToolRecord[];
  lastUpdatedDate: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(initial.length >= 2);

  useEffect(() => {
    const ids = (params.get("ids") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    setSelected(ids);
    if (ids.length >= 2) setOpen(true);
  }, [params]);

  const byCategory = useMemo(() => {
    const map = new Map<string, ToolRecord[]>();
    for (const t of tools) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [tools]);

  const selectedTools = useMemo(
    () => selected.map((id) => tools.find((t) => t.id === id)).filter(Boolean) as ToolRecord[],
    [selected, tools],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function generate() {
    if (selected.length < 2) return;
    const qs = `?ids=${selected.join(",")}`;
    router.replace(`/compare${qs}`, { scroll: false });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      <div className="space-y-6">
        <div className="surface px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            勾选 2–4 款后生成对比图（弹窗呈现）。已选{" "}
            <span className="text-[var(--text)] font-medium">{selected.length}/4</span>
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selected.length < 2}
            onClick={generate}
          >
            生成对比图
          </button>
        </div>

        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTools.map((t) => (
              <button key={t.id} type="button" onClick={() => toggle(t.id)}>
                <IconChip
                  icon={CATEGORY_ICONS[t.category]}
                  label={t.name}
                  tone="signal"
                />
              </button>
            ))}
          </div>
        ) : null}

        {[...byCategory.entries()].map(([cat, list]) => (
          <section key={cat} className="space-y-2">
            <h3 className="text-sm text-[var(--muted)] font-medium">
              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                    <span className="min-w-0">
                      <span className="block font-medium truncate">{t.name}</span>
                      <span className="block text-xs text-[var(--muted)] mt-0.5 line-clamp-2">
                        {t.oneLiner}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <CompareModal
        open={open}
        tools={selectedTools}
        onClose={closeModal}
        lastUpdatedDate={lastUpdatedDate}
      />
    </>
  );
}
