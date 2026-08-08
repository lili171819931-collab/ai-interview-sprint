import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  dbBootstrapped?: boolean;
};

function bootstrapDatabaseUrl() {
  if (globalForPrisma.dbBootstrapped) return;
  globalForPrisma.dbBootstrapped = true;

  const isEphemeral = Boolean(process.env.VERCEL || process.env.DEMO_EPHEMERAL_FS === "true");
  if (!isEphemeral) return;

  const tmpDb = "/tmp/invoice-reimburse.db";
  const bundledCandidates = [
    path.join(process.cwd(), "prisma", "demo.db"),
    path.join(process.cwd(), "prisma", "dev.db"),
  ];
  const source = bundledCandidates.find((p) => fs.existsSync(p));

  // Always refresh from bundled seed on cold start so demo accounts exist.
  if (source) {
    fs.copyFileSync(source, tmpDb);
  }

  process.env.DATABASE_URL = `file:${tmpDb}`;
}

bootstrapDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Local disk in dev; /tmp on ephemeral hosts (Vercel-like demos). */
export function uploadsRoot() {
  if (process.env.VERCEL || process.env.DEMO_EPHEMERAL_FS === "true") {
    const p = path.join("/tmp", "uploads");
    fs.mkdirSync(p, { recursive: true });
    return p;
  }
  return path.join(process.cwd(), "uploads");
}
