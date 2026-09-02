import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function getCurrentBusiness() {
  const session = await getSession();
  if (!session) return null;
  return prisma.business.findFirst({ where: { ownerId: session.userId } });
}
