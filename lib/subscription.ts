import { prisma } from "./prisma";

export async function hasActiveSubscription(userId: string) {
  const now = new Date();

  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return !!sub;
}
