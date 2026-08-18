/**
 * Data integrity check — run before shipping.
 * Validates the seed dataset and score ranges.
 */
import { PROJECTS } from "../src/data/projects";
import { computeScores } from "../src/lib/engines";

let errors = 0;
const slugs = new Set<string>();
for (const p of PROJECTS) {
  if (slugs.has(p.slug)) { console.error(`DUPLICATE slug: ${p.slug}`); errors++; }
  slugs.add(p.slug);
  if (p.stars <= 0) { console.error(`${p.slug}: stars<=0`); errors++; }
  if (p.categories.length === 0) { console.error(`${p.slug}: no categories`); errors++; }
  const s = computeScores(p);
  for (const [k, v] of Object.entries(s)) {
    if (typeof v !== "number" || v < 0 || v > 100 || !Number.isFinite(v)) {
      console.error(`${p.slug}: bad ${k}=${v}`); errors++;
    }
  }
  if (p.growthHistory.length < 12) { console.error(`${p.slug}: short history`); errors++; }
  const last = p.growthHistory[p.growthHistory.length - 1];
  if (Math.abs(last.stars - p.stars) > p.stars * 0.02) { console.error(`${p.slug}: history endpoint mismatch`); errors++; }
}
console.log(`Validated ${PROJECTS.length} projects — ${errors === 0 ? "ALL OK ✅" : `${errors} ERRORS ❌`}`);
process.exit(errors === 0 ? 0 : 1);
