import type { Scores } from "@/lib/types";
import { COMPARE_KEYS } from "@/lib/compare";

export function MiniScoreBars({ scores }: { scores: Scores }) {
  return (
    <div className="flex items-end gap-0.5 h-8" aria-hidden="true">
      {COMPARE_KEYS.map((k) => {
        const v = scores[k];
        const h = (v / 5) * 100;
        return (
          <span
            key={k}
            className="w-1.5 rounded-sm bg-[var(--viz-primary)]"
            style={{ height: `${h}%`, opacity: 0.45 + v * 0.1 }}
            title={`${k}: ${v}`}
          />
        );
      })}
    </div>
  );
}
