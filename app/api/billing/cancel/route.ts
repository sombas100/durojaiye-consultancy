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

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      cancelAtPeriodEnd: true,
      endDate: true,
      paystackSubscriptionCode: true,
      paystackEmailToken: true,
    },
  });

  if (!sub) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }

  if (sub.cancelAtPeriodEnd) {
    return NextResponse.json({ ok: true, alreadyScheduled: true }, { status: 200 });
  }

  // ✅ Require BOTH for Paystack disable
  if (!sub.paystackSubscriptionCode || !sub.paystackEmailToken) {
    return NextResponse.json(
      {
        error:
          "Subscription cancellation is not available yet because Paystack subscription credentials are missing (subscription_code/email_token). Please contact support.",
        missing: {
          subscriptionCode: !sub.paystackSubscriptionCode,
          emailToken: !sub.paystackEmailToken,
        },
      },
      { status: 400 }
    );
  }

  const secretKey = assertEnv("PAYSTACK_SECRET_KEY");

  const psRes = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: sub.paystackSubscriptionCode,
      token: sub.paystackEmailToken,
    }),
  });

  const psData = await psRes.json().catch(() => null);

  if (!psRes.ok) {
    console.error("Paystack subscription disable failed:", psData);
    return NextResponse.json(
      { error: psData?.message || "Failed to cancel subscription.", paystack: psData },
      { status: 400 }
    );
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json(
    {
      ok: true,
      alreadyScheduled: false,
      endDate: sub.endDate,
    },
    { status: 200 }
  );
}
