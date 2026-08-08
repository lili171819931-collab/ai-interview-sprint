import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { recomputeClaim } from "@/server/pipeline/claim-service";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await ctx.params;

  const claim = await prisma.claim.findUnique({
    where: { id },
    include: { invoices: true, attachments: true, user: true },
  });
  if (!claim) return NextResponse.json({ error: "不存在" }, { status: 404 });
  if (user.role === "employee" && claim.userId !== user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  return NextResponse.json(claim);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.claim.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "不存在" }, { status: 404 });

  if (body.action === "submit") {
    if (existing.status !== "draft") {
      return NextResponse.json({ error: "仅草稿可提交" }, { status: 400 });
    }
    await recomputeClaim(id);
    const updated = await prisma.claim.update({
      where: { id },
      data: { status: "submitted" },
      include: { invoices: true, user: true },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "decide") {
    if (user.role === "employee") {
      return NextResponse.json({ error: "无审批权限" }, { status: 403 });
    }
    const decision = body.decision === "approved" ? "approved" : "rejected";
    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: decision,
        rejectionReason: decision === "rejected" ? String(body.reason ?? "不符合制度") : null,
      },
      include: { invoices: true, user: true },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "rework") {
    // Mode F: clone rejected to draft
    if (existing.status !== "rejected") {
      return NextResponse.json({ error: "仅已驳回可重提" }, { status: 400 });
    }
    const full = await prisma.claim.findUnique({
      where: { id },
      include: { invoices: true },
    });
    if (!full) return NextResponse.json({ error: "不存在" }, { status: 404 });

    const cloned = await prisma.claim.create({
      data: {
        userId: full.userId,
        title: `${full.title}（重提）`,
        periodStart: full.periodStart,
        periodEnd: full.periodEnd,
        purpose: full.purpose,
        modesJson: JSON.stringify(["F", ...JSON.parse(full.modesJson || "[]")]),
        cityTier: full.cityTier,
        entertainGuests: full.entertainGuests,
        projectCode: full.projectCode,
        status: "draft",
        rejectionReason: `基于驳回单 ${full.id}：${full.rejectionReason ?? ""}`,
      },
    });

    for (const inv of full.invoices) {
      await prisma.invoice.create({
        data: {
          claimId: cloned.id,
          invoiceType: inv.invoiceType,
          invoiceCode: inv.invoiceCode,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          sellerName: inv.sellerName,
          sellerTaxId: inv.sellerTaxId,
          buyerName: inv.buyerName,
          buyerTaxId: inv.buyerTaxId,
          amountExclTax: inv.amountExclTax,
          taxAmount: inv.taxAmount,
          amountInclTax: inv.amountInclTax,
          primaryCategory: inv.primaryCategory,
          secondaryCategory: inv.secondaryCategory,
          confidence: inv.confidence,
          notes: inv.notes,
          suggestedClaimAmount: inv.amountInclTax,
        },
      });
    }
    const recomputed = await recomputeClaim(cloned.id);
    return NextResponse.json(recomputed);
  }

  if (existing.status !== "draft") {
    return NextResponse.json({ error: "已锁定，不可编辑" }, { status: 400 });
  }

  const updated = await prisma.claim.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      purpose: body.purpose ?? existing.purpose,
      periodStart: body.periodStart ?? existing.periodStart,
      periodEnd: body.periodEnd ?? existing.periodEnd,
      modesJson: body.modes ? JSON.stringify(body.modes) : existing.modesJson,
      cityTier: body.cityTier !== undefined ? body.cityTier : existing.cityTier,
      entertainGuests:
        body.entertainGuests !== undefined ? Number(body.entertainGuests) : existing.entertainGuests,
    },
  });
  const recomputed = await recomputeClaim(updated.id);
  return NextResponse.json(recomputed);
}
