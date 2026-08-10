import { existsSync, readFileSync } from "fs";
import path from "path";
import { buildSeedPulseBrief } from "@/data/pulse-seed";
import { builderPulseBriefSchema } from "@/lib/pulse-schema";
import type { BuilderPulseBrief } from "@/lib/pulse-types";

const PULSE_PATH = path.join(process.cwd(), "data", "builder-pulse-daily.json");

export type PulseBriefView = {
  brief: BuilderPulseBrief;
  fromFile: boolean;
};

export function getPulseBriefView(): PulseBriefView {
  if (existsSync(PULSE_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(PULSE_PATH, "utf8"));
      const parsed = builderPulseBriefSchema.parse(raw) as BuilderPulseBrief;
      return { brief: parsed, fromFile: true };
    } catch {
      // fall through
    }
  }
  return {
    brief: buildSeedPulseBrief(new Date().toISOString()),
    fromFile: false,
  };
}
