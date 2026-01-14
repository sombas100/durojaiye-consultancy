import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Tx } from "@/lib/prisma-types";

export const runtime = "nodejs";

function assertEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(_req: NextRequest) {
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "User email is required." }, { status: 400 });
  }

  /**
   * ✅ Guard: don't allow duplicate active or duplicate pending
   */
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: { in: ["ACTIVE", "PENDING"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, cancelAtPeriodEnd: true },
  });

  if (existing?.status === "ACTIVE") {
    if (existing.cancelAtPeriodEnd) {
      return NextResponse.json(
        {
          error:
            "Your subscription is set to cancel at the end of the billing period. If you want to reactivate, please contact support (reactivation flow coming soon).",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "You already have an active subscription." },
      { status: 400 }
    );
  }

  /**
   * ✅ If they already have a pending subscription, RESUME it by returning the saved Paystack URL.
   * This fixes the "I closed Paystack and can't continue" problem.
   */
  if (existing?.status === "PENDING") {
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        subscriptionId: existing.id,
        type: "SUBSCRIPTION",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, reference: true, authorizationUrl: true },
    });

    // ✅ If we have the saved checkout URL, send them back to Paystack
    if (pendingPayment?.authorizationUrl) {
      return NextResponse.json({
        authorizationUrl: pendingPayment.authorizationUrl,
        reference: pendingPayment.reference,
        resumed: true,
      });
    }

    // ✅ If we DON'T have the URL (older rows), clean up so they can try again cleanly.
    await prisma.$transaction(async (tx: Tx) => {
      await tx.subscription.update({
        where: { id: existing.id },
        data: { status: "CANCELLED" },
      });

      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: { status: "FAILED" },
        });
      }
    });

    // After cleanup, continue and create a new subscription/payment below.
  }

  /**
   * ✅ Create DB records first (PENDING) so webhook can link reliably.
   */
  const created = await prisma.$transaction(async (tx) => {
    let plan = await tx.plan.findFirst({
      where: { paystackPlanCode: planCode },
      select: { id: true, paystackPlanCode: true },
    });

    if (!plan) {
      plan = await tx.plan.create({
        data: {
          name: "Monthly Subscription",
          priceKobo: 2_500_000, // ₦25,000
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
        cancelAtPeriodEnd: false,
      },
      select: { id: true },
    });

    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        type: "SUBSCRIPTION",
        status: "PENDING",
        amountKobo: 2_500_000,
        currency: "NGN",
        subscriptionId: sub.id,
        provider: "PAYSTACK",
      },
      select: { id: true },
    });

    return { subscriptionId: sub.id, paymentId: payment.id };
  });

  /**
   * ✅ Initialize Paystack
   */
  const callbackUrl = `${appUrl}/billing/callback`;

  const payload = {
    email: user.email,
    amount: 2_500_000, // Kobo
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
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const psData = await psRes.json().catch(() => null);

  if (!psRes.ok) {
    console.error("Paystack initialize failed:", psData);

    // ✅ cleanup so they can retry cleanly
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: created.paymentId },
        data: { status: "FAILED" },
      });

      await tx.subscription.update({
        where: { id: created.subscriptionId },
        data: { status: "CANCELLED" },
      });
    });

    return NextResponse.json(
      { error: psData?.message || "Failed to initialize Paystack transaction." },
      { status: 500 }
    );
  }

  // ✅ store reference AND authorizationUrl so we can resume later
  const reference = psData?.data?.reference as string | undefined;
  const authorizationUrl = psData?.data?.authorization_url as string | undefined;

  await prisma.payment.update({
    where: { id: created.paymentId },
    data: {
      reference,
      authorizationUrl,
    },
  });

  return NextResponse.json({
    authorizationUrl,
    reference,
  });
}
