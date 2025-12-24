import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  action: z.literal("CANCEL"),
});

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (!id) {
      return NextResponse.json({ error: "Missing appointment id" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Ensure appointment belongs to this patient + get time window needed to reopen slot
    const appt = await prisma.appointment.findFirst({
      where: { id, patientId: session.user.id },
      select: {
        id: true,
        status: true,
        doctorId: true,
        startTimeUtc: true,
        endTimeUtc: true,
      },
    });

    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Only allow cancel if not finished already
    if (appt.status === "COMPLETED" || appt.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This appointment cannot be cancelled." },
        { status: 400 }
      );
    }

    const start = new Date(appt.startTimeUtc);
    const end = new Date(appt.endTimeUtc);

    const result = await prisma.$transaction(async (tx) => {
      // 1) Cancel the appointment
      const updated = await tx.appointment.update({
        where: { id: appt.id },
        data: { status: "CANCELLED" },
        select: { id: true, status: true, updatedAt: true },
      });

      // 2) Re-open slot IF it doesn't overlap an existing slot (avoid duplicates)
      const existingOverlap = await tx.availabilitySlot.findFirst({
        where: {
          doctorId: appt.doctorId,
          startTimeUtc: { lt: end },
          endTimeUtc: { gt: start },
        },
        select: { id: true },
      });

      let reopened = false;

      if (!existingOverlap) {
        await tx.availabilitySlot.create({
          data: {
            doctorId: appt.doctorId,
            startTimeUtc: start,
            endTimeUtc: end,
          },
        });
        reopened = true;
      }

      return { updated, reopened };
    });

    return NextResponse.json({
      appointment: result.updated,
      reopenedSlot: result.reopened,
    });
  } catch (err) {
    console.error("PATCH /api/my-appointments/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
