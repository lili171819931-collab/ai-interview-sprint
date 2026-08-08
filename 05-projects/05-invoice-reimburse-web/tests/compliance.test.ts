import { describe, expect, it } from "vitest";
import { yuanToCents, nearlyEqualCents } from "../src/lib/money";
import { classifyHeuristic } from "../src/lib/categories";
import {
  evaluateInvoice,
  confidenceLevel,
  buyerMatches,
} from "../src/server/compliance/rules";

const policy = {
  legalName: "星河智能科技有限公司",
  aliases: ["星河智能"],
  hotelLimitTier1: 60000,
  hotelLimitTier2: 45000,
  hotelLimitOther: 35000,
  entertainmentPerCapita: 20000,
  preApprovalThreshold: 100000,
  tier1Cities: ["上海", "tier1"],
};

describe("money", () => {
  it("converts yuan to cents stably", () => {
    expect(yuanToCents(1280)).toBe(128000);
    expect(nearlyEqualCents(100 + 13, 113)).toBe(true);
  });
});

describe("classify", () => {
  it("classifies hotel as travel", () => {
    const r = classifyHeuristic({ sellerName: "上海希尔顿酒店", purpose: "出差" });
    expect(r.primary).toBe("TRAVEL");
    expect(r.secondary).toBe("酒店");
  });
});

describe("compliance", () => {
  it("rejects mismatched buyer", () => {
    const r = evaluateInvoice(
      {
        invoiceType: "E_VAT",
        invoiceNumber: "1",
        invoiceDate: "2026-08-05",
        sellerName: "A",
        buyerName: "别人的公司",
        amountExclTax: 10000,
        taxAmount: 0,
        amountInclTax: 10000,
        primaryCategory: "OFFICE",
        secondaryCategory: "文具",
        confidence: 0.95,
      },
      {
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        purpose: "办公",
        modes: ["B"],
      },
      policy,
    );
    expect(r.complianceStatus).toBe("non_compliant");
  });

  it("flags receipt as non_compliant", () => {
    const r = evaluateInvoice(
      {
        invoiceType: "POS_RECEIPT",
        invoiceNumber: "POS",
        invoiceDate: "2026-08-05",
        sellerName: "便利店",
        buyerName: "星河智能科技有限公司",
        amountExclTax: 3600,
        taxAmount: 0,
        amountInclTax: 3600,
        primaryCategory: "OTHER",
        secondaryCategory: "默认",
        confidence: 0.8,
      },
      {
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        purpose: "日常",
        modes: ["B"],
      },
      policy,
    );
    expect(r.complianceStatus).toBe("non_compliant");
  });

  it("caps entertainment by per capita", () => {
    const r = evaluateInvoice(
      {
        invoiceType: "E_VAT",
        invoiceNumber: "2",
        invoiceDate: "2026-08-06",
        sellerName: "酒楼",
        buyerName: "星河智能",
        amountExclTax: 200000,
        taxAmount: 20000,
        amountInclTax: 220000,
        primaryCategory: "ENTERTAIN",
        secondaryCategory: "客户宴请",
        confidence: 0.9,
      },
      {
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        purpose: "客户宴请",
        modes: ["D"],
        entertainGuests: 3,
      },
      policy,
    );
    expect(r.complianceStatus).toBe("conditional");
    expect(r.suggestedClaimAmount).toBe(60000);
  });

  it("confidence levels", () => {
    expect(confidenceLevel(0.95)).toBe("high");
    expect(confidenceLevel(0.8)).toBe("mid");
    expect(confidenceLevel(0.5)).toBe("low");
  });

  it("buyer alias match", () => {
    expect(buyerMatches("星河智能", policy)).toBe(true);
  });
});
