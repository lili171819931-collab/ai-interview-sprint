"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Play, Trash2, Pause, GitBranch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Button, Badge, Input, Select, Textarea, StatusLabel, Spinner, EmptyState, SectionTitle } from "@/components/ui";
import { api, fmtTime } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

interface WfNode {
  id: string;
  node_key: string;
  type: string;
  config: Record<string, unknown>;
  edges: string[];
}
interface Workflow { id: string; name: string; description: string | null; icon: string | null; status: string; trigger_type: string; schedule: string | null; nodes: WfNode[] }
interface WfRun { id: string; workflow_name: string; status: string; error: string | null; created_at: string; result: unknown; logs: { node: string; message: string; at: string }[] }

const NODE_TYPES = [
  { type: "trigger", labelKey: "wf.node.trigger", icon: "⚡" },
  { type: "skill", labelKey: "wf.node.skill", icon: "🧩" },
  { type: "ai", labelKey: "wf.node.ai", icon: "🤖" },
  { type: "condition", labelKey: "wf.node.condition", icon: "🔀" },
  { type: "transform", labelKey: "wf.node.transform", icon: "🔧" },
  { type: "human_approval", labelKey: "wf.node.approval", icon: "🛡️" },
  { type: "output", labelKey: "wf.node.output", icon: "📤" },
];

