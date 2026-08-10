import { Suspense } from "react";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { CompareWorkspace } from "@/components/CompareWorkspace";
import { getBundleView } from "@/lib/data";

export default async function ComparePage() {
  const { bundle, freshness, lastUpdatedDate } = getBundleView();

  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-3">
        <h1 className="display text-3xl font-semibold">优劣势对比</h1>
        <p className="text-[var(--muted)] max-w-2xl">
          勾选工具后以弹窗呈现智能对比图（雷达 + 柱状 + 场景建议），更图像化、可汇报。
        </p>
        <FreshnessBadge freshness={freshness} lastUpdatedDate={lastUpdatedDate} />
      </div>

      <Suspense fallback={<p className="text-[var(--muted)]">加载对比工作台…</p>}>
        <CompareWorkspace tools={bundle.tools} lastUpdatedDate={lastUpdatedDate} />
      </Suspense>
    </div>
  );
}
