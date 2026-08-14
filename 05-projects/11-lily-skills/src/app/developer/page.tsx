"use client";

import { Suspense, useEffect, useState } from "react";
import { Code2, FileJson, FlaskConical, RefreshCw, Rocket } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Button, Badge, Input, Select, Textarea, SectionTitle, StatusLabel, Spinner } from "@/components/ui";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

interface Category { id: string; name: string; icon: string | null }

const EXEC_TYPES = [
  { value: "local", label: "Local（本地 adapter.ts）" },
  { value: "echo", label: "Echo（回显）" },
  { value: "http", label: "HTTP / API" },
  { value: "cli", label: "CLI 命令" },
  { value: "composite", label: "Composite（组合）" },
];

function DeveloperContent() {
  const { t } = useI18n();
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
    { key: "create" as const, labelKey: "dev.tab.create", icon: Code2 },
    { key: "import" as const, labelKey: "dev.tab.import", icon: FileJson },
    { key: "test" as const, labelKey: "dev.tab.test", icon: FlaskConical },
    { key: "scan" as const, labelKey: "dev.tab.scan", icon: RefreshCw },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("dev.title")}</h1>
        <p className="text-xs text-subtle">{t("dev.subtitle")}</p>
      </div>

      <div className="mt-4 flex gap-1.5">
        {tabs.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${tab === item.key ? "bg-accent text-white" : "text-muted hover:bg-surface hover:text-fg"}`}>
            <item.icon className="h-3.5 w-3.5" /> {t(item.labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "create" && (
          <Card className="max-w-2xl p-5">
            <SectionTitle sub={t("dev.create_sub")}>{t("dev.tab.create")}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs text-muted">{t("dev.name")}</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("dev.name_ph")} /></div>
              <div><label className="mb-1 block text-xs text-muted">{t("dev.icon")}</label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">{t("dev.desc")}</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("dev.desc_ph")} /></div>
              <div><label className="mb-1 block text-xs text-muted">{t("dev.category")}</label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full">{categories.map((c) => <option key={c.id} value={c.name}>{c.icon ?? ""} {c.name}</option>)}</Select>
              </div>
              <div><label className="mb-1 block text-xs text-muted">{t("dev.tags")}</label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="trend, research" /></div>
              <div><label className="mb-1 block text-xs text-muted">{t("dev.exec_type")}</label>
                <Select value={form.execution_type} onChange={(e) => setForm({ ...form, execution_type: e.target.value })} className="w-full">{EXEC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
              </div>
              <div><label className="mb-1 block text-xs text-muted">{t("dev.risk")}</label>
                <Select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })} className="w-full">
                  <option value="low">{t("detail.risk_low")}</option><option value="medium">{t("detail.risk_medium")}</option><option value="high">{t("detail.risk_high")}（{t("common.approve")}）</option><option value="critical">{t("detail.risk_critical")}（{t("common.approve")}）</option>
                </Select>
              </div>
              {(form.execution_type === "http" || form.execution_type === "api") && (
                <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">{t("dev.endpoint")}</label><Input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} placeholder="https://api.example.com/..." /></div>
              )}
              {form.execution_type === "cli" && (
                <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">{t("dev.command")}</label><Input value={form.command} onChange={(e) => setForm({ ...form, command: e.target.value })} placeholder="echo {{query}}" /></div>
              )}
              <div className="sm:col-span-2"><label className="mb-1 block text-xs text-muted">{t("dev.schema")}</label><Textarea value={form.input_schema} onChange={(e) => setForm({ ...form, input_schema: e.target.value })} rows={7} className="code text-xs" /></div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={createSkill} disabled={busy || !form.name}>{busy ? <Spinner className="h-3.5 w-3.5" /> : <Rocket className="h-4 w-4" />} {t("dev.register")}</Button>
              {error && <span className="text-xs text-danger">{error}</span>}
            </div>
            {result && <pre className="code mt-3 rounded-lg border border-accent2/30 bg-accent2/5 p-3 text-xs text-accent2">{result}</pre>}
          </Card>
        )}

        {tab === "import" && (
          <Card className="max-w-3xl p-5">
            <SectionTitle sub={t("dev.import_sub")}>{t("dev.tab.import")}</SectionTitle>
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
              >{busy ? <Spinner className="h-3.5 w-3.5" /> : <FileJson className="h-4 w-4" />} {t("dev.import_btn")}</Button>
              {error && <span className="text-xs text-danger">{error}</span>}
            </div>
            {result && <pre className="code mt-3 rounded-lg border border-accent2/30 bg-accent2/5 p-3 text-xs text-accent2">{result}</pre>}
          </Card>
        )}

        {tab === "test" && (
          <Card className="max-w-3xl p-5">
            <SectionTitle sub={t("dev.test_sub")}>{t("dev.tab.test")}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Skill</label>
                <SkillPicker value={testSkill} onChange={setTestSkill} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{t("dev.input_json")}</label>
                <Textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} rows={3} className="code text-xs" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button onClick={testRun} disabled={busy || !testSkill}>{busy ? <Spinner className="h-3.5 w-3.5" /> : <FlaskConical className="h-4 w-4" />} {t("common.execute")}</Button>
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
            <SectionTitle sub={t("dev.scan_sub")}>{t("dev.tab.scan")}</SectionTitle>
            <p className="text-sm text-muted">{t("dev.scan_desc")}</p>
            <div className="mt-3">
              <Button onClick={scanSkills} disabled={busy}>{busy ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-4 w-4" />} {t("dev.scan_btn")}</Button>
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
  const { t } = useI18n();
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api<{ skills: { id: string; name: string }[] }>("/api/skills?limit=200").then((d) => setSkills(d.skills)).catch(() => {});
  }, []);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
      <option value="">{t("dev.pick_skill")}</option>
      {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </Select>
  );
}

export default function DeveloperPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <Suspense fallback={<div className="p-10 text-center text-sm text-muted">{t("common.loading")}</div>}>
        <DeveloperContent />
      </Suspense>
    </AppShell>
  );
}