function WorkflowsContent() {
  const params = useParams<{ id?: string }>();
  const { t } = useI18n();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string; input_schema: string }[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [runs, setRuns] = useState<WfRun[]>([]);
  const [newName, setNewName] = useState("");
  const [runInput, setRunInput] = useState('{"platform":"tiktok","topic":"AI Agent","count":3}');
  const [running, setRunning] = useState(false);
  const [activeRun, setActiveRun] = useState<WfRun | null>(null);
  const [nodeSkill, setNodeSkill] = useState<Record<string, string>>({});

  const load = async () => {
    const d = await api<{ workflows: Workflow[] }>("/api/workflows");
    setWorkflows(d.workflows);
    if (params.id) setSelected(d.workflows.find((w) => w.id === params.id) ?? d.workflows[0] ?? null);
    else setSelected((prev) => prev ?? d.workflows[0] ?? null);
  };

  useEffect(() => { load(); }, [params.id]);

  useEffect(() => {
    if (selected) {
      api<{ runs: WfRun[] }>(`/api/workflow-runs?workflowId=${selected.id}`).then((d) => setRuns(d.runs)).catch(() => {});
    }
  }, [selected?.id]);

  useEffect(() => {
    api<{ skills: { id: string; name: string; input_schema: string }[] }>("/api/skills?limit=100").then((d) => setSkills(d.skills)).catch(() => {});
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    const d = await api<{ workflow: Workflow }>("/api/workflows", { method: "POST", body: JSON.stringify({ name: newName, icon: "🔁", triggerType: "manual" }) });
    setNewName("");
    await load();
    setSelected(d.workflow);
  };

  const addNode = (type: string) => {
    if (!selected) return;
    const nodes = [...(selected.nodes ?? [])];
    const key = `${type}_${nodes.length + 1}`;
    const node: WfNode = { id: `node_${Date.now()}`, node_key: key, type, config: type === "skill" ? { skill_id: skills[0]?.id, input: {} } : type === "human_approval" ? { message: "请确认" } : {}, edges: [] };
    if (nodes.length > 0) {
      nodes[nodes.length - 1].edges = [key];
    }
    nodes.push(node);
    saveWorkflow({ ...selected, nodes });
  };

  const saveWorkflow = async (wf: Workflow) => {
    const d = await api<{ workflow: Workflow }>(`/api/workflows/${wf.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: wf.name, description: wf.description, icon: wf.icon, status: wf.status, nodes: wf.nodes }),
    });
    setSelected(d.workflow);
    await load();
  };

  const runWorkflow = async (inputOverride?: string) => {
    if (!selected || running) return;
    setRunning(true);
    setActiveRun(null);
    try {
      let input: Record<string, unknown> = {};
      try { input = JSON.parse(inputOverride ?? runInput); } catch { input = { platform: "tiktok", topic: "AI Agent", count: 3 }; }
      const d = await api<{ run: WfRun }>(`/api/workflows/${selected.id}/run`, { method: "POST", body: JSON.stringify({ input }) });
      setActiveRun(d.run);
      api<{ runs: WfRun[] }>(`/api/workflow-runs?workflowId=${selected.id}`).then((r) => setRuns(r.runs)).catch(() => {});
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const approveRun = async (runId: string) => {
    const d = await api<{ run: WfRun }>(`/api/workflow-runs/${runId}/approve`, { method: "POST" });
    setActiveRun(d.run);
    api<{ runs: WfRun[] }>(`/api/workflow-runs?workflowId=${selected?.id}`).then((r) => setRuns(r.runs)).catch(() => {});
  };

  const deleteWf = async (id: string) => {
    await api(`/api/workflows/${id}`, { method: "DELETE" });
    setSelected(null);
    await load();
  };

  const updateNodeConfig = (nodeKey: string, patch: Record<string, unknown>) => {
    if (!selected) return;
    const nodes = selected.nodes.map((n) => (n.node_key === nodeKey ? { ...n, config: { ...n.config, ...patch } } : n));
    saveWorkflow({ ...selected, nodes });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("wf.title")}</h1>
          <p className="text-xs text-subtle">{t("wf.subtitle")}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("wf.new_ph")} className="w-52" />
          <Button onClick={create}><Plus className="h-4 w-4" /> {t("common.create")}</Button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* List */}
        <div className="space-y-2">
          {workflows.map((w) => (
            <button key={w.id} onClick={() => setSelected(w)} className={`w-full rounded-xl border p-3 text-left ${selected?.id === w.id ? "border-accent/50 bg-surface2" : "border-border bg-surface hover:border-border2"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{w.icon ?? "🔁"}</span>
                <span className="truncate text-sm font-medium">{w.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-subtle">
                <StatusLabel status={w.status} />
                <span>{w.nodes?.length ?? 0} {t("wf.nodes")}</span>
              </div>
            </button>
          ))}
          {workflows.length === 0 && <Card className="p-6 text-center text-xs text-subtle">{t("wf.empty_list")}</Card>}
        </div>

        {/* Builder */}
        {selected ? (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input value={selected.name} onChange={(e) => saveWorkflow({ ...selected, name: e.target.value })} className="w-56" />
                <Select value={selected.status} onChange={(e) => saveWorkflow({ ...selected, status: e.target.value })}>
                  <option value="draft">{t("wf.status.draft")}</option><option value="active">{t("wf.status.active")}</option><option value="archived">{t("wf.status.archived")}</option>
                </Select>
                <div className="ml-auto flex items-center gap-2">
                  <Button size="sm" onClick={() => runWorkflow()} disabled={running}>
                    {running ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {t("common.run")}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteWf(selected.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              {selected.schedule && <div className="mt-2 text-[11px] text-subtle">{t("wf.schedule")}{selected.schedule}</div>}
            </Card>

            {/* Node palette */}
            <div className="flex flex-wrap gap-2">
              {NODE_TYPES.map((node) => (
                <button key={node.type} onClick={() => addNode(node.type)} className="rounded-lg border border-border2 bg-surface px-2.5 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-fg">
                  {node.icon} + {t(node.labelKey)}
                </button>
              ))}
            </div>

            {/* Node canvas (linear) */}
            <Card className="overflow-x-auto p-4">
              <div className="flex min-w-max items-stretch gap-3">
                {(selected.nodes ?? []).map((n, i) => (
                  <div key={n.node_key} className="w-60 shrink-0">
                    <div className="rounded-xl border border-border2 bg-surface2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted">{nodeTypeMeta(n.type).icon} {t(nodeTypeMeta(n.type).labelKey)}</span>
                        <span className="code text-[10px] text-subtle">{n.node_key}</span>
                      </div>
                      {n.type === "skill" && (
                        <div className="mt-2">
                          <Select value={String(n.config.skill_id ?? "")} onChange={(e) => updateNodeConfig(n.node_key, { skill_id: e.target.value })} className="w-full">
                            <option value="">{t("wf.pick_skill")}</option>
                            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </Select>
                        </div>
                      )}
                      {n.type === "human_approval" && (
                        <div className="mt-2">
                          <Input value={String(n.config.message ?? "")} onChange={(e) => updateNodeConfig(n.node_key, { message: e.target.value })} placeholder={t("wf.approval_msg_ph")} className="text-xs" />
                        </div>
                      )}
                      {n.type === "ai" && (
                        <div className="mt-2">
                          <Input value={String(n.config.query ?? "")} onChange={(e) => updateNodeConfig(n.node_key, { query: e.target.value })} placeholder={t("wf.ai_query_ph")} className="text-xs" />
                        </div>
                      )}
                      {n.type === "condition" && (
                        <div className="mt-2 space-y-1.5">
                          <Input value={String(n.config.field ?? "")} onChange={(e) => updateNodeConfig(n.node_key, { field: e.target.value })} placeholder={t("wf.cond_field_ph")} className="text-xs" />
                          <Input value={String(n.config.value ?? "")} onChange={(e) => updateNodeConfig(n.node_key, { value: e.target.value })} placeholder={t("wf.cond_value_ph")} className="text-xs" />
                        </div>
                      )}
                      {n.type === "output" && (
                        <div className="mt-2"><Textarea value={String(n.config.template ?? "")} onChange={(e) => updateNodeConfig(n.node_key, { template: e.target.value })} placeholder="{{output.xxx}}" className="code text-[11px]" rows={2} /></div>
                      )}
                      <div className="mt-2 text-[10px] text-subtle">
                        {n.edges.length > 0 ? `→ ${n.edges.join(", ")}` : "结束"}
                      </div>
                    </div>
                    {i < selected.nodes.length - 1 && <div className="mx-auto h-4 w-px bg-border2" />}
                  </div>
                ))}
                {(selected.nodes ?? []).length === 0 && <div className="py-10 text-center text-xs text-subtle">{t("wf.empty_nodes")}</div>}
              </div>
            </Card>

            {/* Run control */}
            <Card className="p-4">
              <SectionTitle>{t("wf.run_input")}</SectionTitle>
              <div className="flex gap-2">
                <Textarea value={runInput} onChange={(e) => setRunInput(e.target.value)} rows={2} className="code flex-1 text-xs" />
                <Button onClick={() => runWorkflow()} disabled={running} className="self-end">{running ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {t("common.run")}</Button>
              </div>
            </Card>

            {/* Active run */}
            {activeRun && (
              <Card className="p-4">
                <SectionTitle>{t("wf.current_run")} <StatusLabel status={activeRun.status} /></SectionTitle>
                {activeRun.status === "awaiting_approval" ? (
                  <div className="flex items-center gap-3 rounded-lg border border-warn/30 bg-warn/5 p-3 text-xs text-warn">
                    <Pause className="h-4 w-4" /> {t("wf.waiting_approval")}
                    <Button size="sm" onClick={() => approveRun(activeRun.id)}>{t("wf.approve_continue")}</Button>
                  </div>
                ) : activeRun.error ? (
                  <div className="code rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-danger">{activeRun.error}</div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeRun.logs.map((l, i) => (
                    <Badge key={i} tone={l.message.includes("失败") ? "danger" : "neutral"}>{l.node}: {l.message}</Badge>
                  ))}
                </div>
                {activeRun.status === "completed" && (
                  <pre className="code mt-2 max-h-60 overflow-auto rounded-lg border border-accent2/30 bg-bg p-3 text-xs text-accent2">{JSON.stringify(activeRun.result, null, 2)}</pre>
                )}
              </Card>
            )}

            {/* Run history */}
            <div>
              <SectionTitle>{t("wf.history")}</SectionTitle>
              <Card className="divide-y divide-border">
                {runs.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                    <GitBranch className="h-3.5 w-3.5 text-subtle" />
                    <StatusLabel status={r.status} />
                    <span className="code text-subtle">{r.id.slice(0, 12)}</span>
                    <span className="ml-auto text-subtle">{fmtTime(r.created_at)}</span>
                    {r.status === "awaiting_approval" && <Button size="sm" onClick={() => approveRun(r.id)}>{t("common.approve")}</Button>}
                  </div>
                ))}
                {runs.length === 0 && <div className="px-4 py-6 text-center text-xs text-subtle">{t("wf.history_empty")}</div>}
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState icon="🔁" title={t("wf.choose")} />
        )}
      </div>
    </div>
  );
}

function nodeTypeMeta(type: string): { labelKey: string; icon: string } {
  const meta = NODE_TYPES.find((t) => t.type === type);
  return meta ?? { labelKey: `wf.node.${type}`, icon: "•" };
}

export default function WorkflowsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-muted">{t("common.loading")}</div>}>
        <WorkflowsContent />
      </Suspense>
    </AppShell>
  );
}
