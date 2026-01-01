import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sub = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "PENDING", "CANCELLED", "EXPIRED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      cancelAtPeriodEnd: true,
      plan: {
        select: { name: true, priceKobo: true, interval: true },
      },
    },
  });

  return NextResponse.json({ subscription: sub });
}
