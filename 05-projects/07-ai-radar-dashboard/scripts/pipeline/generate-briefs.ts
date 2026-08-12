/**
 * Build daily brief JSON from events snapshot.
 *   npm run intel:briefs
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { buildDailyBrief } from "../../src/lib/intel/build-brief";

const root = path.join(__dirname, "..", "..");
const dir = path.join(root, "data", "briefs");
mkdirSync(dir, { recursive: true });
const brief = buildDailyBrief();
const dated = path.join(dir, `daily-${brief.reportDate}.json`);
const latest = path.join(dir, "latest.json");
const body = JSON.stringify(brief, null, 2);
writeFileSync(dated, body);
writeFileSync(latest, body);
console.log(`[intel:briefs] wrote ${dated} · top ${brief.top.length}`);
