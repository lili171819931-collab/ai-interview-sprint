import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { recomputeClaim } from "@/server/pipeline/claim-service";
import { parseYuanInput } from "@/lib/money";
import { classifyHeuristic } from "@/lib/categories";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();

  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { claim: true },
  });
  if (!inv) return NextResponse.json({ error: "不存在" }, { status: 404 });
  if (inv.claim.status !== "draft") {
    return NextResponse.json({ error: "已锁定" }, { status: 400 });
  }

  const amountInclTax =
    body.amountInclTax !== undefined ? parseYuanInput(body.amountInclTax) : inv.amountInclTax;
  const taxAmount = body.taxAmount !== undefined ? parseYuanInput(body.taxAmount) : inv.taxAmount;
  const amountExclTax =
    body.amountExclTax !== undefined
      ? parseYuanInput(body.amountExclTax)
      : amountInclTax - taxAmount;

  let primaryCategory = body.primaryCategory ?? inv.primaryCategory;
  let secondaryCategory = body.secondaryCategory ?? inv.secondaryCategory;
  if (body.sellerName && !body.primaryCategory) {
    const c = classifyHeuristic({
      sellerName: String(body.sellerName),
      purpose: inv.claim.purpose,
      invoiceType: body.invoiceType ?? inv.invoiceType,
    });
    primaryCategory = c.primary;
    secondaryCategory = c.secondary;
  }

  let fieldSource: Record<string, unknown> = {};
  try {
    fieldSource = JSON.parse(inv.fieldSourceJson);
  } catch {
    fieldSource = {};
  }

  await prisma.invoice.update({
    where: { id },
    data: {
      invoiceType: body.invoiceType ?? inv.invoiceType,
      invoiceNumber: body.invoiceNumber ?? inv.invoiceNumber,
      invoiceDate: body.invoiceDate ?? inv.invoiceDate,
      sellerName: body.sellerName ?? inv.sellerName,
      buyerName: body.buyerName ?? inv.buyerName,
      amountExclTax,
      taxAmount,
      amountInclTax,
      primaryCategory,
      secondaryCategory,
      confidence:
        body.confidence !== undefined ? Number(body.confidence) : Math.max(inv.confidence, 0.95),
      notes: body.notes ?? inv.notes,
      suggestedClaimAmount: amountInclTax,
      fieldSourceJson: JSON.stringify({ ...fieldSource, userEdit: true }),
    },
  });

  const claim = await recomputeClaim(inv.claimId);
  return NextResponse.json(claim);
}
