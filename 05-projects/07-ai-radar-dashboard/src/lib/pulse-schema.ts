import { z } from "zod";

const opportunityCategory = z.enum([
  "launches",
  "search_trends",
  "oss_gap",
  "complaints",
  "tech_choice",
  "competition",
  "trends",
  "action",
]);

export const pulseOpportunitySchema = z.object({
  id: z.string().min(1),
  category: opportunityCategory,
  title: z.string().min(1),
  signal: z.string().min(1),
  plainSpeak: z.string().min(1),
  judgment: z.string().optional(),
  counterpoint: z.string().optional(),
});

export const builderPulseBriefSchema = z.object({
  generatedAt: z.string().min(10),
  reportDate: z.string().min(8),
  timezone: z.literal("Asia/Shanghai"),
  source: z.enum(["builderpulse-local", "builderpulse-remote", "seed"]),
  sourceUrl: z.string().url(),
  attribution: z.string().min(1),
  editorNote: z.string().min(1),
  plainBrief: z.string().min(1),
  buildIdea: z.object({
    title: z.string().min(1),
    whyNow: z.string().min(1),
    timeboxTitle: z.string().min(1),
    timeboxDetail: z.string().min(1),
  }),
  topSignals: z.array(z.string()).min(1).max(5),
  opportunities: z.array(pulseOpportunitySchema).min(1).max(20),
  trackRecord: z
    .array(
      z.object({
        date: z.string(),
        summary: z.string(),
        reportPath: z.string().optional(),
      }),
    )
    .max(14),
  methodNote: z.string().min(1),
});
