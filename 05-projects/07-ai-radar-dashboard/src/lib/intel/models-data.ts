import { existsSync, readFileSync } from "fs";
import path from "path";

export type ModelRow = {
  rank: number;
  name: string;
  vendor: string;
  releasedAt: string;
  coverage: number;
  inputUsd: number | null;
  outputUsd: number | null;
  score: number;
  priceLabel?: string;
};

export type ModelLeaderboard = {
  schemaVersion: number;
  fetchedAt: string;
  source: string;
  title: string;
  methodNote: string;
  listCount: number;
  items: ModelRow[];
};

const FILE = path.join(process.cwd(), "data", "models", "leaderboard.json");

export function getModelLeaderboard(): ModelLeaderboard | null {
  try {
    if (!existsSync(FILE)) return null;
    return JSON.parse(readFileSync(FILE, "utf8")) as ModelLeaderboard;
  } catch (err) {
    console.warn("[models-data] parse failed", err);
    return null;
  }
}

export function formatUsd(n: number | null): string {
  if (n == null) return "—";
  if (Number.isInteger(n)) return `$${n}`;
  return `$${n}`;
}
