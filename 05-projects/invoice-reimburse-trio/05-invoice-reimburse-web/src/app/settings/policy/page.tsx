import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { formatCNY } from "@/lib/money";

export default async function PolicySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const company = await prisma.companyProfile.findFirst();
  const policy = await prisma.policy.findFirst();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <a href="/" className="text-sm text-[var(--brand)]">
        ← 工作台
      </a>
      <h1 className="mt-3 text-3xl font-semibold">制度设置</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">MVP 只读展示当前合规基线（可后续做成可编辑表单）</p>

      <section className="mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
        <div>
          <p className="text-sm text-[var(--muted)]">公司抬头</p>
          <p className="mt-1 font-medium">{company?.legalName}</p>
          <p className="text-sm text-[var(--muted)]">税号 {company?.taxpayerId}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--muted)]">政策版本</p>
          <p className="mt-1 font-medium">{policy?.version}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[var(--brand-soft)] p-3">
            <p className="text-[var(--muted)]">一线酒店上限</p>
            <p className="mt-1 font-semibold">{formatCNY(policy?.hotelLimitTier1 ?? 0)}/晚</p>
          </div>
          <div className="rounded-xl bg-[var(--brand-soft)] p-3">
            <p className="text-[var(--muted)]">招待人均上限</p>
            <p className="mt-1 font-semibold">{formatCNY(policy?.entertainmentPerCapita ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-[var(--warn-soft)] p-3">
            <p className="text-[var(--muted)]">事前审批阈值</p>
            <p className="mt-1 font-semibold">{formatCNY(policy?.preApprovalThreshold ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-[var(--info-soft)] p-3">
            <p className="text-[var(--muted)]">简称映射</p>
            <p className="mt-1 font-semibold">{company?.aliasJson}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
