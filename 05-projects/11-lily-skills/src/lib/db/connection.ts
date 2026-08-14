import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export type Db = DatabaseSync;

let db: DatabaseSync | null = null;

export function resolveDbPath(): string {
  const fromEnv = process.env.DATABASE_PATH;
  if (fromEnv) return fromEnv;
  const root = path.resolve(process.cwd());
  return path.join(root, "data", "lily-skills.db");
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

/** Closes and resets the singleton (used in tests). */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function resetDbForTests(dbPath = ":memory:"): DatabaseSync {
  closeDb();
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}
