import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function assertAdminOrDoctor(role?: string) {
  return role === "ADMIN" || role === "DOCTOR";
}

const createSchema = z.object({
  doctorId: z.string().min(1),
  startTimeUtc: z.string().datetime(),
  endTimeUtc: z.string().datetime(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slots = await prisma.availabilitySlot.findMany({
    orderBy: { startTimeUtc: "asc" },
    select: {
      id: true,
      doctorId: true,
      startTimeUtc: true,
      endTimeUtc: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validation = createSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { doctorId, startTimeUtc, endTimeUtc } = validation.data;

  const start = new Date(startTimeUtc);
  const end = new Date(endTimeUtc);

  if (!(start instanceof Date) || isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startTimeUtc" }, { status: 400 });
  }
  if (!(end instanceof Date) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid endTimeUtc" }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json(
      { error: "endTimeUtc must be after startTimeUtc" },
      { status: 400 }
    );
  }

  const profile = await prisma.doctorProfile.findUnique({
  where: { userId: doctorId },
  select: { userId: true },
});

if (!profile) {
  return NextResponse.json(
    { error: "Doctor profile not configured. Create DoctorProfile first." },
    { status: 400 }
  );
}


  // Overlap check (any slot where start < newEnd AND end > newStart)
  const overlap = await prisma.availabilitySlot.findFirst({
    where: {
      doctorId,
      startTimeUtc: { lt: end },
      endTimeUtc: { gt: start },
    },
    select: { id: true },
  });

  if (overlap) {
    return NextResponse.json(
      { error: "This availability overlaps with an existing slot." },
      { status: 409 }
    );
  }

  const slot = await prisma.availabilitySlot.create({
    data: {
      doctorId,
      startTimeUtc: start,
      endTimeUtc: end,
    },
    select: { id: true, doctorId: true, startTimeUtc: true, endTimeUtc: true },
  });

  return NextResponse.json({ slot }, { status: 201 });
}
