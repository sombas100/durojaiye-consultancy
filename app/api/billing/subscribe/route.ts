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

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secretKey = assertEnv("PAYSTACK_SECRET_KEY");
  const planCode = assertEnv("PAYSTACK_PLAN_CODE");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // you can store this plan in DB, but since you have only one plan,
  // this keeps it simple while still saving the subscription/payment records.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "User email is required." }, { status: 400 });
  }

  const existingActive = await prisma.subscription.findFirst({
  where: { userId: user.id, status: "ACTIVE" },
  select: { id: true },
});

if (existingActive) {
  return NextResponse.json(
    { error: "You already have an active subscription." },
    { status: 400 }
  );
}




  // Create DB records first (PENDING) so we can link webhook events reliably
  const created = await prisma.$transaction(async (tx) => {
    // Ensure you have a Plan row, OR create one once in a seed/admin page.
    // If you already have a Plan row, fetch it by paystackPlanCode.
    let plan = await tx.plan.findFirst({
      where: { paystackPlanCode: planCode },
      select: { id: true, paystackPlanCode: true },
    });

    if (!plan) {
      plan = await tx.plan.create({
        data: {
          name: "Monthly Subscription",
          priceKobo: 5_000_000, 
          interval: "monthly",
          paystackPlanCode: planCode,
          isActive: true,
        },
        select: { id: true, paystackPlanCode: true },
      });
    }
    

    const sub = await tx.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "PENDING",
      },
      select: { id: true },
    });

    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        type: "SUBSCRIPTION",
        status: "PENDING",
        amountKobo: 5_000_000,
        currency: "NGN",
        subscriptionId: sub.id,
        provider: "PAYSTACK",
      },
      select: { id: true },
    });

    return { subscriptionId: sub.id, paymentId: payment.id };
  });

  // Initialize Paystack transaction with plan code
  const callbackUrl = `${appUrl}/billing/callback`; // you can build this page later
  const payload = {
  email: user.email,
  amount: 5_000_000, 
  currency: "NGN",
  plan: planCode,
  callback_url: callbackUrl,
  metadata: {
    type: "SUBSCRIPTION",
    userId: user.id,
    subscriptionId: created.subscriptionId,
    paymentId: created.paymentId,
  },
};


  const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const psData = await psRes.json().catch(() => null);
    await prisma.payment.update({
      where: { id: created.paymentId },
      data: { reference: psData.data.reference },
  });


  if (!psRes.ok) {
    console.error("Paystack initialize failed:", psData);
    return NextResponse.json(
      { error: psData?.message || "Failed to initialize Paystack transaction." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    authorizationUrl: psData.data.authorization_url,
    reference: psData.data.reference,
  });
}
