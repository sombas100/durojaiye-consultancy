import { prisma } from "./prisma";

export async function hasActiveSubscription(userId: string) {
    const now = new Date();

    const sub = await prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE', OR:  [{ endDate: null }, { endDate: { gt: now } }],  
    },
    select: { id: true, status: true, endDate: true, planId: true }
    })

    return !!sub;
}