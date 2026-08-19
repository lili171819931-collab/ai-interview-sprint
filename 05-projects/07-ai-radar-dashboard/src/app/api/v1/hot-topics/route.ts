import { NextResponse } from "next/server";
import { queryHotTopics } from "@/lib/intel/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const hot = queryHotTopics();
  return NextResponse.json({
    schemaVersion: 1,
    count: hot.items.length,
    items: hot.items.map((it) => {
      const abs = (href: string | null | undefined) =>
        !href ? null : href.startsWith("http") ? href : `${origin}${href}`;
      return {
        rank: it.rank,
        id: it.id,
        title: it.title,
        source: { name: it.sourceName },
        links: {
          // 本站故事线页（图 2 模式：搜索逻辑 + 故事线 + 推荐理由）
          story: abs(it.storyHref || it.href),
          // 第三方原始报道
          original: it.originalUrl && it.originalUrl.startsWith("http") ? it.originalUrl : null,
          // AIHOT 原站条目（仅作署名，不用于跳转）
          aihot: it.externalUrl || it.href,
        },
        sourceCount: it.sourceCount,
        sourceNames: it.sourceNames,
        latestAt: it.latestAt,
      };
    }),
  });
}
