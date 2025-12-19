import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Single-doctor setup: show all upcoming slots for the doctor(s)
  const slots = await prisma.availabilitySlot.findMany({
    where: { startTimeUtc: { gt: now } },
    orderBy: { startTimeUtc: "asc" },
    select: {
      id: true,
      doctorId: true,
      startTimeUtc: true,
      endTimeUtc: true,
      doctor: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ slots });
}
