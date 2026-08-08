import { z } from "zod";

const pool = z.enum([
  "model_leaderboard",
  "tool_directory",
  "news_brief",
  "papers_research",
  "official_release",
]);

export const radarSignalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum([
    "model",
    "tool",
    "paper",
    "news",
    "official",
    "funding",
    "ranking",
  ]),
  pool,
  heat: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  rank: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]),
  updatedAt: z.string().min(8),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1),
  pmOpportunity: z.string().min(1),
  summary: z.string().min(1),
  entities: z.array(z.string()).optional(),
  factKind: z.enum(["confirmed", "inferred", "rumor", "official"]),
  riskNote: z.string().optional(),
});

export const radarDailyReportSchema = z.object({
  generatedAt: z.string().min(10),
  timezone: z.literal("Asia/Shanghai"),
  reportDate: z.string().min(8),
  kind: z.enum(["daily", "weekly"]),
  executiveSummary: z.array(z.string()).min(1).max(5),
  signals: z.array(radarSignalSchema).min(1),
  rankingNotes: z.array(z.string()).min(1),
  riskAlerts: z.array(z.string()).min(1),
  opportunities: z.array(z.string()).min(1),
  actions: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        priority: z.enum(["P0", "P1", "P2"]),
      }),
    )
    .min(1)
    .max(8),
  monitorPools: z
    .array(
      z.object({
        pool,
        label: z.string(),
        sourceCount: z.number().int().nonnegative(),
      }),
    )
    .length(5),
  methodNote: z.string().min(1),
});
