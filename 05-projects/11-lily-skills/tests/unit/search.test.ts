import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTest, teardownTest, type TestEnv } from "../helpers";
import { searchSkills, tokenize } from "../../src/lib/core/search";
import { recommendSkills } from "../../src/lib/core/recommendation";

let env: TestEnv;
beforeEach(() => { env = setupTest(); });
afterEach(() => { teardownTest(); });

describe("Skill Search", () => {
  it("finds by keyword", () => {
    const res = searchSkills(env.db, "calculator");
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].skill.name).toBe("Calculator");
  });

  it("finds by natural language (semantic)", () => {
    const res = searchSkills(env.db, "帮我分析 TikTok 上 AI Agent 的热点并生成选题");
    expect(res.some((r) => r.skill.slug === "trend-scanner")).toBe(true);
  });

  it("ranks semantic match above unrelated", () => {
    const res = searchSkills(env.db, "计算 (12+3)*4");
    expect(res[0].skill.slug).toBe("calculator");
  });

  it("tokenizes Chinese bigrams and English", () => {
    const tokens = tokenize("热点 Trend");
    expect(tokens).toContain("热点");
    expect(tokens).toContain("trend");
  });
});

describe("Recommendation Engine", () => {
  it("returns top-K with reasons", () => {
    const recs = recommendSkills(env.db, "帮我分析 TikTok 热点生成选题", { limit: 4 });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(4);
    expect(recs.every((r) => r.reasons.length > 0)).toBe(true);
    expect(recs[0].score).toBeGreaterThanOrEqual(recs[recs.length - 1].score);
  });
});
