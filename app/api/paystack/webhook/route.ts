import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret =
    process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!secret)
    throw new Error(
      "Missing PAYSTACK_WEBHOOK_SECRET / PAYSTACK_SECRET_KEY"
    );

  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

// Adds 1 month in a safe way (handles month length differences)
function addOneMonth(from: Date) {
  const d = new Date(from);
  const day = d.getUTCDate();

  d.setUTCMonth(d.getUTCMonth() + 1);

  // if month overflow happened (e.g Jan 31 -> Mar 2), clamp to last day of previous month
  if (d.getUTCDate() < day) {
    d.setUTCDate(0);
  }

  return d;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  // Always verify signature
  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // We care most about charge.success initially
  if (event?.event !== "charge.success") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const data = event.data;
  const reference: string | undefined = data?.reference;

  // metadata we sent from /subscribe
  const metadata = data?.metadata || {};
  const type = metadata?.type;

  if (!reference || type !== "SUBSCRIPTION") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const userId: string | undefined = metadata?.userId;
  const subscriptionId: string | undefined = metadata?.subscriptionId;
  const paymentId: string | undefined = metadata?.paymentId;

  if (!userId || !subscriptionId) {
    // Without these, we can't reliably activate/extend the correct subscription.
    // (You can add fallback lookup by email/reference later if needed.)
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Paystack may include subscription details in charge data depending on flow
  const subscriptionCode = data?.subscription?.subscription_code;
  const emailToken = data?.subscription?.email_token;

  try {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1) Mark payment success + store reference (idempotent-ish)
      if (paymentId) {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "SUCCESS",
            reference,
          },
        });
      } else {
        // fallback: upsert by reference if you ever need it
        await tx.payment.upsert({
          where: { reference },
          create: {
            userId,
            type: "SUBSCRIPTION",
            status: "SUCCESS",
            amountKobo: data?.amount ?? 0,
            currency: data?.currency ?? "NGN",
            provider: "PAYSTACK",
            reference,
            subscriptionId,
          },
          update: { status: "SUCCESS" },
        });
      }

      // 2) Optional but recommended: ensure only ONE ACTIVE subscription per user
      await tx.subscription.updateMany({
        where: {
          userId,
          id: { not: subscriptionId },
          status: "ACTIVE",
        },
        data: { status: "CANCELLED" },
      });

      // 3) Fetch current subscription dates (so we extend correctly)
      const sub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, startDate: true, endDate: true, status: true },
      });

      if (!sub) return;

      // Extend from endDate if still in future, otherwise extend from now
      const base = sub.endDate && sub.endDate > now ? sub.endDate : now;
      const nextEnd = addOneMonth(base);

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          startDate: sub.startDate ?? now,
          endDate: nextEnd,
          paystackSubscriptionCode: subscriptionCode ?? undefined,
          paystackEmailToken: emailToken ?? undefined,
        },
      });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("Webhook handling failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
