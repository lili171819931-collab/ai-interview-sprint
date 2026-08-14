import fs from "node:fs";
import path from "node:path";
import { resolveDbPath, closeDb } from "../src/lib/db/connection";

const dbPath = resolveDbPath();
for (const suffix of ["", "-wal", "-shm", "-journal"]) {
  const p = `${dbPath}${suffix}`;
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`removed ${p}`);
  }
}
closeDb();
console.log("database reset complete");
