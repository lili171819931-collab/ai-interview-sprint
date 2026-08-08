import { z } from "zod";

const scoreValue = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const scoresSchema = z.object({
  breadth: scoreValue,
  quality: scoreValue,
  cost: scoreValue,
  speed: scoreValue,
  ecosystem: scoreValue,
  compliance: scoreValue,
  ease: scoreValue,
});

export const toolRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  vendor: z.string().min(1),
  category: z.enum(["assistant", "platform", "agent", "vertical"]),
  oneLiner: z.string().min(1).max(80),
  description: z.string().min(40).max(520),
  audience: z.array(z.enum(["consumer", "developer", "enterprise"])).min(1),
  capabilities: z.array(z.string()).min(3).max(10),
  pricingSummary: z.string().min(1),
  regions: z.array(z.enum(["cn", "global", "restricted"])).min(1),
  integration: z.array(z.enum(["web", "api", "ide", "plugin", "private"])).min(1),
  pros: z.array(z.string()).min(2).max(6),
  cons: z.array(z.string()).min(2).max(6),
  scores: scoresSchema,
  scoreEvidence: z.record(z.string()).default({}),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url().optional(),
        level: z.enum(["official", "first_hand", "secondary", "inferred"]),
        accessedAt: z.string(),
      }),
    )
    .min(1),
  changelogSummary: z.string().optional(),
  updatedAt: z.string(),
  status: z.enum(["active", "stale", "deprecated"]),
  website: z.string().url().optional(),
});

const liveFetchSchema = z.object({
  fetchedAt: z.string(),
  offline: z.boolean(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      sourceId: z.string(),
      label: z.string(),
      toolIds: z.array(z.string()),
      status: z.enum(["ok", "fail"]),
      title: z.string().optional(),
      url: z.string().optional(),
      publishedAt: z.string().optional(),
      error: z.string().optional(),
    }),
  ),
});

export const dailyBundleSchema = z.object({
  generatedAt: z.string().datetime({ offset: true }).or(z.string().min(10)),
  timezone: z.literal("Asia/Shanghai"),
  tools: z.array(toolRecordSchema).min(8),
  highlights: z
    .array(z.object({ toolId: z.string(), note: z.string() }))
    .max(5),
  methodNote: z.string().min(1),
  liveFetch: liveFetchSchema.optional(),
});

export function assertNoExtremeInferred(tools: z.infer<typeof toolRecordSchema>[]) {
  for (const t of tools) {
    const onlyInferred = t.sources.every((s) => s.level === "inferred");
    if (!onlyInferred) continue;
    for (const v of Object.values(t.scores)) {
      if (v === 1 || v === 5) {
        throw new Error(
          `Tool ${t.id}: inferred-only sources cannot support extreme score ${v}`,
        );
      }
    }
  }
}
