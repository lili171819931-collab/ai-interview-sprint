import { PrismaClient } from "@prisma/client";
import { yuanToCents } from "../src/lib/money";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.user.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.policy.deleteMany();

  const employee = await prisma.user.create({
    data: {
      email: "lili@demo.com",
      name: "李丽",
      department: "产品部",
      role: "employee",
      password: "demo123",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@demo.com",
      name: "王主管",
      department: "产品部",
      role: "manager",
      password: "demo123",
    },
  });

  await prisma.companyProfile.create({
    data: {
      legalName: "星河智能科技有限公司",
      taxpayerId: "91310000MA1DEMO001",
      aliasJson: JSON.stringify(["星河智能", "星河智能科技"]),
    },
  });

  await prisma.policy.create({
    data: { version: "baseline-v1" },
  });

  const claim = await prisma.claim.create({
    data: {
      userId: employee.id,
      title: "2026年8月上海客户拜访差旅",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      purpose: "上海客户拜访两天，含差旅与客户宴请",
      modesJson: JSON.stringify(["B", "C", "D"]),
      cityTier: "上海",
      entertainGuests: 3,
      status: "draft",
    },
  });

  const invoices = [
    {
      invoiceType: "DIGITAL_VAT",
      invoiceNumber: "253220000000334455",
      invoiceDate: "2026-08-05",
      sellerName: "上海浦东希尔顿酒店有限公司",
      buyerName: "星河智能科技有限公司",
      amountExclTax: yuanToCents(1132.74),
      taxAmount: yuanToCents(147.26),
      amountInclTax: yuanToCents(1280),
      primaryCategory: "TRAVEL",
      secondaryCategory: "酒店",
      confidence: 0.93,
    },
    {
      invoiceType: "TRAIN",
      invoiceNumber: "G1234567890",
      invoiceDate: "2026-08-04",
      sellerName: "中国铁路上海局集团有限公司",
      buyerName: "星河智能科技有限公司",
      amountExclTax: yuanToCents(553),
      taxAmount: 0,
      amountInclTax: yuanToCents(553),
      primaryCategory: "TRAVEL",
      secondaryCategory: "火车票",
      confidence: 0.95,
    },
    {
      invoiceType: "E_VAT",
      invoiceNumber: "253110000000778899",
      invoiceDate: "2026-08-06",
      sellerName: "上海外滩一号酒楼",
      buyerName: "星河智能科技有限公司",
      amountExclTax: yuanToCents(2075.47),
      taxAmount: yuanToCents(124.53),
      amountInclTax: yuanToCents(2200),
      primaryCategory: "ENTERTAIN",
      secondaryCategory: "客户宴请",
      confidence: 0.86,
    },
    {
      invoiceType: "POS_RECEIPT",
      invoiceNumber: "POS-001",
      invoiceDate: "2026-08-03",
      sellerName: "便利店小票",
      buyerName: "",
      amountExclTax: yuanToCents(36),
      taxAmount: 0,
      amountInclTax: yuanToCents(36),
      primaryCategory: "OTHER",
      secondaryCategory: "默认",
      confidence: 0.7,
    },
  ];

  for (const inv of invoices) {
    await prisma.invoice.create({
      data: {
        claimId: claim.id,
        ...inv,
        suggestedClaimAmount: inv.amountInclTax,
        notes: "seed demo",
      },
    });
  }

  console.log("Seed OK");
  console.log("Employee:", employee.email, "/ demo123");
  console.log("Manager:", manager.email, "/ demo123");
  console.log("Demo claim:", claim.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
