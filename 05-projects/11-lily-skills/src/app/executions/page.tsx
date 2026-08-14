"use client";

import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Badge, Select, StatusLabel, EmptyState, SectionTitle } from "@/components/ui";
import { api, fmtDuration, fmtTime } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

interface Execution {
  id: string;
  skill_id: string;
  skill_name: string;
  skill_icon: string | null;
  status: string;
  trigger: string;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  output: Record<string, unknown> | null;
  logs: { level: string; message: string; at: string }[];
}

function ExecutionsContent() {
  const { t } = useI18n();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const q = status ? `?status=${status}` : "";
    api<{ executions: Execution[] }>(`/api/executions${q}`).then((d) => setExecutions(d.executions)).catch(() => setExecutions([]));
  }, [status]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("exec.title")}</h1>
          <p className="text-xs text-subtle">{t("exec.subtitle")}</p>
        </div>
        <div className="ml-auto">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("exec.all_status")}</option>
            <option value="completed">{t("status.completed")}</option>
            <option value="running">{t("status.running")}</option>
            <option value="queued">{t("status.queued")}</option>
            <option value="awaiting_approval">{t("status.awaiting_approval")}</option>
            <option value="failed">{t("status.failed")}</option>
            <option value="cancelled">{t("status.cancelled")}</option>
          </Select>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {executions.length === 0 && <EmptyState title={t("exec.empty")} hint={t("exec.empty_hint")} />}
        {executions.map((e) => (
          <Card key={e.id} className="overflow-hidden">
            <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2">
              <span className="text-xl">{e.skill_icon ?? "🧩"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {e.skill_name}
                  <Badge tone="neutral">{e.trigger}</Badge>
                  <span className="code text-[10px] text-subtle">{e.id.slice(0, 14)}</span>
                </div>
              </div>
              <StatusLabel status={e.status} />
              <span className="w-16 text-right text-[11px] text-subtle">{fmtDuration(e.duration_ms)}</span>
              <span className="w-24 text-right text-[11px] text-subtle">{fmtTime(e.created_at)}</span>
            </button>
            {expanded === e.id && (
              <div className="space-y-3 border-t border-border p-4">
                <SectionTitle>{t("exec.input")}</SectionTitle>
                <pre className="code max-h-40 overflow-auto rounded-lg bg-bg p-3 text-[11px]">{JSON.stringify(e.output ?? e.error ?? t("exec.no_output"), null, 2)}</pre>
                <SectionTitle>{t("exec.logs")}</SectionTitle>
                <div className="space-y-1">
                  {e.logs.map((l, i) => (
                    <div key={i} className="flex gap-2 text-[11px]">
                      <span className={`code ${l.level === "error" ? "text-danger" : l.level === "warn" ? "text-warn" : "text-subtle"}`}>[{l.level}]</span>
                      <span className="text-muted">{l.message}</span>
                    </div>
                  ))}
                  {e.logs.length === 0 && <span className="text-xs text-subtle">{t("exec.no_logs")}</span>}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ExecutionsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-muted">{t("common.loading")}</div>}>
        <ExecutionsContent />
      </Suspense>
    </AppShell>
  );
}
