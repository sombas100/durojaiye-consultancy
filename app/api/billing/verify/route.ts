import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Tx } from "@/lib/prisma-types";

export const runtime = "nodejs";

function assertEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Adds 1 month in a safe way (handles month length differences)
function addOneMonth(from: Date) {
  const d = new Date(from);
  const day = d.getUTCDate();

  d.setUTCMonth(d.getUTCMonth() + 1);

  if (d.getUTCDate() < day) {
    d.setUTCDate(0);
  }

  return d;
}

async function paystackVerify(reference: string) {
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
    throw new Error(json?.message || "Failed to verify Paystack transaction.");
  }

  return json;
}

type PaystackSubListItem = {
  subscription_code?: string;
  email_token?: string;
  createdAt?: string;
  created_at?: string;
  customer?: { email?: string };
};

// Fallback: list subscriptions and find the most recent one for this email
async function fetchLatestSubscriptionByEmail(email: string) {
  const secretKey = assertEnv("PAYSTACK_SECRET_KEY");

  const res = await fetch(
    `https://api.paystack.co/subscription?perPage=50&page=1`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    }
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || "Failed to fetch Paystack subscriptions.");
  }

  const subs: PaystackSubListItem[] = Array.isArray(json?.data) ? json.data : [];

  const matches = subs.filter(
    (s) => (s?.customer?.email || "").toLowerCase() === email.toLowerCase()
  );

  if (!matches.length) return null;

  matches.sort((a, b) => {
    const da = new Date(a?.createdAt || a?.created_at || 0).getTime();
    const db = new Date(b?.createdAt || b?.created_at || 0).getTime();
    return db - da;
  });

  const s = matches[0];
  return {
    subscriptionCode: s?.subscription_code as string | undefined,
    emailToken: s?.email_token as string | undefined,
  };
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const paymentRow = await prisma.payment.findUnique({
    where: { reference },
    select: { id: true, status: true, subscriptionId: true, userId: true },
  });

  if (!paymentRow) {
    return NextResponse.json({ payment: null }, { status: 200 });
  }

  if (paymentRow.status === "SUCCESS" || paymentRow.status === "FAILED") {
    return NextResponse.json({
      payment: { status: paymentRow.status, subscriptionId: paymentRow.subscriptionId },
    });
  }

  if (!paymentRow.subscriptionId) {
    return NextResponse.json({
      payment: { status: paymentRow.status, subscriptionId: null },
    });
  }

  try {
    const verify = await paystackVerify(reference);

    const data = verify?.data;
    const psStatus = data?.status;

    if (psStatus !== "success") {
      if (psStatus === "failed") {
        await prisma.payment.update({
          where: { id: paymentRow.id },
          data: { status: "FAILED" },
        });

        return NextResponse.json({
          payment: { status: "FAILED", subscriptionId: paymentRow.subscriptionId },
        });
      }

      return NextResponse.json({
        payment: { status: "PENDING", subscriptionId: paymentRow.subscriptionId },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: paymentRow.userId },
      select: { email: true },
    });

    const userEmail = user?.email;
    if (!userEmail) {
      await prisma.payment.update({
        where: { id: paymentRow.id },
        data: { status: "SUCCESS" },
      });

      return NextResponse.json({
        payment: { status: "SUCCESS", subscriptionId: paymentRow.subscriptionId },
      });
    }

    let subscriptionCode: string | undefined =
      data?.subscription?.subscription_code ?? undefined;
    let emailToken: string | undefined = data?.subscription?.email_token ?? undefined;

    if (!subscriptionCode || !emailToken) {
      try {
        const found = await fetchLatestSubscriptionByEmail(userEmail);
        subscriptionCode = subscriptionCode ?? found?.subscriptionCode;
        emailToken = emailToken ?? found?.emailToken;
      } catch (e) {
        console.warn("Could not fetch subscription credentials from /subscription:", e);
      }
    }

    const now = new Date();

    await prisma.$transaction(async (tx:Tx) => {
      await tx.payment.update({
        where: { id: paymentRow.id },
        data: { status: "SUCCESS" },
      });

      const sub = await tx.subscription.findUnique({
        where: { id: paymentRow.subscriptionId! },
        select: { id: true, startDate: true, endDate: true, cancelAtPeriodEnd: true },
      });

      if (!sub) return;

      const base = sub.endDate && sub.endDate > now ? sub.endDate : now;
      const nextEnd = addOneMonth(base);

      await tx.subscription.update({
        where: { id: sub.id },
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

    return NextResponse.json({
      payment: { status: "SUCCESS", subscriptionId: paymentRow.subscriptionId },
      stored: { subscriptionCode: !!subscriptionCode, emailToken: !!emailToken },
    });
  } catch (e: any) {
    console.error("Verify failed:", e);
    return NextResponse.json(
      { error: e?.message || "Unable to verify payment right now." },
      { status: 500 }
    );
  }
}
