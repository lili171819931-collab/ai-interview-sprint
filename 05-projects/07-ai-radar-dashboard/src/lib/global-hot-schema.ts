import { z } from "zod";

export const globalHotItemSchema = z.object({
  platform: z.string(),
  region: z.enum(["国内", "海外"]),
  rank: z.number().int().positive(),
  title: z.string(),
  heat: z.union([z.string(), z.number(), z.null()]),
  url: z.string(),
  fetched_at: z.string(),
  source_id: z.string().optional(),
});

export const globalHotTopicsSnapshotSchema = z.object({
  generatedAt: z.string().min(10),
  timezone: z.literal("Asia/Shanghai"),
  source: z.enum(["agent-reach-scrapling", "seed"]),
  methodNote: z.string().min(1),
  agentReachUrl: z.string().url(),
  sources: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      region: z.string(),
      ok: z.boolean(),
      mode: z.string(),
      hits: z.number().int().nonnegative(),
      error: z.string().optional(),
    }),
  ),
  platforms: z.array(
    z.object({
      name: z.string(),
      region: z.enum(["国内", "海外"]),
      items: z.array(globalHotItemSchema),
    }),
  ),
  stats: z.object({
    platforms: z.number().int().nonnegative(),
    items: z.number().int().nonnegative(),
    sourcesOk: z.number().int().nonnegative(),
    sourcesTotal: z.number().int().nonnegative(),
    byRegion: z.object({
      国内: z.number().int().nonnegative(),
      海外: z.number().int().nonnegative(),
    }),
  }),
});
