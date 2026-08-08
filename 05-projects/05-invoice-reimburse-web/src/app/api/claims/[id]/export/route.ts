import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { approvalSummaryForClaim, exportClaimCsv } from "@/server/pipeline/claim-service";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";

  if (format === "summary") {
    const md = await approvalSummaryForClaim(id);
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="summary-${id}.md"`,
      },
    });
  }

  const csv = await exportClaimCsv(id);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="claim-${id}.csv"`,
    },
  });
}
