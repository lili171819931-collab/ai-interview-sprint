import type { Db } from "../db/connection";

export interface AnalyticsOverview {
  totalSkills: number;
  activeSkills: number;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  awaitingApproval: number;
  successRate: number;
  avgDurationMs: number | null;
  totalWorkflows: number;
  workflowRuns: number;
  workflowCompletionRate: number;
  recommendationCount: number;
  recommendationAcceptanceRate: number;
  totalSessions: number;
  dailyUsage: { date: string; count: number }[];
  topSkills: { id: string; name: string; usage_count: number; success_rate: number; icon: string | null }[];
  categoryDistribution: { category: string; count: number }[];
  recentExecutions: { id: string; skill_name: string; status: string; created_at: string; duration_ms: number | null }[];
}

export function getAnalytics(db: Db): AnalyticsOverview {
  const scalars = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM skills) AS totalSkills,
        (SELECT COUNT(*) FROM skills WHERE status='active') AS activeSkills,
        (SELECT COUNT(*) FROM skill_executions) AS totalExecutions,
        (SELECT COUNT(*) FROM skill_executions WHERE status='completed') AS completedExecutions,
        (SELECT COUNT(*) FROM skill_executions WHERE status='failed') AS failedExecutions,
        (SELECT COUNT(*) FROM skill_executions WHERE status='awaiting_approval') AS awaitingApproval,
        (SELECT AVG(duration_ms) FROM skill_executions WHERE duration_ms IS NOT NULL) AS avgDurationMs,
        (SELECT COUNT(*) FROM workflows) AS totalWorkflows,
        (SELECT COUNT(*) FROM workflow_runs) AS workflowRuns,
        (SELECT COUNT(*) FROM workflow_runs WHERE status='completed') AS completedWorkflowRuns,
        (SELECT COUNT(*) FROM recommendations) AS recommendationCount,
        (SELECT COUNT(*) FROM recommendations WHERE accepted=1) AS acceptedRecommendations,
        (SELECT COUNT(*) FROM agent_sessions) AS totalSessions`,
    )
    .get() as Record<string, number | null>;

  const daily = db
    .prepare(
      `SELECT date(created_at) AS date, COUNT(*) AS count FROM skill_executions
       WHERE created_at >= date('now', '-13 days') GROUP BY date(created_at) ORDER BY date ASC`,
    )
    .all() as { date: string; count: number }[];

  const topSkills = db
    .prepare(
      `SELECT id, name, icon, usage_count, success_count,
        CASE WHEN usage_count = 0 THEN 0 ELSE ROUND(success_count * 100.0 / usage_count) END AS success_rate
       FROM skills WHERE usage_count > 0 ORDER BY usage_count DESC LIMIT 8`,
    )
    .all() as { id: string; name: string; icon: string | null; usage_count: number; success_count: number; success_rate: number }[];

  const categoryDistribution = db
    .prepare(
      `SELECT COALESCE(c.name, '未分类') AS category, COUNT(*) AS count
       FROM skills s LEFT JOIN skill_categories c ON c.id = s.category_id
       GROUP BY category ORDER BY count DESC`,
    )
    .all() as { category: string; count: number }[];

  const recentExecutions = db
    .prepare(
      `SELECT e.id, s.name AS skill_name, e.status, e.created_at, e.duration_ms
       FROM skill_executions e JOIN skills s ON s.id = e.skill_id
       ORDER BY e.created_at DESC LIMIT 12`,
    )
    .all() as { id: string; skill_name: string; status: string; created_at: string; duration_ms: number | null }[];

  const total = Number(scalars.totalExecutions ?? 0);
  const completed = Number(scalars.completedExecutions ?? 0);
  const workflowRuns = Number(scalars.workflowRuns ?? 0);
  const completedWorkflowRuns = Number(scalars.completedWorkflowRuns ?? 0);
  const recCount = Number(scalars.recommendationCount ?? 0);
  const recAccepted = Number(scalars.acceptedRecommendations ?? 0);

  return {
    totalSkills: Number(scalars.totalSkills ?? 0),
    activeSkills: Number(scalars.activeSkills ?? 0),
    totalExecutions: total,
    completedExecutions: completed,
    failedExecutions: Number(scalars.failedExecutions ?? 0),
    awaitingApproval: Number(scalars.awaitingApproval ?? 0),
    successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgDurationMs: scalars.avgDurationMs == null ? null : Math.round(Number(scalars.avgDurationMs)),
    totalWorkflows: Number(scalars.totalWorkflows ?? 0),
    workflowRuns,
    workflowCompletionRate: workflowRuns > 0 ? Math.round((completedWorkflowRuns / workflowRuns) * 100) : 0,
    recommendationCount: recCount,
    recommendationAcceptanceRate: recCount > 0 ? Math.round((recAccepted / recCount) * 100) : 0,
    totalSessions: Number(scalars.totalSessions ?? 0),
    dailyUsage: daily.map((d) => ({ date: d.date, count: Number(d.count) })),
    topSkills: topSkills.map((t) => ({
      id: t.id,
      name: t.name,
      usage_count: Number(t.usage_count),
      success_rate: Number(t.success_rate),
      icon: t.icon,
    })),
    categoryDistribution: categoryDistribution.map((c) => ({ category: c.category, count: Number(c.count) })),
    recentExecutions: recentExecutions.map((r) => ({
      id: r.id,
      skill_name: r.skill_name,
      status: r.status,
      created_at: r.created_at,
      duration_ms: r.duration_ms == null ? null : Number(r.duration_ms),
    })),
  };
}
