import { Suspense } from "react";
import { ToolsResultBoard } from "@/components/ToolsResultBoard";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { getBundleView } from "@/lib/data";

export default function ToolsPage() {
  const { bundle, freshness, lastUpdatedDate } = getBundleView();

  return (
    <div className="container py-10 space-y-6">
      <div className="space-y-3">
        <h1 className="display text-3xl font-semibold">工具目录</h1>
        <p className="text-[var(--muted)] max-w-2xl">
          搜索 + 品类分段切换为主；更多筛选收起。多选后可打开对比弹窗。
        </p>
        <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
      </div>
      <Suspense fallback={<p className="text-[var(--muted)]">加载工具目录…</p>}>
        <ToolsResultBoard tools={bundle.tools} />
      </Suspense>
    </div>
  );
}
