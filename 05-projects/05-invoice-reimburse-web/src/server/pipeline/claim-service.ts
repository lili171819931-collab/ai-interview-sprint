import { prisma } from "@/server/db";
import {
  buildApprovalSummary,
  evaluateInvoice,
  summarizeClaimAmounts,
  type PolicyConfig,
} from "@/server/compliance/rules";
import { mockExtractInvoice, sha256OfBuffer } from "@/server/extractors/mock";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function loadPolicyConfig(): Promise<PolicyConfig> {
  const company = await prisma.companyProfile.findFirst();
  const policy = await prisma.policy.findFirst();
  return {
    legalName: company?.legalName ?? "星河智能科技有限公司",
    aliases: company ? parseJsonArray(company.aliasJson) : ["星河智能"],
    hotelLimitTier1: policy?.hotelLimitTier1 ?? 60000,
    hotelLimitTier2: policy?.hotelLimitTier2 ?? 45000,
    hotelLimitOther: policy?.hotelLimitOther ?? 35000,
    entertainmentPerCapita: policy?.entertainmentPerCapita ?? 20000,
    preApprovalThreshold: policy?.preApprovalThreshold ?? 100000,
    tier1Cities: ["北京", "上海", "广州", "深圳", "tier1"],
  };
}

export async function recomputeClaim(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { invoices: true, user: true },
  });
  if (!claim) throw new Error("CLAIM_NOT_FOUND");

  const policy = await loadPolicyConfig();
  const modes = parseJsonArray(claim.modesJson);
  const siblings = claim.invoices.map((i) => ({
    id: i.id,
    invoiceType: i.invoiceType,
    invoiceCode: i.invoiceCode,
    invoiceNumber: i.invoiceNumber,
    invoiceDate: i.invoiceDate,
    sellerName: i.sellerName,
    buyerName: i.buyerName,
    amountExclTax: i.amountExclTax,
    taxAmount: i.taxAmount,
    amountInclTax: i.amountInclTax,
    primaryCategory: i.primaryCategory,
    secondaryCategory: i.secondaryCategory,
    confidence: i.confidence,
    notes: i.notes,
  }));

  for (const inv of claim.invoices) {
    // dedupe by number
    let dedupeStatus = "unique";
    if (inv.invoiceNumber) {
      const dup = claim.invoices.filter(
        (x) => x.invoiceNumber === inv.invoiceNumber && x.id !== inv.id,
      );
      if (dup.length) dedupeStatus = "duplicate";
    }

    const result = evaluateInvoice(
      {
        id: inv.id,
        invoiceType: inv.invoiceType,
        invoiceCode: inv.invoiceCode,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        sellerName: inv.sellerName,
        buyerName: inv.buyerName,
        amountExclTax: inv.amountExclTax,
        taxAmount: inv.taxAmount,
        amountInclTax: inv.amountInclTax,
        primaryCategory: inv.primaryCategory,
        secondaryCategory: inv.secondaryCategory,
        confidence: inv.confidence,
        notes: inv.notes,
      },
      {
        periodStart: claim.periodStart,
        periodEnd: claim.periodEnd,
        purpose: claim.purpose,
        modes,
        cityTier: claim.cityTier ?? undefined,
        entertainGuests: claim.entertainGuests ?? undefined,
      },
      policy,
      siblings,
    );

    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        dedupeStatus,
        complianceStatus: result.complianceStatus,
        complianceReasonsJson: JSON.stringify(result.complianceReasons),
        riskScore: result.riskScore,
        suggestedClaimAmount: result.suggestedClaimAmount,
        needsUserInputJson: JSON.stringify(result.needsUserInput),
      },
    });
  }

  const refreshed = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { invoices: true, user: true },
  });
  if (!refreshed) throw new Error("CLAIM_NOT_FOUND");

  // fix rejected sum: use amountInclTax for rejected display
  const totals = summarizeClaimAmounts(
    refreshed.invoices.map((i) => ({
      complianceStatus: i.complianceStatus,
      confidence: i.confidence,
      suggestedClaimAmount:
        i.complianceStatus === "non_compliant" || i.dedupeStatus === "duplicate"
          ? i.amountInclTax
          : i.suggestedClaimAmount,
      taxAmount: i.taxAmount,
      dedupeStatus: i.dedupeStatus,
    })),
  );

  await prisma.claim.update({
    where: { id: claimId },
    data: totals,
  });

  return prisma.claim.findUnique({
    where: { id: claimId },
    include: { invoices: true, attachments: true, user: true },
  });
}

