import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "reimburse_uid";

export async function getCurrentUser() {
  const jar = await cookies();
  const uid = jar.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
