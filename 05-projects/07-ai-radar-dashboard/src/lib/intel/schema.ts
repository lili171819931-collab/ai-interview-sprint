import { z } from "zod";

export const intelEntitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["org", "person", "product", "place", "other"]),
});

export const intelEngagementSchema = z.object({
  rank: z.number().nullable().optional(),
  hot: z.union([z.number(), z.string()]).nullable().optional(),
  comments: z.number().nullable().optional(),
  likes: z.number().nullable().optional(),
});

export const intelItemSchema = z.object({
  id: z.string().min(8),
  source: z.string().min(1),
  platform: z.string().min(1),
  title: z.string().min(1),
  url: z.string(),
  author: z.string(),
  published_at: z.string(),
  fetched_at: z.string(),
  category: z.string(),
  keywords: z.array(z.string()),
  summary: z.string(),
  raw_content: z.string(),
  engagement: intelEngagementSchema,
  rank: z.number().nullable(),
  source_reliability: z.number().min(0).max(1),
  language: z.string(),
  country: z.string(),
  entities: z.array(intelEntitySchema),
  embedding: z.array(z.number()).nullable(),
});

export const ingestSnapshotSchema = z.object({
  generatedAt: z.string(),
  reportDate: z.string(),
  timezone: z.literal("Asia/Shanghai"),
  adapters: z.array(
    z.object({
      id: z.string(),
      ok: z.boolean(),
      itemCount: z.number(),
      error: z.string().optional(),
    }),
  ),
  totalItems: z.number(),
  items: z.array(intelItemSchema),
});

export const eventScoreBreakdownSchema = z.object({
  heat: z.number(),
  velocity: z.number(),
  crossPlatform: z.number(),
  sourceAuthority: z.number(),
  recency: z.number(),
  userRelevance: z.number(),
});

export const eventAnalysisSchema = z.object({
  one_liner: z.string(),
  what: z.string(),
  why: z.string(),
  who: z.array(z.string()),
  impact: z.string(),
  trend: z.string(),
  confidence: z.number(),
  analysisMode: z.enum(["heuristic", "llm"]),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      platform: z.string(),
    }),
  ),
});

export const intelEventSchema = z.object({
  id: z.string().min(8),
  representative_title: z.string().min(1),
  related_items: z.array(z.string()),
  platforms: z.array(z.string()),
  countries: z.array(z.string()),
  categories: z.array(z.string()),
  first_seen: z.string(),
  last_seen: z.string(),
  source_count: z.number(),
  platform_count: z.number(),
  heat_score: z.number(),
  velocity: z.number(),
  trend_status: z.enum(["emerging", "rising", "hot", "stable", "cooling", "fading"]),
  score_breakdown: eventScoreBreakdownSchema,
  user_relevance: z.number(),
  sample_items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      platform: z.string(),
      country: z.string(),
    }),
  ),
  analysis: eventAnalysisSchema.optional(),
});

export const eventsSnapshotSchema = z.object({
  generatedAt: z.string(),
  reportDate: z.string(),
  timezone: z.literal("Asia/Shanghai"),
  methodNote: z.string(),
  itemCount: z.number(),
  eventCount: z.number(),
  thresholds: z.object({
    titleSimilarity: z.number(),
  }),
  events: z.array(intelEventSchema),
});

export const userInterestsSchema = z.object({
  updatedAt: z.string().optional(),
  categories: z.array(z.string()),
  keywords: z.array(z.string()),
  notes: z.string().optional(),
});

export const dailyBriefItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  heat_score: z.number(),
  velocity: z.number(),
  trend_status: z.enum(["emerging", "rising", "hot", "stable", "cooling", "fading"]),
  platforms: z.array(z.string()),
  one_liner: z.string(),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      platform: z.string(),
    }),
  ),
});

export const dailyBriefSchema = z.object({
  kind: z.enum(["daily", "ai"]),
  generatedAt: z.string(),
  reportDate: z.string(),
  timezone: z.literal("Asia/Shanghai"),
  headline: z.string(),
  summary: z.string(),
  statusCounts: z.record(z.number()),
  top: z.array(dailyBriefItemSchema),
  rising: z.array(dailyBriefItemSchema),
  aiTop: z.array(dailyBriefItemSchema),
  dashboardPath: z.string(),
  eventCount: z.number(),
  itemCount: z.number(),
});
