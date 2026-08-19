"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCNY, centsToYuan } from "@/lib/money";
import { labelOfCategory, labelOfInvoiceType, PRIMARY_CATEGORIES, INVOICE_TYPES } from "@/lib/categories";
import { modeLabel } from "@/lib/scenarios";
import { statusLabel, statusTone } from "@/lib/utils";

type Invoice = {
  id: string;
  invoiceType: string;
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  buyerName: string;
  amountExclTax: number;
  taxAmount: number;
  amountInclTax: number;
  primaryCategory: string;
  secondaryCategory: string;
  complianceStatus: string;
  complianceReasonsJson: string;
  riskScore: number;
  suggestedClaimAmount: number;
  confidence: number;
  verificationStatus: string;
  dedupeStatus: string;
  needsUserInputJson: string;
  notes: string;
};

type Claim = {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  purpose: string;
  modesJson: string;
  status: string;
  totalClaimable: number;
  totalPending: number;
  totalRejected: number;
  totalTax: number;
  rejectionReason: string | null;
  cityTier: string | null;
  entertainGuests: number | null;
  invoices: Invoice[];
  user: { name: string; department: string };
};

export function ClaimDetailClient({
  currentUser,
  claim: initial,
  summary: initialSummary,
}: {
  currentUser: { id: string; role: string; name: string };
  claim: Claim;
  summary: string;
}) {
  const router = useRouter();
  const [claim, setClaim] = useState(initial);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedId, setSelectedId] = useState<string | null>(initial.invoices[0]?.id ?? null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const modes = useMemo(() => JSON.parse(claim.modesJson || "[]") as string[], [claim.modesJson]);
  const selected = claim.invoices.find((i) => i.id === selectedId) ?? null;

  async function refreshFromClaim(next: Claim) {
    setClaim(next);
    const res = await fetch(`/api/claims/${next.id}/export?format=summary`);
    setSummary(await res.text());
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy("upload");
    setMessage("识别中…");
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch(`/api/claims/${claim.id}/attachments`, { method: "POST", body: fd });
    setBusy("");
    if (!res.ok) {
      setMessage("上传失败");
      return;
    }
    const next = await res.json();
    await refreshFromClaim(next);
    setSelectedId(next.invoices[next.invoices.length - 1]?.id ?? null);
    setMessage(`已处理 ${files.length} 个文件（Mock OCR）`);
  }

  async function saveInvoice(patch: Record<string, unknown>) {
    if (!selected) return;
    setBusy("save");
    const res = await fetch(`/api/invoices/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy("");
    if (!res.ok) {
      setMessage("保存失败");
      return;
    }
    const next = await res.json();
    await refreshFromClaim(next);
    setMessage("已保存并重跑合规");
  }

  async function addManual() {
    setBusy("manual");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimId: claim.id,
        invoiceType: "E_VAT",
        invoiceNumber: `MANUAL-${Date.now().toString().slice(-6)}`,
        invoiceDate: claim.periodStart,
        sellerName: "手动录入供应商",
        buyerName: "星河智能科技有限公司",
        amountInclTax: 100,
        taxAmount: 0,
      }),
    });
    setBusy("");
    if (!res.ok) {
      setMessage("手动录入失败");
      return;
    }
    const next = await res.json();
    await refreshFromClaim(next);
    setSelectedId(next.invoices[next.invoices.length - 1]?.id ?? null);
    setMessage("已添加手动票，请在右侧完善字段");
  }

  async function submitClaim() {
    setBusy("submit");
    const res = await fetch(`/api/claims/${claim.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });
    setBusy("");
    if (!res.ok) {
      setMessage("提交失败");
      return;
    }
    const next = await res.json();
    await refreshFromClaim(next);
    setMessage("已提交审批");
  }

  async function decide(decision: "approved" | "rejected") {
    setBusy("decide");
    const res = await fetch(`/api/claims/${claim.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "decide",
        decision,
        reason: decision === "rejected" ? "请补充抬头一致的发票或说明" : undefined,
      }),
    });
    setBusy("");
    if (!res.ok) {
      setMessage("审批失败");
      return;
    }
    const next = await res.json();
    await refreshFromClaim(next);
    setMessage(decision === "approved" ? "已通过" : "已驳回");
  }

  async function rework() {
    setBusy("rework");
    const res = await fetch(`/api/claims/${claim.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rework" }),
    });
    setBusy("");
    if (!res.ok) {
      setMessage("重提失败");
      return;
    }
    const next = await res.json();
    router.push(`/claims/${next.id}`);
  }

  const tone = statusTone(claim.status);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <a href="/" className="text-sm text-[var(--brand)]">
        ← 工作台
      </a>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{claim.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {claim.user.name} · {claim.periodStart} ~ {claim.periodEnd} · {claim.purpose}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {modes.map((m) => (
              <span key={m} className="rounded-full bg-[var(--info-soft)] px-2 py-0.5 text-xs text-[var(--info)]">
                {modeLabel(m)}
              </span>
            ))}
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: tone === "ok" ? "var(--ok-soft)" : tone === "danger" ? "var(--danger-soft)" : "var(--warn-soft)",
                color: tone === "ok" ? "var(--ok)" : tone === "danger" ? "var(--danger)" : "var(--warn)",
              }}
            >
              {statusLabel(claim.status)}
            </span>
          </div>
          {claim.rejectionReason ? (
            <p className="mt-2 text-sm text-[var(--danger)]">驳回原因：{claim.rejectionReason}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
            href={`/api/claims/${claim.id}/export?format=csv`}
          >
            导出 CSV
          </a>
          <a
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
            href={`/api/claims/${claim.id}/export?format=summary`}
          >
            导出摘要
          </a>
          {claim.status === "draft" ? (
            <button
              onClick={submitClaim}
              disabled={!!busy}
              className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm text-white"
            >
              提交审批
            </button>
          ) : null}
          {claim.status === "submitted" && currentUser.role !== "employee" ? (
            <>
              <button onClick={() => decide("approved")} className="rounded-lg bg-[var(--ok)] px-3 py-2 text-sm text-white">
                通过
              </button>
              <button onClick={() => decide("rejected")} className="rounded-lg bg-[var(--danger)] px-3 py-2 text-sm text-white">
                驳回
              </button>
            </>
          ) : null}
          {claim.status === "rejected" ? (
            <button onClick={rework} className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm text-white">
              驳回重提 (F)
            </button>
          ) : null}
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { label: "可提交", value: formatCNY(claim.totalClaimable), soft: "var(--ok-soft)" },
          { label: "待确认", value: formatCNY(claim.totalPending), soft: "var(--warn-soft)" },
          { label: "拒报", value: formatCNY(claim.totalRejected), soft: "var(--danger-soft)" },
          { label: "税额", value: formatCNY(claim.totalTax), soft: "var(--info-soft)" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-[var(--line)] p-4" style={{ background: c.soft }}>
            <p className="text-sm text-[var(--muted)]">{c.label}</p>
            <p className="mt-1 text-xl font-semibold">{c.value}</p>
          </div>
        ))}
      </section>

      {message ? <p className="mt-4 text-sm text-[var(--brand)]">{message}</p> : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          {claim.status === "draft" ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[var(--line)] bg-white p-4">
              <label className="cursor-pointer rounded-lg bg-[var(--brand)] px-3 py-2 text-sm text-white">
                {busy === "upload" ? "识别中…" : "上传发票（图片/PDF）"}
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => onUpload(e.target.files)}
                />
              </label>
              <button onClick={addManual} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                手动录入
              </button>
              <p className="text-xs text-[var(--muted)]">
                文件名含 hotel/train/meal/receipt 可触发不同 Mock 识别结果
              </p>
            </div>
          ) : null}

          {claim.invoices.length === 0 ? (
            <div className="py-12 text-center text-[var(--muted)]">暂无发票，先上传或手动录入</div>
          ) : (
            <ul className="space-y-2">
              {claim.invoices.map((inv) => {
                const t = statusTone(inv.complianceStatus);
                const reasons = safeArr(inv.complianceReasonsJson);
                return (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(inv.id)}
                      className="w-full rounded-xl border px-3 py-3 text-left transition"
                      style={{
                        borderColor: selectedId === inv.id ? "var(--brand)" : "var(--line)",
                        background: selectedId === inv.id ? "var(--brand-soft)" : "white",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{inv.sellerName || "未识别销售方"}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {inv.invoiceDate} · {labelOfInvoiceType(inv.invoiceType)} ·{" "}
                            {labelOfCategory(inv.primaryCategory)}/{inv.secondaryCategory}
                            {" · "}置信度 {(inv.confidence * 100).toFixed(0)}%
                            {inv.dedupeStatus === "duplicate" ? " · 重复" : ""}
                          </p>
                          {reasons[0] ? (
                            <p className="mt-1 text-xs text-[var(--warn)]">{reasons[0]}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{
                              background:
                                t === "ok" ? "var(--ok-soft)" : t === "danger" ? "var(--danger-soft)" : "var(--warn-soft)",
                              color: t === "ok" ? "var(--ok)" : t === "danger" ? "var(--danger)" : "var(--warn)",
                            }}
                          >
                            {statusLabel(inv.complianceStatus)}
                          </span>
                          <p className="mt-1 text-sm font-semibold">{formatCNY(inv.suggestedClaimAmount)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
            <h2 className="font-semibold">审批摘要</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">{summary}</pre>
          </div>

          {selected ? (
            <InvoiceEditor
              key={selected.id}
              invoice={selected}
              locked={claim.status !== "draft"}
              busy={busy === "save"}
              onSave={saveInvoice}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function InvoiceEditor({
  invoice,
  locked,
  busy,
  onSave,
}: {
  invoice: Invoice;
  locked: boolean;
  busy: boolean;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    sellerName: invoice.sellerName,
    buyerName: invoice.buyerName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    invoiceType: invoice.invoiceType,
    primaryCategory: invoice.primaryCategory,
    secondaryCategory: invoice.secondaryCategory,
    amountInclTax: String(centsToYuan(invoice.amountInclTax)),
    taxAmount: String(centsToYuan(invoice.taxAmount)),
    notes: invoice.notes,
  });

  const reasons = safeArr(invoice.complianceReasonsJson);
  const needs = safeArr(invoice.needsUserInputJson);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
      <h2 className="font-semibold">票据详情</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        验真状态：{invoice.verificationStatus} · 风险分 {invoice.riskScore}
      </p>

      {reasons.length ? (
        <ul className="mt-3 space-y-1 rounded-lg bg-[var(--warn-soft)] p-3 text-xs text-[var(--warn)]">
          {reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      ) : null}
      {needs.length ? (
        <p className="mt-2 text-xs text-[var(--danger)]">待补：{needs.join("、")}</p>
      ) : null}

      <div className="mt-4 grid gap-2 text-sm">
        {(
          [
            ["sellerName", "销售方"],
            ["buyerName", "购买方"],
            ["invoiceNumber", "发票号码"],
            ["invoiceDate", "开票日期"],
            ["amountInclTax", "价税合计(元)"],
            ["taxAmount", "税额(元)"],
            ["secondaryCategory", "二级科目"],
            ["notes", "备注"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-[var(--muted)]">{label}</span>
            <input
              disabled={locked}
              className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5 disabled:bg-[#f0eee8]"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-[var(--muted)]">票种</span>
          <select
            disabled={locked}
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5"
            value={form.invoiceType}
            onChange={(e) => setForm((f) => ({ ...f, invoiceType: e.target.value }))}
          >
            {INVOICE_TYPES.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[var(--muted)]">一级科目</span>
          <select
            disabled={locked}
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5"
            value={form.primaryCategory}
            onChange={(e) => setForm((f) => ({ ...f, primaryCategory: e.target.value }))}
          >
            {PRIMARY_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!locked ? (
        <button
          disabled={busy}
          onClick={() => onSave(form)}
          className="mt-4 w-full rounded-lg bg-[var(--brand)] py-2 text-sm text-white disabled:opacity-60"
        >
          {busy ? "保存中…" : "保存并重跑合规"}
        </button>
      ) : null}
    </div>
  );
}

function safeArr(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
