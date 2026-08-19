import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { recomputeClaim, approvalSummaryForClaim } from "@/server/pipeline/claim-service";
import { ClaimDetailClient } from "@/components/ClaimDetailClient";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  let claim = await prisma.claim.findUnique({
    where: { id },
    include: { invoices: true, attachments: true, user: true },
  });
  if (!claim) notFound();
  if (user.role === "employee" && claim.userId !== user.id) redirect("/");

  // ensure compliance computed for seed/demo
  claim = (await recomputeClaim(id))!;
  const summary = await approvalSummaryForClaim(id);

  return (
    <ClaimDetailClient
      currentUser={{ id: user.id, role: user.role, name: user.name }}
      claim={JSON.parse(JSON.stringify(claim))}
      summary={summary}
    />
  );
}
