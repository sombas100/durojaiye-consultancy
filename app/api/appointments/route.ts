import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/subscription";
import { sendDoctorBookedEmail } from "@/lib/email/send";
import { sendPatientBookedEmail } from "@/lib/email/send";



export const runtime = "nodejs";

const schema = z.object({
  slotId: z.string().min(1),
  extraMinutes: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only patients should book
  if (session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const validation = schema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
  }

  const { slotId, extraMinutes } = validation.data;

  // Must be in 10-min increments
  if (extraMinutes % 10 !== 0) {
    return NextResponse.json(
      { error: "Extra minutes must be in 10-minute increments." },
      { status: 400 }
    );
  }

  const patientId = session.user.id;
  const active = await hasActiveSubscription(patientId);
  if (!active)
    return NextResponse.json(
  { error: 'User must have an active subscription to book a consultation.'},
   { status: 403 })

  try {
    // Fetch slot + doctor pricing config
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        doctorId: true,
        startTimeUtc: true,
        endTimeUtc: true,
      },
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: slot.doctorId },
      select: {
        baseDurationMinutes: true,
        basePriceKobo: true,
        extra10MinPriceKobo: true,
      },
    });

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not configured." },
        { status: 500 }
      );
    }

    const baseDurationMinutes = doctorProfile.baseDurationMinutes; // e.g. 30
    const extraBlocks = extraMinutes / 10;

    // Base is free with subscription (your choice), so basePriceKobo likely 0.
    // Total here is only extras.
    const totalPriceKobo =
      (doctorProfile.basePriceKobo ?? 0) + extraBlocks * doctorProfile.extra10MinPriceKobo;

    const start = new Date(slot.startTimeUtc);
    const end = new Date(start.getTime() + (baseDurationMinutes + extraMinutes) * 60_000);

    // Ensure appointment fits within the slot window
    if (end > new Date(slot.endTimeUtc)) {
      return NextResponse.json(
        { error: "Selected duration exceeds the available slot." },
        { status: 400 }
      );
    }

    // Extra safety: ensure doctor has no overlapping appointment (non-cancelled)
    const overlap = await prisma.appointment.findFirst({
      where: {
        doctorId: slot.doctorId,
        status: { not: "CANCELLED" },
        startTimeUtc: { lt: end },
        endTimeUtc: { gt: start },
      },
      select: { id: true },
    });

    if (overlap) {
      return NextResponse.json(
        { error: "This time is already booked." },
        { status: 409 }
      );
    }

    // Reserve atomically: create appointment + delete slot so others can’t book it
    const result = await prisma.$transaction(async (tx) => {
      // Re-check slot exists inside transaction
      const slotInsideTx = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
        select: { id: true },
      });

      if (!slotInsideTx) {
        throw Object.assign(new Error("SLOT_ALREADY_TAKEN"), { code: "SLOT_ALREADY_TAKEN" });
      }

      const appointment = await tx.appointment.create({
        data: {
          patientId,
          doctorId: slot.doctorId,
          startTimeUtc: start,
          endTimeUtc: end,
          baseDurationMinutes,
          extraMinutes,
          extraBlocks,
          totalPriceKobo,
          status: totalPriceKobo > 0 ? "PENDING_PAYMENT" : "CONFIRMED",
        },
        select: { id: true, status: true, totalPriceKobo: true },
      });

      await tx.availabilitySlot.delete({ where: { id: slotId } });

      return appointment;
    });
    
      
      (async () => {
          try {
              const [patient, doctor] = await Promise.all([
              prisma.user.findUnique({
              where: { id: patientId },
              select: { name: true, surname: true, email: true },
            }),
            prisma.user.findUnique({
              where: { id: slot.doctorId },
              select: { name: true, email: true },
            }),
          ]);

      const patientName =
        `${patient?.name ?? ""} ${patient?.surname ?? ""}`.trim() ||
        patient?.email ||
        "Patient";

    const doctorEmail = process.env.DOCTOR_NOTIFICATION_EMAIL_OVERRIDE || doctor?.email || process.env.DOCTOR_NOTIFICATION_EMAIL;
    console.log("BOOKING EMAIL → doctorEmail:", doctorEmail);

    if (!doctorEmail) {
      console.log("BOOKING EMAIL → no doctorEmail, skipping");
      return;
    }

      await sendDoctorBookedEmail({
        doctorEmail,
        doctorName: doctor?.name,
        patientName,
        patientEmail: patient?.email || session.user.email || "",
        startTimeUtc: start,
        endTimeUtc: end,
        extraMinutes,
        statusLabel: result.status,
      });
        console.log("BOOKING EMAIL → sent");
      } catch (e) {
        console.error("Doctor booking email failed:", e);
      }
        })();

      (async () => {
        try {
          const patient = await prisma.user.findUnique({
            where: { id: patientId },
            select: { name: true, surname: true, email: true },
          });

      const patientEmail = patient?.email || session.user.email;
        if (!patientEmail) return;

      const patientName =
        `${patient?.name ?? ""} ${patient?.surname ?? ""}`.trim() ||
        patientEmail ||
        "Patient";

      await sendPatientBookedEmail({
        patientEmail,
        patientName,
        startTimeUtc: start,
        endTimeUtc: end,
        statusLabel: result.status,
      });
    } catch (e) {
      console.error("Patient booked email failed:", e);
    }
  })();


    return NextResponse.json({ appointment: result }, { status: 201 });
    
  } catch (err: any) {
    if (err?.code === "SLOT_ALREADY_TAKEN") {
      return NextResponse.json(
        { error: "Slot was just booked by someone else. Please pick another." },
        { status: 409 }
      );
    }

    console.error("Create appointment failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
  
}
