import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

import {
  sendPatientConfirmedEmail,
  sendPatientCancelledByClinicEmail,
} from "@/lib/email/send";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]),
});

function assertAdminOrDoctor(role?: string) {
  return role === "ADMIN" || role === "DOCTOR";
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing appointment id" }, { status: 400 });
    }

    const body = await request.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.message }, { status: 400 });
    }

    const newStatus = validation.data.status;

    // Get appointment details needed for slot reopen + emailing
    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        doctorId: true,
        startTimeUtc: true,
        endTimeUtc: true,
        patient: { select: { name: true, surname: true, email: true } },
      },
    });

    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Prevent changing a completed appointment (optional safety)
    if (appt.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Completed appointments cannot be modified." },
        { status: 400 }
      );
    }

    const start = new Date(appt.startTimeUtc);
    const end = new Date(appt.endTimeUtc);

    const txResult = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: { status: newStatus },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          startTimeUtc: true,
          endTimeUtc: true,
          doctorId: true,
          patient: { select: { name: true, surname: true, email: true } },
        },
      });

      let reopened = false;

      // If doctor cancels, reopen slot (if it doesn't overlap)
      if (newStatus === "CANCELLED") {
        const existingOverlap = await tx.availabilitySlot.findFirst({
          where: {
            doctorId: updated.doctorId,
            startTimeUtc: { lt: end },
            endTimeUtc: { gt: start },
          },
          select: { id: true },
        });

        if (!existingOverlap) {
          await tx.availabilitySlot.create({
            data: {
              doctorId: updated.doctorId,
              startTimeUtc: start,
              endTimeUtc: end,
            },
          });
          reopened = true;
        }
      }

      return { updated, reopened };
    });

    // fire-and-forget patient notification
    (async () => {
      try {
        const patientName =
          `${txResult.updated.patient.name ?? ""} ${txResult.updated.patient.surname ?? ""}`
            .trim() ||
          txResult.updated.patient.email ||
          "Patient";

        if (newStatus === "CONFIRMED") {
          await sendPatientConfirmedEmail({
            patientEmail: txResult.updated.patient.email,
            patientName,
            startTimeUtc: txResult.updated.startTimeUtc,
            endTimeUtc: txResult.updated.endTimeUtc,
          });
        }

        if (newStatus === "CANCELLED") {
          await sendPatientCancelledByClinicEmail({
            patientEmail: txResult.updated.patient.email,
            patientName,
            startTimeUtc: txResult.updated.startTimeUtc,
            endTimeUtc: txResult.updated.endTimeUtc,
          });
        }
      } catch (e) {
        console.error("Patient notification email failed:", e);
      }
    })();

    return NextResponse.json({
      appointment: txResult.updated,
      reopenedSlot: txResult.reopened,
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    console.error("PATCH admin appointment failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
