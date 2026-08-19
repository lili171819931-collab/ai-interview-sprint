import { createHash } from "crypto";
import { classifyHeuristic, type InvoiceType } from "@/lib/categories";
import { yuanToCents } from "@/lib/money";

export interface ExtractedInvoice {
  invoiceType: InvoiceType;
  invoiceCode: string;
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  sellerTaxId: string;
  buyerName: string;
  buyerTaxId: string;
  amountExclTax: number;
  taxAmount: number;
  amountInclTax: number;
  primaryCategory: string;
  secondaryCategory: string;
  confidence: number;
  notes: string;
}

const DEMO_BANK: Array<Partial<ExtractedInvoice> & { keywords: string[] }> = [
  {
    keywords: ["hotel", "酒店", "hilton", "如家"],
    invoiceType: "DIGITAL_VAT",
    invoiceNumber: "253220000000334455",
    invoiceDate: "2026-08-05",
    sellerName: "上海浦东希尔顿酒店有限公司",
    buyerName: "星河智能科技有限公司",
    amountExclTax: yuanToCents(1132.74),
    taxAmount: yuanToCents(147.26),
    amountInclTax: yuanToCents(1280),
    confidence: 0.92,
  },
  {
    keywords: ["train", "高铁", "铁路"],
    invoiceType: "TRAIN",
    invoiceNumber: "G1234567890",
    invoiceDate: "2026-08-04",
    sellerName: "中国铁路上海局集团有限公司",
    buyerName: "星河智能科技有限公司",
    amountExclTax: yuanToCents(553),
    taxAmount: 0,
    amountInclTax: yuanToCents(553),
    confidence: 0.94,
  },
  {
    keywords: ["meal", "餐", "宴"],
    invoiceType: "E_VAT",
    invoiceNumber: "253110000000778899",
    invoiceDate: "2026-08-06",
    sellerName: "上海外滩一号酒楼",
    buyerName: "星河智能科技有限公司",
    amountExclTax: yuanToCents(2075.47),
    taxAmount: yuanToCents(124.53),
    amountInclTax: yuanToCents(2200),
    confidence: 0.88,
  },
  {
    keywords: ["receipt", "小票", "收据"],
    invoiceType: "POS_RECEIPT",
    invoiceNumber: "POS-001",
    invoiceDate: "2026-08-03",
    sellerName: "便利店小票",
    buyerName: "",
    amountExclTax: yuanToCents(36),
    taxAmount: 0,
    amountInclTax: yuanToCents(36),
    confidence: 0.7,
  },
];

function pickDemo(filename: string, purpose: string): Partial<ExtractedInvoice> {
  const key = `${filename} ${purpose}`.toLowerCase();
  const hit = DEMO_BANK.find((d) => d.keywords.some((k) => key.includes(k)));
  if (hit) {
    const { keywords: _k, ...rest } = hit;
    return rest;
  }
  // rotate by hash
  const idx = createHash("md5").update(filename).digest()[0] % (DEMO_BANK.length - 1);
  const { keywords: _k, ...rest } = DEMO_BANK[idx];
  return {
    ...rest,
    invoiceNumber: `${rest.invoiceNumber}-${String(filename.length).padStart(2, "0")}`,
    confidence: Math.max(0.72, (rest.confidence ?? 0.8) - 0.05),
  };
}

/** Mock OCR: deterministic demo extraction based on filename + purpose. */
export function mockExtractInvoice(input: {
  filename: string;
  purpose: string;
  companyLegalName: string;
}): ExtractedInvoice {
  const base = pickDemo(input.filename, input.purpose);
  const sellerName = base.sellerName ?? "未知销售方";
  const invoiceType = (base.invoiceType ?? "UNKNOWN") as InvoiceType;
  const classified = classifyHeuristic({
    sellerName,
    purpose: input.purpose,
    invoiceType,
  });

  const amountInclTax = base.amountInclTax ?? yuanToCents(100);
  const taxAmount = base.taxAmount ?? 0;
  const amountExclTax = base.amountExclTax ?? amountInclTax - taxAmount;

  return {
    invoiceType,
    invoiceCode: base.invoiceCode ?? "",
    invoiceNumber: base.invoiceNumber ?? `MOCK${Date.now()}`,
    invoiceDate: base.invoiceDate ?? "2026-08-01",
    sellerName,
    sellerTaxId: base.sellerTaxId ?? "",
    buyerName: base.buyerName || input.companyLegalName,
    buyerTaxId: base.buyerTaxId ?? "",
    amountExclTax,
    taxAmount,
    amountInclTax,
    primaryCategory: classified.primary,
    secondaryCategory: classified.secondary,
    confidence: Math.min(0.99, (base.confidence ?? 0.75) + classified.confidenceBoost),
    notes: `Mock OCR from ${input.filename}`,
  };
}

export function sha256OfBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}
