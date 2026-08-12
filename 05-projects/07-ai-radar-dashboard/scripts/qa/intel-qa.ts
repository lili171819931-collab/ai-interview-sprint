/**
 * Phase 11 QA — schema + golden tool/intent checks
 *   npm run intel:qa
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { detectIntent } from "../../src/lib/intel/agent";
import {
  generate_report,
  get_trending_topics,
  search_news,
} from "../../src/lib/intel/agent-tools";
import { dailyBriefSchema, eventsSnapshotSchema, ingestSnapshotSchema } from "../../src/lib/intel/schema";
import { buildDailyBrief } from "../../src/lib/intel/build-brief";

const root = path.join(__dirname, "..", "..");

function readJson(rel: string) {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

console.log("[intel:qa] schema snapshots");
test("events/latest.json matches schema", () => {
  const p = "data/events/latest.json";
  assert.ok(existsSync(path.join(root, p)), `missing ${p}`);
  eventsSnapshotSchema.parse(readJson(p));
});

test("items/latest.json matches schema (if present)", () => {
  const p = "data/items/latest.json";
  if (!existsSync(path.join(root, p))) {
    console.log("    (skip — no items snapshot)");
    return;
  }
  ingestSnapshotSchema.parse(readJson(p));
});

console.log("[intel:qa] agent intent golden");
test("AI 日报 → report_ai", () => {
  assert.equal(detectIntent("今天全球AI发生了什么？").intent, "report_ai");
});
test("中美对比 → compare_regions", () => {
  assert.equal(detectIntent("对比中国和美国AI热点").intent, "compare_regions");
});
test("增长最快 → rising", () => {
  assert.equal(detectIntent("增长最快的AI话题").intent, "rising");
});

console.log("[intel:qa] agent tools");
test("get_trending_topics returns events", () => {
  const r = get_trending_topics(3, "all");
  assert.equal(r.ok, true);
  const n = (r.data as { count: number }).count;
  assert.ok(n >= 0);
});
test("search_news AI hits", () => {
  const r = search_news("AI", 5);
  assert.equal(r.ok, true);
});
test("generate_report exposes events", () => {
  const r = generate_report("ai");
  assert.equal(r.ok, true);
  assert.ok(Array.isArray((r.data as { events: unknown[] }).events));
});

console.log("[intel:qa] brief build");
test("buildDailyBrief validates", () => {
  const brief = buildDailyBrief();
  dailyBriefSchema.parse(brief);
  assert.ok(brief.reportDate);
  assert.ok(Array.isArray(brief.top));
});

console.log("[intel:qa] all passed");
