import { z } from "zod";

export const trendRadarHotItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  platformId: z.string(),
  platformName: z.string(),
  rank: z.number().int().positive(),
  url: z.string(),
  firstSeen: z.string(),
  lastSeen: z.string(),
  aiRelated: z.boolean(),
});

export const trendRadarSnapshotSchema = z.object({
  generatedAt: z.string().min(10),
  reportDate: z.string().min(8),
  timezone: z.literal("Asia/Shanghai"),
  source: z.enum(["trendradar-local", "seed"]),
  sourceUrl: z.string().url(),
  crawlTime: z.string(),
  totalItems: z.number().int().nonnegative(),
  successPlatforms: z.number().int().nonnegative(),
  failedPlatforms: z.number().int().nonnegative(),
  platforms: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(["success", "failed", "unknown"]),
      itemCount: z.number().int().nonnegative(),
    }),
  ),
  items: z.array(trendRadarHotItemSchema).min(1),
  htmlReportUrl: z.string(),
  methodNote: z.string().min(1),
});
