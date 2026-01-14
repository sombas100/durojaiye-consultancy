"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyResponse = {
  payment?: {
    status: "PENDING" | "SUCCESS" | "FAILED";
    subscriptionId: string | null;
  } | null;
  error?: string;
};

export default function CallbackClient() {
  const router = useRouter();
  const params = useSearchParams();

  const reference = useMemo(() => params.get("reference"), [params]);

  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "failed" | "error"
  >("loading");
  const [message, setMessage] = useState<string>(
    "Activating your subscription…"
  );

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference. Please try again.");
      return;
    }

    let cancelled = false;

    async function poll() {
      // Poll up to ~45 seconds (30 tries, 1.5s apart)
      for (let i = 0; i < 30; i++) {
        if (cancelled) return;

        const res = await fetch(`/api/billing/verify?reference=${reference}`, {
          method: "GET",
          cache: "no-store",
        });

        const data: VerifyResponse = await res.json().catch(() => ({}) as any);

        if (!res.ok) {
          setStatus("error");
          setMessage(
            data?.error || "Unable to verify payment. Please contact support."
          );
          return;
        }

        const payment = data?.payment;

        if (!payment) {
          setStatus("pending");
          setMessage("Waiting for confirmation…");
        } else if (payment.status === "SUCCESS") {
          setStatus("success");
          setMessage("Subscription activated. Redirecting you to booking…");
          setTimeout(() => router.replace("/booking?subscribed=1"), 800);
          return;
        } else if (payment.status === "FAILED") {
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
          return;
        } else {
          setStatus("pending");
          setMessage("Waiting for confirmation…");
        }

        await new Promise((r) => setTimeout(r, 1500));
      }

      setStatus("pending");
      setMessage(
        "We’re still confirming your payment. You can refresh this page in a moment, or go back to booking."
      );
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div
            className={[
              "mt-1 h-10 w-10 rounded-full flex items-center justify-center",
              status === "success"
                ? "bg-green-50 text-green-700"
                : status === "failed" || status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700",
            ].join(" ")}
          >
            {status === "success"
              ? "✓"
              : status === "failed" || status === "error"
                ? "!"
                : "…"}
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {status === "success"
                ? "Payment confirmed"
                : status === "failed"
                  ? "Payment failed"
                  : status === "error"
                    ? "Something went wrong"
                    : "Processing payment"}
            </h1>

            <p className="mt-2 text-sm text-gray-600">{message}</p>

            {reference ? (
              <p className="mt-3 text-xs text-gray-400">
                Reference: <span className="font-mono">{reference}</span>
              </p>
            ) : null}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/booking"
                className="inline-flex justify-center rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Go to booking
              </Link>

              <Link
                href="/pricing"
                className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                View pricing
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              If you were charged and still don’t have access after a few
              minutes, contact support.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