export async function saveUploadAndExtract(input: {
  claimId: string;
  filename: string;
  mime: string;
  buffer: Buffer;
}) {
  const claim = await prisma.claim.findUnique({ where: { id: input.claimId } });
  if (!claim) throw new Error("CLAIM_NOT_FOUND");
  if (claim.status !== "draft") throw new Error("CLAIM_LOCKED");

  const policy = await loadPolicyConfig();
  const sha = sha256OfBuffer(input.buffer);
  const dir = path.join(process.cwd(), "uploads", input.claimId);
  await mkdir(dir, { recursive: true });
  const storagePath = path.join(dir, `${Date.now()}-${input.filename}`);
  await writeFile(storagePath, input.buffer);

  const attachment = await prisma.attachment.create({
    data: {
      claimId: input.claimId,
      filename: input.filename,
      mime: input.mime,
      size: input.buffer.length,
      sha256: sha,
      storagePath,
      ocrStatus: "processing",
    },
  });

  const extracted = mockExtractInvoice({
    filename: input.filename,
    purpose: claim.purpose,
    companyLegalName: policy.legalName,
  });

  await prisma.invoice.create({
    data: {
      claimId: input.claimId,
      attachmentId: attachment.id,
      invoiceType: extracted.invoiceType,
      invoiceCode: extracted.invoiceCode,
      invoiceNumber: extracted.invoiceNumber,
      invoiceDate: extracted.invoiceDate,
      sellerName: extracted.sellerName,
      sellerTaxId: extracted.sellerTaxId,
      buyerName: extracted.buyerName,
      buyerTaxId: extracted.buyerTaxId,
      amountExclTax: extracted.amountExclTax,
      taxAmount: extracted.taxAmount,
      amountInclTax: extracted.amountInclTax,
      primaryCategory: extracted.primaryCategory,
      secondaryCategory: extracted.secondaryCategory,
      confidence: extracted.confidence,
      notes: extracted.notes,
      fieldSourceJson: JSON.stringify({ extractor: "mock" }),
      suggestedClaimAmount: extracted.amountInclTax,
    },
  });

  await prisma.attachment.update({
    where: { id: attachment.id },
    data: { ocrStatus: "done" },
  });

  return recomputeClaim(input.claimId);
}

export async function approvalSummaryForClaim(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { invoices: true, user: true },
  });
  if (!claim) throw new Error("CLAIM_NOT_FOUND");

  const claimable = claim.invoices.filter((i) => i.complianceStatus === "compliant");
  const pending = claim.invoices.filter(
    (i) => i.complianceStatus === "conditional" || i.confidence < 0.7,
  );
  const rejected = claim.invoices.filter(
    (i) => i.complianceStatus === "non_compliant" || i.dedupeStatus === "duplicate",
  );
  const highRisk = claim.invoices
    .filter((i) => i.riskScore >= 60)
    .map((i) => `${i.sellerName}（风险${i.riskScore}）`);

  return buildApprovalSummary({
    userName: claim.user.name,
    department: claim.user.department,
    periodStart: claim.periodStart,
    periodEnd: claim.periodEnd,
    purpose: claim.purpose,
    invoiceCount: claim.invoices.length,
    claimableCount: claimable.length,
    pendingCount: pending.length,
    rejectedCount: rejected.length,
    totalClaimable: claim.totalClaimable,
    totalTax: claim.totalTax,
    highRisk,
  });
}

export async function exportClaimCsv(claimId: string): Promise<string> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { invoices: true },
  });
  if (!claim) throw new Error("CLAIM_NOT_FOUND");

  const header = [
    "票号",
    "日期",
    "销售方",
    "购买方",
    "票种",
    "一级科目",
    "二级科目",
    "价税合计(元)",
    "可报金额(元)",
    "合规状态",
    "原因",
    "置信度",
  ];
  const rows = claim.invoices.map((i) =>
    [
      i.invoiceNumber,
      i.invoiceDate,
      i.sellerName,
      i.buyerName,
      i.invoiceType,
      i.primaryCategory,
      i.secondaryCategory,
      (i.amountInclTax / 100).toFixed(2),
      (i.suggestedClaimAmount / 100).toFixed(2),
      i.complianceStatus,
      parseJsonArray(i.complianceReasonsJson).join("|"),
      i.confidence.toFixed(2),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
