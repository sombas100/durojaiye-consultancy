import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret =
    process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing PAYSTACK_WEBHOOK_SECRET / PAYSTACK_SECRET_KEY");
  }

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

function assertEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type PaystackVerifySubscription = {
  subscriptionCode: string | null;
  emailToken: string | null;
};

// --- Fallback #1: Paystack verify endpoint ---
async function fetchSubscriptionFromVerify(
  reference: string
): Promise<PaystackVerifySubscription> {
  const secretKey = assertEnv("PAYSTACK_SECRET_KEY");

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    }
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.warn("Paystack verify failed:", json);
    return { subscriptionCode: null, emailToken: null };
  }

  const subscriptionCode =
    (json?.data?.subscription?.subscription_code as string | undefined) ?? null;

  const emailToken =
    (json?.data?.subscription?.email_token as string | undefined) ?? null;

  return { subscriptionCode, emailToken };
}

// --- Fallback #2: list subscriptions for customer email (works in test mode) ---
type PaystackSubListItem = {
  subscription_code?: string;
  email_token?: string;
  createdAt?: string;
  created_at?: string;
  customer?: { email?: string };
};

async function fetchLatestSubscriptionByEmail(email: string) {
  const secretKey = assertEnv("PAYSTACK_SECRET_KEY");
  const url = `https://api.paystack.co/subscription?perPage=50&page=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.warn("Paystack subscription list failed:", json);
    return { subscriptionCode: null, emailToken: null };
  }

  const subs: PaystackSubListItem[] = Array.isArray(json?.data) ? json.data : [];

  const matches = subs.filter(
    (s) => (s?.customer?.email || "").toLowerCase() === email.toLowerCase()
  );

  if (!matches.length) return { subscriptionCode: null, emailToken: null };

  matches.sort((a, b) => {
    const da = new Date(a.createdAt || a.created_at || 0).getTime();
    const db = new Date(b.createdAt || b.created_at || 0).getTime();
    return db - da;
  });

  const latest = matches[0];

  return {
    subscriptionCode: latest?.subscription_code ?? null,
    emailToken: latest?.email_token ?? null,
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  // Always verify signature
  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string | undefined = event?.event;

  // Handle cancellation event from Paystack too
  if (eventName === "subscription.disable") {
    const subCode: string | undefined = event?.data?.subscription_code;

    if (subCode) {
      await prisma.subscription.updateMany({
        where: { paystackSubscriptionCode: subCode },
        data: {
          status: "CANCELLED",
          cancelAtPeriodEnd: true,
        },
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // We care most about charge.success for payments
  if (eventName !== "charge.success") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const data = event.data;
  const reference: string | undefined = data?.reference;

  const metadata = data?.metadata || {};
  const type: string | undefined = metadata?.type;

  if (!reference || !type) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  /**
   * =========================================================
   *  1) ONE-OFF EXTRA MINUTES PAYMENT
   * =========================================================
   */
  if (type === "EXTRA_MINUTES") {
    const paymentId: string | undefined = metadata?.paymentId;
    const appointmentId: string | undefined = metadata?.appointmentId;

    // We always create a Payment row BEFORE Paystack initialize,
    // so if these are missing, don't guess. Just acknowledge.
    if (!paymentId || !appointmentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    try {
      await prisma.$transaction(async (tx) => {
        // ✅ Validate the payment row matches this appointment + type
        const pay = await tx.payment.findUnique({
          where: { id: paymentId },
          select: {
            id: true,
            status: true,
            type: true,
            appointmentId: true,
            amountKobo: true,
          },
        });

        if (!pay) return;
        if (pay.type !== "EXTRA_MINUTES") return;
        if (pay.appointmentId !== appointmentId) return;

        // ✅ Ensure Paystack amount matches what we expected to charge
        if (typeof data?.amount === "number" && data.amount !== pay.amountKobo) {
          throw new Error("Amount mismatch for EXTRA_MINUTES payment");
        }

        // ✅ Idempotent: if already SUCCESS, just ensure reference is stored
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "SUCCESS",
            reference,
          },
        });

        // ✅ Confirm appointment (only if not cancelled/completed)
        const appt = await tx.appointment.findUnique({
          where: { id: appointmentId },
          select: { id: true, status: true },
        });

        if (!appt) return;

        if (appt.status !== "CANCELLED" && appt.status !== "COMPLETED") {
          await tx.appointment.update({
            where: { id: appointmentId },
            data: { status: "CONFIRMED" },
          });
        }
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e: any) {
      // If webhook retries and reference already exists, treat as success (idempotent).
      if (e?.code === "P2002") {
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      console.error("Webhook EXTRA_MINUTES handling failed:", e);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  /**
   * =========================================================
   *  2) SUBSCRIPTION PAYMENT 
   * =========================================================
   */
  if (type !== "SUBSCRIPTION") {
    // Unknown type, ignore safely
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const userId: string | undefined = metadata?.userId;
  const subscriptionId: string | undefined = metadata?.subscriptionId;
  const paymentId: string | undefined = metadata?.paymentId;

  if (!userId || !subscriptionId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Try to get subscription data from webhook payload first
  let subscriptionCode: string | null =
    (data?.subscription?.subscription_code as string | undefined) ?? null;

  let emailToken: string | null =
    (data?.subscription?.email_token as string | undefined) ?? null;

  // Fallback to verify if missing
  if (!subscriptionCode || !emailToken) {
    try {
      const verified = await fetchSubscriptionFromVerify(reference);
      subscriptionCode = subscriptionCode ?? verified.subscriptionCode;
      emailToken = emailToken ?? verified.emailToken;
    } catch (e) {
      console.warn("Failed to fetch subscription details from verify:", e);
    }
  }

  // Fallback to subscription list by email
  if (!subscriptionCode || !emailToken) {
    const customerEmail: string | undefined =
      (data?.customer?.email as string | undefined) ??
      (data?.authorization?.customer?.email as string | undefined);

    if (customerEmail) {
      try {
        const found = await fetchLatestSubscriptionByEmail(customerEmail);
        subscriptionCode = subscriptionCode ?? found.subscriptionCode;
        emailToken = emailToken ?? found.emailToken;
      } catch (e) {
        console.warn("Failed to fetch subscription details from list:", e);
      }
    }
  }

  try {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1) Mark payment success + store reference
      if (paymentId) {
        // NOTE: this update() will throw if already SUCCESS; keep your pattern or switch to updateMany.
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "SUCCESS", reference },
        });
      } else {
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

      // 2) Ensure only ONE ACTIVE subscription per user
      await tx.subscription.updateMany({
        where: { userId, id: { not: subscriptionId }, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      });

      // 3) Fetch current subscription dates
      const sub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, startDate: true, endDate: true, cancelAtPeriodEnd: true },
      });

      if (!sub) return;

      const base = sub.endDate && sub.endDate > now ? sub.endDate : now;
      const nextEnd = addOneMonth(base);

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          startDate: sub.startDate ?? now,
          endDate: nextEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          ...(subscriptionCode ? { paystackSubscriptionCode: subscriptionCode } : {}),
          ...(emailToken ? { paystackEmailToken: emailToken } : {}),
        },
      });
    });

    return NextResponse.json(
      {
        ok: true,
        storedSubscriptionCode: !!subscriptionCode,
        storedEmailToken: !!emailToken,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Webhook SUBSCRIPTION handling failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
