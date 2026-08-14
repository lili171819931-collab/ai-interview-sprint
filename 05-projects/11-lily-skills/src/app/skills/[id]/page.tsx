"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Play, Star, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Badge, Button, Input, Textarea, StatusLabel, Spinner, SectionTitle } from "@/components/ui";
import { api, fmtDuration, fmtTime } from "@/lib/client";

interface SkillDetail {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string | null;
  author: string;
  status: string;
  execution_type: string;
  risk_level: string;
  health_status: string;
  usage_count: number;
  success_count: number;
  failure_count: number;
  last_used_at: string | null;
  ai_description: string | null;
  input_schema: string;
  output_schema: string;
  permissions_list: string[];
  tags: string[];
  use_cases: string[];
  examples: string[];
  category: { name: string; icon: string | null } | null;
  source: string;
  endpoint: string | null;
  command: string | null;
  created_at: string;
}

interface Execution {
  id: string;
  status: string;
  output: Record<string, unknown> | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  logs: { level: string; message: string; at: string }[];
}

function DetailContent() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [execution, setExecution] = useState<Execution | null>(null);
  const [running, setRunning] = useState(false);
  const [faved, setFaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [related, setRelated] = useState<{ id: string; name: string; icon: string | null }[]>([]);

  useEffect(() => {
    api<{ skill: SkillDetail }>(`/api/skills/${params.id}`).then((d) => {
      setSkill(d.skill);
      const schema = JSON.parse(d.skill.input_schema || "{}");
      const init: Record<string, string> = {};
      for (const [k, v] of Object.entries(schema.properties ?? {})) {
        const prop = v as { type?: string };
        if (prop.type === "number") init[k] = "";
        else if (prop.type === "boolean") init[k] = "false";
        else init[k] = "";
      }
      setInputs(init);
    }).catch(() => setError("Skill 不存在"));
    api<{ favorite: boolean } | { skills: never[] }>("/api/skills?favorite=true").then(() => {}).catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (skill) {
      api<{ skill: SkillDetail }>(`/api/skills/${params.id}`).then((d) => setSkill(d.skill));
      api<{ results: { skill: { id: string; name: string; icon: string | null } }[] }>(`/api/search?q=${encodeURIComponent(skill.name)}&limit=4`)
        .then((d) => setRelated(d.results.filter((r) => r.skill.id !== skill.id).map((r) => r.skill)))
        .catch(() => {});
    }
  }, [params.id, execution?.id]);

  const run = async (skipApproval = false) => {
    if (!skill) return;
    setRunning(true);
    setError(null);
    setExecution(null);
    try {
      const schema = JSON.parse(skill.input_schema || "{}");
      const input: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(inputs)) {
        const prop = (schema.properties ?? {})[k] as { type?: string } | undefined;
        if (prop?.type === "number") input[k] = v === "" ? undefined : Number(v);
        else if (prop?.type === "boolean") input[k] = v === "true";
        else input[k] = v;
      }
      const d = await api<{ execution: Execution; requiresApproval: boolean }>(`/api/skills/${skill.id}/execute`, {
        method: "POST",
        body: JSON.stringify({ input, skipApproval }),
      });
      setExecution(d.execution);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  if (error && !skill) return <AppShell><div className="p-10 text-center text-sm text-muted">{error}</div></AppShell>;
  if (!skill) return <AppShell><div className="p-10 text-center text-sm text-muted">加载中…</div></AppShell>;

  const schema = JSON.parse(skill.input_schema || "{}");
  const outputSchema = JSON.parse(skill.output_schema || "{}");

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/skills" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"><ArrowLeft className="h-3.5 w-3.5" /> 返回 Skills</Link>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface2 text-3xl">{skill.icon ?? "🧩"}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{skill.name}</h1>
              <Badge tone="accent">v{skill.version}</Badge>
              <StatusLabel status={skill.status} />
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted">{skill.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
              <Badge tone="accent">{skill.category?.icon ?? ""} {skill.category?.name ?? "未分类"}</Badge>
              {skill.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {riskText(skill.risk_level)}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {skill.usage_count} 次使用 · 最近 {fmtTime(skill.last_used_at)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => api("/api/favorites", { method: "POST", body: JSON.stringify({ skillId: skill.id }) }).then(() => setFaved(!faved))}>
              <Star className={`h-3.5 w-3.5 ${faved ? "fill-warn text-warn" : ""}`} /> {faved ? "已收藏" : "收藏"}
            </Button>
            <Button size="sm" onClick={() => run(false)} disabled={running}>
              {running ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} 运行
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {skill.ai_description && (
              <Card className="p-4">
                <SectionTitle>AI 理解</SectionTitle>
                <p className="text-sm leading-relaxed text-muted">{skill.ai_description}</p>
                {skill.use_cases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skill.use_cases.map((u) => <Badge tone="info" key={u}>{u}</Badge>)}
                  </div>
                )}
              </Card>
            )}

            {/* Run panel */}
            <Card className="p-4">
              <SectionTitle>Run Skill</SectionTitle>
              <div className="space-y-3">
                {Object.keys(schema.properties ?? {}).length === 0 && <p className="text-xs text-subtle">该 Skill 无需输入参数。</p>}
                {Object.entries(schema.properties ?? {}).map(([k, v]) => {
                  const prop = v as { type?: string; description?: string };
                  return (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        {k} <span className="text-subtle">({prop.type})</span>
                        {prop.description && <span className="ml-1 text-subtle">— {prop.description}</span>}
                      </label>
                      {prop.type === "boolean" ? (
                        <select value={inputs[k] ?? "false"} onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })} className="h-9 w-full rounded-lg border border-border2 bg-surface px-2.5 text-sm outline-none">
                          <option value="false">false</option><option value="true">true</option>
                        </select>
                      ) : prop.type === "array" ? (
                        <Input value={inputs[k] ?? ""} onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })} placeholder='JSON 数组，如 ["a","b"]' className="font-mono" />
                      ) : (
                        <Input value={inputs[k] ?? ""} onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })} placeholder={prop.description ?? k} className="font-mono" />
                      )}
                    </div>
                  );
                })}
                {skill.execution_type === "http" && <p className="text-[11px] text-warn">⚠ 该 Skill 会请求外部网络：{skill.endpoint}</p>}
                {skill.risk_level === "high" || skill.risk_level === "critical" ? (
                  <p className="text-[11px] text-warn">⚠ 高风险 Skill 执行前需要人工审批。</p>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button onClick={() => run(false)} disabled={running}>
                    {running ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} 执行
                  </Button>
                  {error && <span className="text-xs text-danger">{error}</span>}
                </div>
              </div>
            </Card>

            {/* Execution result */}
            {execution && (
              <Card className="p-4">
                <SectionTitle>执行结果 <StatusLabel status={execution.status} /></SectionTitle>
                {execution.status === "awaiting_approval" ? (
                  <div className="rounded-lg border border-warn/30 bg-warn/5 p-4 text-sm text-warn">
                    该执行需要审批（高风险 / 敏感权限）。
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => api(`/api/executions/${execution.id}/approve`, { method: "POST" }).then((d) => setExecution((d as { execution: Execution }).execution))}>批准并执行</Button>
                      <Button size="sm" variant="ghost" onClick={() => api(`/api/executions/${execution.id}/cancel`, { method: "POST" }).then((d) => setExecution((d as { execution: Execution }).execution))}>取消</Button>
                    </div>
                  </div>
                ) : execution.status === "completed" ? (
                  <pre className="code max-h-96 overflow-auto rounded-lg border border-border2 bg-bg p-3 text-xs text-accent2">{JSON.stringify(execution.output, null, 2)}</pre>
                ) : execution.status === "failed" ? (
                  <pre className="code max-h-96 overflow-auto rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-danger">{execution.error}</pre>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted"><Spinner /> 执行中…</div>
                )}
                <div className="mt-3 text-[11px] text-subtle">
                  耗时 {fmtDuration(execution.duration_ms)} · {fmtTime(execution.created_at)}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <SectionTitle>元数据</SectionTitle>
              <dl className="space-y-2 text-xs">
                <Row k="执行类型" v={<Badge tone="info">{skill.execution_type}</Badge>} />
                <Row k="风险等级" v={<Badge tone={skill.risk_level === "low" ? "green" : skill.risk_level === "medium" ? "warn" : "danger"}>{riskText(skill.risk_level)}</Badge>} />
                <Row k="健康状态" v={<StatusLabel status={skill.health_status} />} />
                <Row k="作者" v={skill.author} />
                <Row k="来源" v={skill.source} />
                <Row k="注册时间" v={fmtTime(skill.created_at)} />
              </dl>
            </Card>
            <Card className="p-4">
              <SectionTitle>权限</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {skill.permissions_list.length ? skill.permissions_list.map((p) => <Badge key={p} tone="neutral">{p}</Badge>) : <span className="text-xs text-subtle">只读</span>}
              </div>
            </Card>
            {related.length > 0 && (
              <Card className="p-4">
                <SectionTitle>相关 Skills</SectionTitle>
                <div className="space-y-2">
                  {related.map((r) => (
                    <Link key={r.id} href={`/skills/${r.id}`} className="flex items-center gap-2 rounded-lg p-2 hover:bg-surface2">
                      <span className="text-base">{r.icon ?? "🧩"}</span>
                      <span className="text-xs">{r.name}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-subtle">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function riskText(risk: string): string {
  return { low: "低风险", medium: "中风险", high: "高风险", critical: "严重风险" }[risk] ?? risk;
}

export default function SkillDetailPage() {
  return (
    <Suspense fallback={<AppShell><div className="p-10 text-center text-sm text-muted">加载中…</div></AppShell>}>
      <DetailContent />
    </Suspense>
  );
}
