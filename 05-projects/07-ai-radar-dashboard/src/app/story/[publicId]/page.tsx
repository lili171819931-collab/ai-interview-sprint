import Link from "next/link";
import type { Metadata } from "next";
import { StoryView } from "@/components/intel/StoryView";
import { getStoryView } from "@/lib/intel/story-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "事件故事线",
};

export default async function StoryPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const view = await getStoryView(publicId);

  if (!view) {
    return (
      <div className="page-main space-y-5 max-w-3xl">
        <h1 className="page-title">故事线未找到</h1>
        <p className="page-sub">
          本地未缓存该故事线，且无法从 AIHOT 公开 API 获取。publicId = {publicId}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/ranking" className="btn btn-primary">
            返回热点榜
          </Link>
          <Link href="/" className="btn btn-ghost">
            返回精选
          </Link>
        </div>
        <p className="text-xs text-[var(--muted)]">
          可运行 <code className="font-mono">npm run aihot:sync</code> 拉取最新故事线缓存后重试。
        </p>
      </div>
    );
  }

  return <StoryView view={view} />;
}
