import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { recomputeClaim } from "@/server/pipeline/claim-service";
import { parseYuanInput } from "@/lib/money";
import { classifyHeuristic } from "@/lib/categories";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = await req.json();
  const claimId = String(body.claimId);
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim || claim.status !== "draft") {
    return NextResponse.json({ error: "不可录入" }, { status: 400 });
  }

  const amountInclTax = parseYuanInput(body.amountInclTax ?? 0);
  const taxAmount = parseYuanInput(body.taxAmount ?? 0);
  const amountExclTax =
    body.amountExclTax !== undefined ? parseYuanInput(body.amountExclTax) : amountInclTax - taxAmount;
  const classified = classifyHeuristic({
    sellerName: String(body.sellerName ?? ""),
    purpose: claim.purpose,
    invoiceType: body.invoiceType,
  });

  await prisma.invoice.create({
    data: {
      claimId,
      invoiceType: body.invoiceType ?? "UNKNOWN",
      invoiceNumber: String(body.invoiceNumber ?? ""),
      invoiceDate: String(body.invoiceDate ?? ""),
      sellerName: String(body.sellerName ?? ""),
      buyerName: String(body.buyerName ?? ""),
      amountExclTax,
      taxAmount,
      amountInclTax,
      primaryCategory: body.primaryCategory ?? classified.primary,
      secondaryCategory: body.secondaryCategory ?? classified.secondary,
      confidence: 0.99,
      suggestedClaimAmount: amountInclTax,
      notes: String(body.notes ?? "手动录入"),
      fieldSourceJson: JSON.stringify({ extractor: "manual" }),
    },
  });

  const updated = await recomputeClaim(claimId);
  return NextResponse.json(updated);
}
