import path from "node:path";
import { bootstrap, getContext } from "../src/lib/bootstrap";
import { scanSkillFolder } from "../src/lib/core/skill-registry";

bootstrap();
const { db } = getContext();
const folder = path.join(process.cwd(), "skills");
const results = scanSkillFolder(db, folder);
console.log(`scanned ${results.length} skills:`);
for (const s of results) console.log(`  - ${s.name} (${s.execution_type}) [${s.category?.name ?? "未分类"}]`);
