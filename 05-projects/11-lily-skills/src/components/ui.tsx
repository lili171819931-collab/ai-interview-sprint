"use client";

import Link from "next/link";
import React from "react";

export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "bg-accent text-white hover:bg-[#8c7df5] disabled:opacity-40",
    secondary: "bg-surface2 text-fg border border-border2 hover:border-[#3a3a44]",
    ghost: "text-muted hover:text-fg hover:bg-surface2",
    danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
  };
  const sizes = { sm: "h-7 px-2.5 text-xs", md: "h-9 px-4 text-sm", lg: "h-11 px-5 text-sm" };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "green" | "warn" | "danger" | "info"; className?: string }) {
  const tones = {
    neutral: "bg-surface2 text-muted border border-border2",
    accent: "bg-accent/15 text-[#b3a6ff] border border-accent/30",
    green: "bg-accent2/10 text-accent2 border border-accent2/30",
    warn: "bg-warn/10 text-warn border border-warn/30",
    danger: "bg-danger/10 text-danger border border-danger/30",
    info: "bg-info/10 text-info border border-info/30",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${tones[tone]} ${className}`}>{children}</span>;
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-accent2",
    running: "bg-info pulse-dot",
    queued: "bg-warn",
    failed: "bg-danger",
    cancelled: "bg-subtle",
    awaiting_approval: "bg-warn pulse-dot",
    healthy: "bg-accent2",
    degraded: "bg-warn",
    down: "bg-danger",
    active: "bg-accent2",
    draft: "bg-warn",
    testing: "bg-info",
    deprecated: "bg-warn",
    archived: "bg-subtle",
    proposed: "bg-info",
    approved: "bg-accent2",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status] ?? "bg-subtle"}`} />;
}

export function StatusLabel({ status }: { status: string }) {
  const labels: Record<string, string> = {
    completed: "已完成",
    running: "执行中",
    queued: "排队中",
    failed: "失败",
    cancelled: "已取消",
    awaiting_approval: "待审批",
    healthy: "健康",
    degraded: "降级",
    down: "不可用",
    active: "启用",
    draft: "草稿",
    testing: "测试中",
    deprecated: "已弃用",
    archived: "已归档",
    proposed: "待确认",
    approved: "已批准",
  };
  const tones: Record<string, "green" | "info" | "warn" | "danger" | "neutral"> = {
    completed: "green",
    running: "info",
    queued: "warn",
    failed: "danger",
    cancelled: "neutral",
    awaiting_approval: "warn",
    active: "green",
    draft: "warn",
    deprecated: "warn",
    archived: "neutral",
    degraded: "warn",
    down: "danger",
    healthy: "green",
  };
  return (
    <Badge tone={tones[status] ?? "neutral"}>
      <StatusDot status={status} />
      {labels[status] ?? status}
    </Badge>
  );
}

export function Input({ className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 w-full rounded-lg border border-border2 bg-surface px-3 text-sm text-fg placeholder:text-subtle outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 ${className}`}
      {...rest}
    />
  );
}

export function Textarea({ className = "", ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-border2 bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-9 rounded-lg border border-border2 bg-surface px-2.5 text-sm text-fg outline-none focus:border-accent/60 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-border2 border-t-accent ${className}`}
    />
  );
}

export function EmptyState({ icon = "🔍", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="text-3xl">{icon}</div>
      <div className="text-sm font-medium text-muted">{title}</div>
      {hint && <div className="max-w-sm text-xs text-subtle">{hint}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">{label}</div>
        {icon && <div className="text-base">{icon}</div>}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-subtle">{sub}</div>}
    </Card>
  );
}

export function LinkButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#8c7df5] ${className}`}>
      {children}
    </Link>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-fg">{children}</h2>
      {sub && <p className="mt-0.5 text-xs text-subtle">{sub}</p>}
    </div>
  );
}
