import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { formatCNY } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";
import { modeLabel } from "@/lib/scenarios";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const claims =
    user.role === "employee"
      ? await prisma.claim.findMany({
          where: { userId: user.id },
          include: { invoices: true },
          orderBy: { updatedAt: "desc" },
        })
      : await prisma.claim.findMany({
          include: { invoices: true, user: true },
          orderBy: { updatedAt: "desc" },
        });

  const draftCount = claims.filter((c) => c.status === "draft").length;
  const submittedCount = claims.filter((c) => c.status === "submitted").length;
  const monthClaimable = claims.reduce((s, c) => s + c.totalClaimable, 0);
  const riskCount = claims.reduce(
    (s, c) => s + c.invoices.filter((i) => i.riskScore >= 60).length,
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--brand)] font-semibold tracking-[0.16em]">票易报</p>
          <h1 className="mt-1 text-3xl font-semibold">工作台</h1>
          <p className="mt-1 text-[var(--muted)] text-sm">
            {user.name} · {user.department} · {user.role === "employee" ? "报销人" : "审批人"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/claims/new"
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-white text-sm font-medium"
          >
            新建报销单
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "草稿", value: String(draftCount) },
          { label: "待审批", value: String(submittedCount) },
          { label: "可提交金额", value: formatCNY(monthClaimable) },
          { label: "高风险票", value: String(riskCount) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4"
          >
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">报销单</h2>
          <Link href="/settings/policy" className="text-sm text-[var(--brand)]">
            制度设置
          </Link>
        </div>

        {claims.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-elevated)] p-10 text-center">
            <p className="font-medium">还没有报销单</p>
            <p className="mt-1 text-sm text-[var(--muted)]">创建一张，上传发票后自动归类与合规检查</p>
            <Link
              href="/claims/new"
              className="mt-4 inline-block rounded-lg bg-[var(--brand)] px-4 py-2 text-white text-sm"
            >
              开始创建
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {claims.map((c) => {
              const modes = JSON.parse(c.modesJson || "[]") as string[];
              const tone = statusTone(c.status);
              return (
                <li key={c.id}>
                  <Link
                    href={`/claims/${c.id}`}
                    className="block rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 hover:border-[var(--brand)] transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {c.periodStart} ~ {c.periodEnd}
                          {"user" in c && c.user ? ` · ${(c as { user: { name: string } }).user.name}` : ""}
                          {" · "}
                          {c.invoices.length} 张票
                        </p>
                        <p className="mt-2 flex flex-wrap gap-1">
                          {modes.map((m) => (
                            <span
                              key={m}
                              className="rounded-full bg-[var(--info-soft)] px-2 py-0.5 text-xs text-[var(--info)]"
                            >
                              {modeLabel(m)}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            background:
                              tone === "ok"
                                ? "var(--ok-soft)"
                                : tone === "danger"
                                  ? "var(--danger-soft)"
                                  : "var(--warn-soft)",
                            color:
                              tone === "ok"
                                ? "var(--ok)"
                                : tone === "danger"
                                  ? "var(--danger)"
                                  : "var(--warn)",
                          }}
                        >
                          {statusLabel(c.status)}
                        </span>
                        <p className="mt-2 text-lg font-semibold">{formatCNY(c.totalClaimable)}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
