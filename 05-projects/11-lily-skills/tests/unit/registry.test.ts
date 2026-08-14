import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTest, teardownTest, type TestEnv } from "../helpers";
import { createSkill, getSkill, listSkills, listCategories, listTags, deleteSkill } from "../../src/lib/core/skill-registry";
import type { Manifest } from "../../src/lib/core/types";

let env: TestEnv;
beforeEach(() => { env = setupTest(); });
afterEach(() => { teardownTest(); });

describe("Skill Registry", () => {
  it("scans built-in skills with categories and tags", () => {
    const skills = listSkills(env.db, {});
    expect(skills.length).toBeGreaterThanOrEqual(10);
    expect(skills.every((s) => s.category)).toBe(true);
    const categories = listCategories(env.db);
    expect(categories.length).toBeGreaterThanOrEqual(15);
    const tags = listTags(env.db);
    expect(tags.length).toBeGreaterThan(20);
  });

  it("registers a new skill from manifest and auto-tags it", () => {
    const skill = createSkill(env.db, {
      name: "Test Skill",
      version: "1.0.0",
      description: "test",
      category: "Development",
      tags: ["alpha", "beta"],
      execution_type: "echo",
      input_schema: { type: "object", properties: { message: { type: "string", required: true } }, required: ["message"] },
      permissions: ["read"],
      risk_level: "low",
    });
    expect(skill.slug).toBe("test-skill");
    expect(skill.tags).toContain("alpha");
    const found = getSkill(env.db, skill.id);
    expect(found?.name).toBe("Test Skill");
  });

  it("upserts by slug without duplication", () => {
    const manifest: Manifest = {
      name: "Dup Skill", version: "1.0.0", description: "a", category: "Other",
      tags: [], execution_type: "echo", permissions: [], risk_level: "low",
    };
    createSkill(env.db, manifest, { upsert: true });
    createSkill(env.db, { ...manifest, description: "b" }, { upsert: true });
    const all = listSkills(env.db, { q: "Dup" });
    expect(all.length).toBe(1);
    expect(all[0].description).toBe("b");
  });

  it("deletes a skill", () => {
    const skill = createSkill(env.db, { name: "To Delete", version: "1", description: "x", category: "Other", tags: [], execution_type: "echo", permissions: [], risk_level: "low" });
    deleteSkill(env.db, skill.id);
    expect(getSkill(env.db, skill.id)).toBeNull();
  });

  it("records versions", () => {
    const skill = createSkill(env.db, { name: "Versioned", version: "1.0.0", description: "v1", category: "Other", tags: [], execution_type: "echo", permissions: [], risk_level: "low" });
    const versions = env.db.prepare("SELECT version FROM skill_versions WHERE skill_id = ?").all(skill.id) as { version: string }[];
    expect(versions.map((v) => v.version)).toContain("1.0.0");
  });
});
