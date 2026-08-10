import type { LucideIcon } from "lucide-react";

type IconChipProps = {
  icon: LucideIcon;
  label: string;
  tone?: "neutral" | "signal" | "amber";
  className?: string;
};

const toneClass = {
  neutral: "text-[var(--muted)] border-[var(--line)]",
  signal: "text-[var(--signal)] border-[color-mix(in_srgb,var(--signal)_50%,transparent)] bg-[var(--signal-dim)]",
  amber: "text-[var(--amber)] border-[color-mix(in_srgb,var(--amber)_50%,transparent)] bg-[var(--amber-dim)]",
};

export function IconChip({ icon: Icon, label, tone = "neutral", className = "" }: IconChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 border text-xs ${toneClass[tone]} ${className}`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
