export const PRIMARY_CATEGORIES = [
  { code: "TRAVEL", label: "差旅费" },
  { code: "TRANSPORT", label: "市内交通" },
  { code: "MEAL", label: "餐饮/餐补" },
  { code: "ENTERTAIN", label: "业务招待" },
  { code: "OFFICE", label: "办公用品" },
  { code: "COMM", label: "通讯网络" },
  { code: "TRAINING", label: "培训学习" },
  { code: "WELFARE", label: "员工福利" },
  { code: "IT", label: "软件设备" },
  { code: "MARKETING", label: "市场推广" },
  { code: "LOGISTICS", label: "快递物流" },
  { code: "MEDICAL", label: "医药体检" },
  { code: "OTHER", label: "其他" },
] as const;

export type PrimaryCategory = (typeof PRIMARY_CATEGORIES)[number]["code"];

export const SECONDARY_BY_PRIMARY: Record<PrimaryCategory, string[]> = {
  TRAVEL: ["机票", "火车票", "酒店", "出差打车", "机场交通"],
  TRANSPORT: ["网约车", "地铁公交", "停车"],
  MEAL: ["工作餐", "加班餐"],
  ENTERTAIN: ["客户宴请", "商务赠礼"],
  OFFICE: ["文具", "打印耗材"],
  COMM: ["默认"],
  TRAINING: ["默认"],
  WELFARE: ["默认"],
  IT: ["SaaS", "云资源", "配件"],
  MARKETING: ["默认"],
  LOGISTICS: ["默认"],
  MEDICAL: ["默认"],
  OTHER: ["默认"],
};

export const INVOICE_TYPES = [
  { code: "VAT_SPECIAL", label: "增值税专用发票" },
  { code: "VAT_NORMAL", label: "增值税普通发票" },
  { code: "E_VAT", label: "电子发票" },
  { code: "DIGITAL_VAT", label: "数电票" },
  { code: "TRAIN", label: "火车票" },
  { code: "FLIGHT", label: "机票行程单" },
  { code: "TAXI", label: "出租车票" },
  { code: "QUOTA", label: "定额发票" },
  { code: "POS_RECEIPT", label: "小票/收据" },
  { code: "OVERSEAS", label: "境外票据" },
  { code: "UNKNOWN", label: "未知" },
] as const;

export type InvoiceType = (typeof INVOICE_TYPES)[number]["code"];

export function labelOfCategory(code: string): string {
  return PRIMARY_CATEGORIES.find((c) => c.code === code)?.label ?? code;
}

export function labelOfInvoiceType(code: string): string {
  return INVOICE_TYPES.find((t) => t.code === code)?.label ?? code;
}

export function classifyHeuristic(input: {
  sellerName: string;
  purpose?: string;
  invoiceType?: string;
}): { primary: PrimaryCategory; secondary: string; confidenceBoost: number } {
  const seller = input.sellerName.toLowerCase();
  const purpose = (input.purpose ?? "").toLowerCase();

  if (input.invoiceType === "POS_RECEIPT") {
    return { primary: "OTHER", secondary: "默认", confidenceBoost: -0.2 };
  }
  if (/酒店|宾馆|希尔顿|如家|汉庭|marriott|hilton/.test(seller)) {
    return { primary: "TRAVEL", secondary: "酒店", confidenceBoost: 0.15 };
  }
  if (/铁路|高铁|12306|航空|机票|南航|东航|国航/.test(seller) || input.invoiceType === "TRAIN" || input.invoiceType === "FLIGHT") {
    return { primary: "TRAVEL", secondary: input.invoiceType === "FLIGHT" ? "机票" : "火车票", confidenceBoost: 0.15 };
  }
  if (/滴滴|高德|曹操|t3|出租/.test(seller)) {
    if (/出差|差旅|拜访/.test(purpose)) {
      return { primary: "TRAVEL", secondary: "出差打车", confidenceBoost: 0.1 };
    }
    return { primary: "TRANSPORT", secondary: "网约车", confidenceBoost: 0.1 };
  }
  if (/餐|酒楼|饭店|火锅|咖啡|茶室|restaurant/.test(seller)) {
    if (/客户|宴请|招待|商务/.test(purpose)) {
      return { primary: "ENTERTAIN", secondary: "客户宴请", confidenceBoost: 0.1 };
    }
    return { primary: "MEAL", secondary: "工作餐", confidenceBoost: 0.05 };
  }
  if (/文具|办公|打印|得力/.test(seller)) {
    return { primary: "OFFICE", secondary: "文具", confidenceBoost: 0.1 };
  }
  if (/阿里云|腾讯云|aws|azure|saas|github|openai/.test(seller)) {
    return { primary: "IT", secondary: "SaaS", confidenceBoost: 0.1 };
  }
  return { primary: "OTHER", secondary: "默认", confidenceBoost: -0.15 };
}
