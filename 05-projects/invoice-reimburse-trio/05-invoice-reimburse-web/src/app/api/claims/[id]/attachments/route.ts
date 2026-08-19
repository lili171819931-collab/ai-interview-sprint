import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { saveUploadAndExtract } from "@/server/pipeline/claim-service";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await ctx.params;

  const form = await req.formData();
  const files = form.getAll("files");
  if (!files.length) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 });
  }

  let claim = null;
  for (const f of files) {
    if (!(f instanceof File)) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    claim = await saveUploadAndExtract({
      claimId: id,
      filename: f.name,
      mime: f.type || "application/octet-stream",
      buffer: buf,
    });
  }

  return NextResponse.json(claim);
}
