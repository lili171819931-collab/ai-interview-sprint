import Link from "next/link";
import { ExternalLink, GitFork, Star, Users, CircleDot } from "lucide-react";
import { formatSigned, formatStars, formatPct, growthRate } from "@/lib/engines";
import { categoryOf } from "@/lib/categories";
import type { Project, ProjectScores } from "@/lib/types";

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-amber-300 tracking-tight text-[13px]">
      {"★".repeat(full)}
      <span className="text-[#33415e]">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function ScoreBar({ label, value, color = "#4f8cff" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-[#8b98b3]">{label}</span>
        <span className="num text-white font-semibold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#141e33] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function Sparkline({ points, width = 120, height = 36, stroke = "#4f8cff" }: {
  points: { date: string; stars: number }[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points.map((p) => p.stars));
  const max = Math.max(...points.map((p) => p.stars));
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - 3 - ((p.stars - min) / range) * (height - 8);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = `g-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.4" fill={stroke} />
    </svg>
  );
}

export function CategoryChips({ project, limit = 4 }: { project: Project; limit?: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {project.categories.slice(0, limit).map((c) => {
        const cat = categoryOf(c);
        return (
          <span key={c} className="chip chip-accent">
            {cat.emoji} {cat.name}
          </span>
        );
      })}
    </div>
  );
}

export function StatsRow({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#8b98b3] num">
      <span className="flex items-center gap-1"><Star size={13} className="text-amber-300" /> {formatStars(project.stars)}</span>
      <span className="flex items-center gap-1"><GitFork size={13} /> {formatStars(project.forks)}</span>
      <span className="flex items-center gap-1"><Users size={13} /> {project.contributors.toLocaleString()}</span>
      <span className="flex items-center gap-1"><CircleDot size={13} /> {project.openIssues.toLocaleString()} issues</span>
    </div>
  );
}

export function GrowthBadge({ project }: { project: Project }) {
  const r30 = growthRate(project, 30);
  const hot = r30 >= 10;
  return (
    <span className={`chip ${hot ? "!text-emerald-300 !border-emerald-400/40 !bg-emerald-400/10" : "!text-cyan-300 !border-cyan-400/40 !bg-cyan-400/10"}`}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      {formatSigned(project.growth30d)} · {formatPct(r30)} / 30D
    </span>
  );
}

export function GitHubLink({ project }: { project: Project }) {
  const url = `https://github.com/${project.fullName}`;
  return (
    <Link href={url} target="_blank" className="inline-flex items-center gap-1 text-[12px] text-[#8b98b3] hover:text-[#cfe0ff]">
      <ExternalLink size={13} /> github.com/{project.fullName}
    </Link>
  );
}

export function ScorePills({ scores }: { scores: ProjectScores }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] num">
      <span>Opportunity <b className="text-[#7dd3fc]">{scores.opportunity}</b></span>
      <span>Commercial <b className="text-[#a78bfa]">{scores.commercial}</b></span>
      <span>Technical <b className="text-[#34d399]">{scores.technical}</b></span>
      <span>Growth <b className="text-[#fbbf24]">{scores.growth}</b></span>
      <span>SideHustle <b className="text-[#f87171]">{scores.sideHustle}</b></span>
    </div>
  );
}
