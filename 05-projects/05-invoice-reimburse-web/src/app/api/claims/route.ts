import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  if (user.role === "manager" || user.role === "finance") {
    const claims = await prisma.claim.findMany({
      include: { user: true, invoices: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ user, claims });
  }

  const claims = await prisma.claim.findMany({
    where: { userId: user.id },
    include: { user: true, invoices: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ user, claims });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const claim = await prisma.claim.create({
    data: {
      userId: user.id,
      title: String(body.title ?? "未命名报销单"),
      periodStart: String(body.periodStart),
      periodEnd: String(body.periodEnd),
      purpose: String(body.purpose ?? ""),
      modesJson: JSON.stringify(body.modes ?? ["B"]),
      cityTier: body.cityTier ? String(body.cityTier) : null,
      entertainGuests: body.entertainGuests ? Number(body.entertainGuests) : null,
      projectCode: body.projectCode ? String(body.projectCode) : null,
      status: "draft",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entityType: "claim",
      entityId: claim.id,
      action: "create",
      diffJson: JSON.stringify(body),
    },
  });

  return NextResponse.json(claim);
}
