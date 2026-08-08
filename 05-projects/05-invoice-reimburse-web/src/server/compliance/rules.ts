import { nearlyEqualCents } from "@/lib/money";

export type ComplianceStatus = "compliant" | "conditional" | "non_compliant";
export type DedupeStatus = "unique" | "duplicate" | "suspected_duplicate";
export type ConfidenceLevel = "high" | "mid" | "low";

export interface PolicyConfig {
  legalName: string;
  aliases: string[];
  hotelLimitTier1: number;
  hotelLimitTier2: number;
  hotelLimitOther: number;
  entertainmentPerCapita: number;
  preApprovalThreshold: number;
  tier1Cities: string[];
}

export interface InvoiceForCompliance {
  id?: string;
  invoiceType: string;
  invoiceCode?: string;
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  buyerName: string;
  amountExclTax: number;
  taxAmount: number;
  amountInclTax: number;
  primaryCategory: string;
  secondaryCategory: string;
  confidence: number;
  suggestedClaimAmount?: number;
  notes?: string;
}

export interface ClaimContext {
  periodStart: string;
  periodEnd: string;
  purpose: string;
  modes: string[];
  cityTier?: string;
  entertainGuests?: number;
  hasPreApproval?: boolean;
}

export interface ComplianceResult {
  complianceStatus: ComplianceStatus;
  complianceReasons: string[];
  riskScore: number;
  suggestedClaimAmount: number;
  needsUserInput: string[];
  confidenceLevel: ConfidenceLevel;
}

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.9) return "high";
  if (score >= 0.7) return "mid";
  return "low";
}

export function normalizeBuyer(name: string): string {
  return name.replace(/\s+/g, "").toLowerCase();
}

export function buyerMatches(buyerName: string, policy: PolicyConfig): boolean {
  if (!buyerName.trim()) return false;
  const buyer = normalizeBuyer(buyerName);
  const names = [policy.legalName, ...policy.aliases].map(normalizeBuyer);
  return names.some((n) => n && (buyer === n || buyer.includes(n) || n.includes(buyer)));
}

export function hotelLimitForCity(cityTier: string | undefined, policy: PolicyConfig): number {
  if (!cityTier) return policy.hotelLimitOther;
  if (policy.tier1Cities.includes(cityTier) || cityTier === "tier1") return policy.hotelLimitTier1;
  if (cityTier === "tier2") return policy.hotelLimitTier2;
  return policy.hotelLimitOther;
}

export function evaluateInvoice(
  invoice: InvoiceForCompliance,
  claim: ClaimContext,
  policy: PolicyConfig,
  siblings: InvoiceForCompliance[] = [],
): ComplianceResult {
  const reasons: string[] = [];
  const needsUserInput: string[] = [];
  let risk = 0;
  let status: ComplianceStatus = "compliant";
  let suggested = invoice.amountInclTax;

  const level = confidenceLevel(invoice.confidence);
  if (level === "low") {
    status = "conditional";
    reasons.push("字段置信度偏低，需人工确认");
    needsUserInput.push("核对票面关键字段");
    risk += 10;
  } else if (level === "mid") {
    reasons.push("字段置信度中等，建议复核");
    risk += 5;
  }

  if (!nearlyEqualCents(invoice.amountExclTax + invoice.taxAmount, invoice.amountInclTax)) {
    status = "non_compliant";
    reasons.push("金额勾稽失败：金额+税额≠价税合计");
    risk += 25;
  }

  if (invoice.invoiceType === "POS_RECEIPT") {
    status = "non_compliant";
    reasons.push("小票/收据默认不可报销（除非制度白名单）");
    risk += 20;
  }

  if (!buyerMatches(invoice.buyerName, policy)) {
    status = "non_compliant";
    reasons.push(`购买方抬头与公司不一致（期望：${policy.legalName}）`);
    risk += 20;
  }

  if (invoice.invoiceDate) {
    if (invoice.invoiceDate < claim.periodStart || invoice.invoiceDate > claim.periodEnd) {
      if (status === "compliant") status = "conditional";
      reasons.push("开票日期不在报销期间内，需说明");
      needsUserInput.push("跨期说明");
      risk += 8;
    }
  } else {
    if (status === "compliant") status = "conditional";
    needsUserInput.push("开票日期");
  }

  // hotel limit
  if (invoice.primaryCategory === "TRAVEL" && invoice.secondaryCategory === "酒店") {
    const limit = hotelLimitForCity(claim.cityTier, policy);
    if (invoice.amountInclTax > limit) {
      if (status !== "non_compliant") status = "conditional";
      reasons.push(`酒店超标：票面 ${invoice.amountInclTax} 分 > 上限 ${limit} 分`);
      suggested = limit;
      risk += 10;
    }
  }

  // entertainment
  if (invoice.primaryCategory === "ENTERTAIN" || claim.modes.includes("D")) {
    if (!claim.entertainGuests || claim.entertainGuests <= 0) {
      if (status !== "non_compliant") status = "conditional";
      reasons.push("招待缺少人数，无法核算人均");
      needsUserInput.push("招待人数");
      risk += 10;
    } else {
      const per = Math.round(invoice.amountInclTax / claim.entertainGuests);
      if (per > policy.entertainmentPerCapita) {
        if (status !== "non_compliant") status = "conditional";
        reasons.push(`招待人均超标：${per} 分 > ${policy.entertainmentPerCapita} 分`);
        suggested = policy.entertainmentPerCapita * claim.entertainGuests;
        risk += 10;
      }
    }
    if (invoice.amountInclTax >= policy.preApprovalThreshold && !claim.hasPreApproval) {
      if (status !== "non_compliant") status = "conditional";
      reasons.push("达到事前审批阈值但未提供审批证明");
      needsUserInput.push("事前审批");
      risk += 12;
    }
    if (/KTV|高尔夫|夜店|娱乐会所/i.test(invoice.sellerName + (invoice.notes ?? ""))) {
      status = "non_compliant";
      reasons.push("高风险娱乐消费，默认拒报");
      risk += 25;
    }
  }

  // weekend large meal without purpose detail
  if (invoice.invoiceDate) {
    const d = new Date(invoice.invoiceDate);
    const day = d.getDay();
    if ((day === 0 || day === 6) && invoice.amountInclTax >= 80000 && !/客户|拜访|加班/.test(claim.purpose)) {
      risk += 15;
      if (status === "compliant") status = "conditional";
      reasons.push("周末大额餐饮且事由不充分");
    }
  }

  // duplicate by number among siblings
  if (invoice.invoiceNumber) {
    const same = siblings.filter(
      (s) => s.invoiceNumber && s.invoiceNumber === invoice.invoiceNumber && s.id !== invoice.id,
    );
    if (same.length > 0) {
      status = "non_compliant";
      reasons.push("疑似重复发票号码");
      risk += 30;
    }
  }

  if (status === "non_compliant") {
    suggested = 0;
  }

  return {
    complianceStatus: status,
    complianceReasons: reasons,
    riskScore: Math.min(100, risk),
    suggestedClaimAmount: suggested,
    needsUserInput,
    confidenceLevel: level,
  };
}

