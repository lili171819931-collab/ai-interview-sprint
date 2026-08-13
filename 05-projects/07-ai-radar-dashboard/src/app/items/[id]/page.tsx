import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAihotItemById } from "@/lib/intel/aihot-data";
import { beijingTime, mapToFeedCategory } from "@/lib/intel/categories";
import { buildRecommendReason, normalizeScore } from "@/lib/intel/recommend";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getAihotItemById(id);

  if (!item) {
    return (
      <div className="page-main space-y-4">
        <h1 className="page-title">条目未找到</h1>
        <p className="page-sub">id={id}</p>
        <Link href="/" className="btn btn-primary">
          返回精选
        </Link>
      </div>
    );
  }

  const cat = mapToFeedCategory(item.category, item.title, item.summary || "");
  const score = normalizeScore(item.score);
  const reason =
    (item.recommendReason || "").trim() ||
    buildRecommendReason({
      title: item.title,
      summary: item.summary,
      category: cat,
      score,
      selected: item.selected !== false,
    });
  const aihotUrl = item.links.aihot;
  const original = item.links.original;

  return (
    <div className="page-main space-y-6 max-w-3xl">
      <div className="story-card">
        <div className="story-card-top">
          <div className="story-card-meta">
            <span className="zh-source">{item.source.name}</span>
            <span className="zh-badge-pick">✨ 精选</span>
          </div>
          {score != null ? (
            <span className="zh-score">
              <span className="zh-score-dot" aria-hidden />
              AI 评分 {score}/100
            </span>
          ) : null}
        </div>
        <h1 className="zh-title" style={{ fontSize: "1.55rem" }}>
          {item.title}
        </h1>
        <p className="zh-source" style={{ marginTop: "0.55rem" }}>
          {beijingTime(item.publishedAt || item.discoveredAt)}
        </p>
        {item.summary ? <p className="zh-summary">{item.summary}</p> : null}
        <hr className="story-card-rule" />
        <p className="zh-reason zh-reason-pick">
          <span className="zh-reason-label">推荐理由：</span>
          {reason}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {aihotUrl ? (
          <a href={aihotUrl} target="_blank" rel="noreferrer" className="btn btn-primary inline-flex items-center gap-1">
            AIHOT 阅读页 <ExternalLink size={14} aria-hidden />
          </a>
        ) : null}
        {original ? (
          <a href={original} target="_blank" rel="noreferrer" className="btn btn-ghost inline-flex items-center gap-1">
            第三方原文 <ExternalLink size={14} aria-hidden />
          </a>
        ) : null}
        <Link href="/" className="btn btn-ghost">
          返回精选
        </Link>
      </div>
      <p className="text-xs text-[var(--muted)]">
        数据来源 AIHOT，个人非商业演示。第三方原文版权仍归原作者。使用规则见{" "}
        <a href="https://aihot.virxact.com/terms" className="text-[var(--signal)] hover:underline">
          aihot.virxact.com/terms
        </a>
        。
      </p>
    </div>
  );
}
