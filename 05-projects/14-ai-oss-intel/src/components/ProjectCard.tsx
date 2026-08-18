import Link from "next/link";
import { Star, GitFork, BarChart3, Save } from "lucide-react";
import { computeScores, formatPct, formatSigned, formatStars, growthRate } from "@/lib/engines";
import type { Project } from "@/lib/types";
import { CategoryChips, GitHubLink, ScorePills, Sparkline } from "@/components/ui";
import { SaveButton } from "@/components/ClientBits";

export function ProjectCard({ project, rank }: { project: Project; rank?: number }) {
  const s = computeScores(project);
  const r30 = growthRate(project, 30);
  return (
    <div className="panel card-hover p-4 flex flex-col gap-3 relative overflow-hidden">
      {rank !== undefined && (
        <div className="absolute top-3 right-3 text-[11px] font-bold text-[#4d5a75] num">#{String(rank).padStart(2, "0")}</div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/projects/${project.slug}`} className="block">
            <div className="font-bold text-[15px] text-white hover:text-[#7dd3fc] truncate">{project.name}</div>
            <div className="text-[12px] text-[#8b98b3] truncate mt-0.5">{project.tagline}</div>
          </Link>
        </div>
        <div className="shrink-0">
          <Sparkline points={project.growthHistory} width={110} height={34} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-[#8b98b3] num">
        <span className="flex items-center gap-1"><Star size={13} className="text-amber-300" />{formatStars(project.stars)}</span>
        <span className="flex items-center gap-1"><GitFork size={13} />{formatStars(project.forks)}</span>
        <span className="flex items-center gap-1 text-emerald-300">↗ {formatSigned(project.growth30d)} ({formatPct(r30)})</span>
      </div>

      <CategoryChips project={project} limit={3} />

      <div className="pt-2 border-t border-[#16213a]">
        <ScorePills scores={s} />
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto">
        <GitHubLink project={project} />
        <div className="flex gap-2">
          <Link href={`/projects/${project.slug}`} className="text-[12px] text-[#7dd3fc] hover:underline flex items-center gap-1">
            <BarChart3 size={13} /> Analyze
          </Link>
          <SaveButton slug={project.slug} />
        </div>
      </div>
    </div>
  );
}

