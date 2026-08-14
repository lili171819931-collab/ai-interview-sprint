"use client";

import { Suspense, useEffect, useState } from "react";
import { Code2, FileJson, FlaskConical, RefreshCw, Rocket } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Button, Badge, Input, Select, Textarea, SectionTitle, StatusLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/client";

interface Category { id: string; name: string; icon: string | null }

const EXEC_TYPES = [
  { value: "local", label: "Local（本地 adapter.ts）" },
  { value: "echo", label: "Echo（回显）" },
  { value: "http", label: "HTTP / API" },
  { value: "cli", label: "CLI 命令" },
  { value: "composite", label: "Composite（组合）" },
];

function DeveloperContent() {
  const [tab, setTab] = useState<"create" | "import" | "test" | "scan">("create");
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // create form
  const [form, setForm] = useState({
    name: "", description: "", category: "Other", icon: "🧩", execution_type: "local",
    endpoint: "", command: "", tags: "", risk_level: "low", input_schema: '{\n  "type": "object",\n  "properties": {\n    "query": { "type": "string", "required": true, "description": "查询内容" }\n  },\n  "required": ["query"]\n}',
  });

  // test console
  const [testSkill, setTestSkill] = useState("");
  const [testInput, setTestInput] = useState('{"query":"hello"}');
  const [testOutput, setTestOutput] = useState<{ status: string; output?: unknown; error?: string; duration_ms?: number | null } | null>(null);

  useEffect(() => {
    api<{ categories: Category[] }>("/api/categories").then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  const createSkill = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const manifest = {
        name: form.name, description: form.description, category: form.category, icon: form.icon,
        execution_type: form.execution_type, endpoint: form.endpoint || undefined, command: form.command || undefined,
        tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
        risk_level: form.risk_level, input_schema: JSON.parse(form.input_schema || "{}"),
        permissions: form.execution_type === "http" ? ["external_api", "network"] : ["read"],
        source: "manual",
      };
      const d = await api<{ skill: { id: string; name: string }; message?: string }>("/api/skills/register", {
        method: "POST", body: JSON.stringify(manifest),
      });
      setResult(`✅ ${d.skill.name} 已注册（${d.message ?? "id: " + d.skill.id}）`);
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  };

  const scanSkills = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const d = await api<{ registered: { id: string; name: string }[] }>("/api/skills/scan", { method: "POST" });
      setResult(`✅ 扫描完成，注册/更新 ${d.registered.length} 个 Skill：${d.registered.map((r) => r.name).join("、")}`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const testRun = async () => {
    setBusy(true); setError(null); setTestOutput(null);
    try {
      let input: Record<string, unknown> = {};
      try { input = JSON.parse(testInput); } catch { throw new Error("输入 JSON 格式错误"); }
      const d = await api<{ execution: { status: string; output?: unknown; error?: string; duration_ms?: number | null } }>(`/api/skills/${testSkill}/execute`, {
        method: "POST", body: JSON.stringify({ input, skipApproval: true }),
      });
      setTestOutput(d.execution);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const inputCls = "h-9 w-full rounded-lg border border-border2 bg-surface px-3 text-sm outline-none focus:border-accent/60";
  const tabs = [
    { key: "create" as const, label: "创建 Skill", icon: Code2 },
    { key: "import" as const, label: "Manifest 导入", icon: FileJson },
    { key: "test" as const, label: "测试控制台", icon: FlaskConical },
    { key: "scan" as const, label: "自动扫描", icon: RefreshCw },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Developer Center</h1>
        <p className="text-xs text-subtle">新 Skill 接入平台的标准方式：注册后自动进入 Registry / 搜索 / Agent Tool Registry，无需开发页面</p>
      </div>

      <div className="mt-4 flex gap-1.5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${tab === t.key ? "bg-accent text-white" : "text-muted hover:bg-surface hover:text-fg"}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "create" && (
          <Card className="max-w-2xl p-5">
            <SectionTitle sub="填写基本信息，注册后立即可用">创建新 Skill</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs text-muted">名称 *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如 TikTok Trend Scanner" /></div>
              <div><label className="mb-1 block text-xs text-muted">图标</label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">描述 *</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="一句话描述这个能力" /></div>
              <div><label className="mb-1 block text-xs text-muted">分类</label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full">{categories.map((c) => <option key={c.id} value={c.name}>{c.icon ?? ""} {c.name}</option>)}</Select>
              </div>
              <div><label className="mb-1 block text-xs text-muted">Tags（逗号分隔）</label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="trend, research" /></div>
              <div><label className="mb-1 block text-xs text-muted">执行类型</label>
                <Select value={form.execution_type} onChange={(e) => setForm({ ...form, execution_type: e.target.value })} className="w-full">{EXEC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
              </div>
              <div><label className="mb-1 block text-xs text-muted">风险等级</label>
                <Select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })} className="w-full">
                  <option value="low">低风险</option><option value="medium">中风险</option><option value="high">高风险（需审批）</option><option value="critical">严重风险（需审批）</option>
                </Select>
              </div>
              {(form.execution_type === "http" || form.execution_type === "api") && (
                <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">Endpoint URL</label><Input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} placeholder="https://api.example.com/..." /></div>
              )}
              {form.execution_type === "cli" && (
                <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">命令模板（{"{{key}}"} 占位符）</label><Input value={form.command} onChange={(e) => setForm({ ...form, command: e.target.value })} placeholder="echo {{query}}" /></div>
              )}
              <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">Input Schema (JSON Schema)</label><Textarea value={form.input_schema} onChange={(e) => setForm({ ...form, input_schema: e.target.value })} rows={7} className="code text-xs" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={createSkill} disabled={busy || !form.name}>{busy ? <Spinner className="h-3.5 w-3.5" /> : <Rocket className="h-4 w-4" />} 注册 Skill</Button>
              {error && <span className="text-xs text-danger">{error}</span>}
            </div>
            {result && <pre className="code mt-3 rounded-lg border border-accent2/30 bg-accent2/5 p-3 text-xs text-accent2">{result}</pre>}
          </Card>
        )}

        {tab === "import" && (
          <Card className="max-w-3xl p-5">
            <SectionTitle sub="粘贴标准 Skill Manifest，系统自动分类、打 Tag、建立搜索索引并加入 Agent Tool Registry">Manifest 导入</SectionTitle>
            <Textarea
              defaultValue={JSON.stringify({
                name: "My New Skill", version: "1.0.0", description: "…", category: "Productivity",
                tags: ["my", "skill"], execution_type: "echo",
                input_schema: { type: "object", properties: { message: { type: "string", required: true } }, required: ["message"] },
                permissions: ["read"], risk_level: "low",
              }, null, 2)}
              rows={14} className="code text-xs"
              onChange={(e) => { (window as unknown as Record<string, string>)["__manifest"] = e.target.value; }}
            />
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={async () => {
                  setBusy(true); setError(null); setResult(null);
                  try {
                    const raw = (window as unknown as Record<string, string>)["__manifest"] ?? "";
                    const manifest = JSON.parse(raw);
                    const d = await api<{ skill: { name: string }; message?: string }>("/api/skills/register", { method: "POST", body: JSON.stringify(manifest) });
                    setResult(`✅ ${d.skill.name} 已导入（${d.message ?? ""}）`);
                  } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
                }}
                disabled={busy}
              >{busy ? <Spinner className="h-3.5 w-3.5" /> : <FileJson className="h-4 w-4" />} 导入并注册</Button>
              {error && <span className="text-xs text-danger">{error}</span>}
            </div>
            {result && <pre className="code mt-3 rounded-lg border border-accent2/30 bg-accent2/5 p-3 text-xs text-accent2">{result}</pre>}
          </Card>
        )}

        {tab === "test" && (
          <Card className="max-w-3xl p-5">
            <SectionTitle sub="选择 Skill 并直接执行，验证输入输出">测试控制台</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Skill</label>
                <SkillPicker value={testSkill} onChange={setTestSkill} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">输入 JSON</label>
                <Textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} rows={3} className="code text-xs" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button onClick={testRun} disabled={busy || !testSkill}>{busy ? <Spinner className="h-3.5 w-3.5" /> : <FlaskConical className="h-4 w-4" />} 执行</Button>
              {error && <span className="text-xs text-danger">{error}</span>}
            </div>
            {testOutput && (
              <div className="mt-4">
                <div className="mb-2"><StatusLabel status={testOutput.status} /></div>
                <pre className={`code max-h-80 overflow-auto rounded-lg border p-3 text-xs ${testOutput.status === "failed" ? "border-danger/30 bg-danger/5 text-danger" : "border-accent2/30 bg-accent2/5 text-accent2"}`}>
                  {JSON.stringify(testOutput.output ?? testOutput.error, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        )}

        {tab === "scan" && (
          <Card className="max-w-2xl p-5">
            <SectionTitle sub="扫描 skills/ 目录下的 skill.json，自动注册或更新所有本地 Skill 包">自动扫描</SectionTitle>
            <p className="text-sm text-muted">
              每个 <code className="code">skills/&lt;name&gt;/skill.json</code> + <code className="code">adapter.ts</code> 是一个 Skill 包。
              运行扫描后，新 Skill 会自动进入 Registry、分类、Tag、搜索索引与 Agent Tool Registry。
            </p>
            <div className="mt-3">
              <Button onClick={scanSkills} disabled={busy}>{busy ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-4 w-4" />} 立即扫描</Button>
              {error && <span className="ml-2 text-xs text-danger">{error}</span>}
            </div>
            {result && <pre className="code mt-3 rounded-lg border border-accent2/30 bg-accent2/5 p-3 text-xs text-accent2">{result}</pre>}
          </Card>
        )}
      </div>
    </div>
  );
}

function SkillPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api<{ skills: { id: string; name: string }[] }>("/api/skills?limit=200").then((d) => setSkills(d.skills)).catch(() => {});
  }, []);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
      <option value="">选择 Skill…</option>
      {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </Select>
  );
}

export default function DeveloperPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-muted">加载中…</div>}>
        <DeveloperContent />
      </Suspense>
    </AppShell>
  );
}
