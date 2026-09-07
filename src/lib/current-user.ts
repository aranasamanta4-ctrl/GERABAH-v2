import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

/** Business milik user — sebagai owner, atau sebagai staf yang ditautkan. */
export async function getCurrentBusiness() {
  const session = await getSession();
  if (!session) return null;

  const owned = await prisma.business.findFirst({ where: { ownerId: session.userId } });
  if (owned) return owned;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user?.memberOfBusinessId) {
    return prisma.business.findUnique({ where: { id: user.memberOfBusinessId } });
  }
  return null;
}

export type Role = "owner" | "staff";

/** User + business + peran dalam satu panggilan. */
export async function getSessionContext() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  const owned = await prisma.business.findFirst({ where: { ownerId: user.id } });
  if (owned) return { user, business: owned, role: "owner" as Role };

  if (user.memberOfBusinessId) {
    const business = await prisma.business.findUnique({ where: { id: user.memberOfBusinessId } });
    if (business) return { user, business, role: "staff" as Role };
  }
  return { user, business: null, role: "owner" as Role };
}