export function summarizeClaimAmounts(
  invoices: Array<{
    complianceStatus: string;
    confidence: number;
    suggestedClaimAmount: number;
    taxAmount: number;
    dedupeStatus?: string;
  }>,
) {
  let totalClaimable = 0;
  let totalPending = 0;
  let totalRejected = 0;
  let totalTax = 0;

  for (const inv of invoices) {
    if (inv.dedupeStatus === "duplicate" || inv.complianceStatus === "non_compliant") {
      totalRejected += inv.suggestedClaimAmount || 0;
      // rejected amount should reflect original suggested before zeroing; use tax only if claimable
      continue;
    }
    if (confidenceLevel(inv.confidence) === "low" || inv.complianceStatus === "conditional") {
      // conditional with mid/high can still be claimable after user confirm; MVP: pending if low OR still needs review
      if (confidenceLevel(inv.confidence) === "low") {
        totalPending += inv.suggestedClaimAmount;
        continue;
      }
    }
    if (inv.complianceStatus === "compliant" || inv.complianceStatus === "conditional") {
      totalClaimable += inv.suggestedClaimAmount;
      totalTax += inv.taxAmount;
    }
  }

  return { totalClaimable, totalPending, totalRejected, totalTax };
}

export function buildApprovalSummary(input: {
  userName: string;
  department: string;
  periodStart: string;
  periodEnd: string;
  purpose: string;
  invoiceCount: number;
  claimableCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalClaimable: number;
  totalTax: number;
  highRisk: string[];
}): string {
  const decision =
    input.rejectedCount > 0 && input.claimableCount === 0
      ? "建议驳回/补材料"
      : input.pendingCount > 0
        ? "建议补齐待确认后再批"
        : "建议同意提交";

  return [
    `# 报销审批摘要`,
    `- 报销人：${input.userName}（${input.department}）`,
    `- 期间：${input.periodStart} ~ ${input.periodEnd}`,
    `- 票数：${input.invoiceCount}（可提交 ${input.claimableCount} / 待确认 ${input.pendingCount} / 拒报 ${input.rejectedCount}）`,
    `- 申请金额：¥${(input.totalClaimable / 100).toFixed(2)}（其中税额 ¥${(input.totalTax / 100).toFixed(2)}）`,
    `- 主要事由：${input.purpose}`,
    `- 高风险项：${input.highRisk.length ? input.highRisk.join("；") : "无"}`,
    `- 建议决策：${decision}`,
  ].join("\n");
}
