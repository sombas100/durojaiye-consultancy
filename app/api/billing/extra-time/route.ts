import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function assertEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PATIENT")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { appointmentId } = await req.json().catch(() => ({}));
  if (!appointmentId) {
    return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
  }

  const secretKey = assertEnv("PAYSTACK_SECRET_KEY");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId: session.user.id },
    select: {
      id: true,
      status: true,
      extraMinutes: true,
      extraPriceKobo: true,         
      patient: { select: { email: true } },
    },
  });

  if (!appt) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  // ✅ route is for EXTRA ONLY
  if (appt.extraMinutes <= 0 || appt.extraPriceKobo <= 0) {
    return NextResponse.json({ error: "No extra payment required." }, { status: 400 });
  }

  if (appt.status !== "PENDING_PAYMENT") {
    return NextResponse.json(
      { error: "This appointment is not awaiting extra payment." },
      { status: 400 }
    );
  }

  const email = appt.patient.email;
  if (!email) {
    return NextResponse.json({ error: "User email is required." }, { status: 400 });
  }

  const existingPending = await prisma.payment.findFirst({
    where: { appointmentId: appt.id, type: "EXTRA_MINUTES", status: "PENDING" },
    select: { id: true, reference: true },
  });

  if (existingPending) {
  // if it already has a ref, they must complete that one
  if (existingPending.reference) {
    return NextResponse.json(
      { error: "You already have a pending extra-minutes payment. Please complete it." },
      { status: 400 }
    );
  }
}


  const payment = existingPending
    ? { id: existingPending.id }
    : await prisma.payment.create({
        data: {
          userId: session.user.id,
          appointmentId: appt.id,
          type: "EXTRA_MINUTES",
          status: "PENDING",
          amountKobo: appt.extraPriceKobo,   
          currency: "NGN",
          provider: "PAYSTACK",
        },
        select: { id: true },
      });

  const callbackUrl = `${appUrl}/billing/extra/callback?appointmentId=${appt.id}`;


  const payload = {
    email,
    amount: appt.extraPriceKobo,         
    currency: "NGN",
    callback_url: callbackUrl,
    metadata: {
      type: "EXTRA_MINUTES",
      userId: session.user.id,
      appointmentId: appt.id,
      paymentId: payment.id,
    },
  };

  const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const psData = await psRes.json().catch(() => null);

  if (!psRes.ok) {
    console.error("Paystack initialize failed:", psData);

    // ✅ mark failed so they can retry cleanly
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      { error: psData?.message || "Failed to initialize Paystack transaction." },
      { status: 500 }
    );
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { reference: psData.data.reference },
  });

  return NextResponse.json({
    authorizationUrl: psData.data.authorization_url,
    reference: psData.data.reference,
  });
}
