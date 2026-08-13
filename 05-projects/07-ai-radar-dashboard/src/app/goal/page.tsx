import { GoalBriefForm, GoalHero } from "@/components/intel/GoalBriefForm";
import { queryHotTopics } from "@/lib/intel/feed";

export const dynamic = "force-dynamic";

export default function GoalPage() {
  const hot = queryHotTopics();

  return (
    <div className="container py-10 space-y-6 max-w-3xl">
      <GoalHero />
      <h1 className="page-title">今日目标</h1>
      <p className="page-sub leading-relaxed">
        对齐 khazix-skills 的 leader：人出想法，管理者写出可粘贴的任务书。完成态、证据、反作弊、地界、取舍、未知都写进同一份。执行者拿去跑，中途不许来找你。
      </p>
      <GoalBriefForm hot={hot.items} />
    </div>
  );
}
