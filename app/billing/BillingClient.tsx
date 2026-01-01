"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";

type SubStatus = "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";

type BillingStatusResponse = {
  subscription?: {
    id: string;
    status: SubStatus;
    startDate: string | null;
    endDate: string | null;
    cancelAtPeriodEnd: boolean;
    plan: { name: string; priceKobo: number; interval: string } | null;
  } | null;
  error?: string;
};

function koboToNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function badge(sub?: BillingStatusResponse["subscription"] | null) {
  if (!sub) return "bg-gray-50 text-gray-700 border-gray-200";

  if (sub.status === "ACTIVE" && sub.cancelAtPeriodEnd)
    return "bg-yellow-50 text-yellow-800 border-yellow-200";

  switch (sub.status) {
    case "ACTIVE":
      return "bg-green-50 text-green-700 border-green-200";
    case "PENDING":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    case "EXPIRED":
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function BillingClient() {
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<BillingStatusResponse["subscription"] | null>(
    null
  );
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/billing/status", { cache: "no-store" });
    const data: BillingStatusResponse = await res
      .json()
      .catch(() => ({}) as any);
    setLoading(false);

    if (!res.ok) {
      toast.error(data?.error || "Failed to load billing info.");
      setSub(null);
      return;
    }

    setSub(data.subscription ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  const stateLabel = useMemo(() => {
    if (!sub) return "No subscription";
    if (sub.status === "ACTIVE" && sub.cancelAtPeriodEnd)
      return "Active (cancels at period end)";
    return sub.status;
  }, [sub]);

  async function cancelSubscription() {
    if (!sub || sub.status !== "ACTIVE") {
      toast.info("You don’t have an active subscription to cancel.");
      return;
    }

    if (sub.cancelAtPeriodEnd) {
      toast.info("Cancellation is already scheduled.");
      return;
    }

    const ok = confirm(
      "Cancel your subscription at the end of the current billing period?\n\nYou will keep access until your end date."
    );
    if (!ok) return;

    setCancelling(true);
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    const data = await res.json().catch(() => null);
    setCancelling(false);

    if (!res.ok) {
      toast.error(data?.error || "Failed to schedule cancellation.");
      return;
    }

    toast.success(
      "Cancellation scheduled. You’ll keep access until the end date."
    );
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Billing & Subscription
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your monthly subscription for consultations.
            </p>
          </div>

          <div
            className={[
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
              badge(sub),
            ].join(" ")}
          >
            {loading ? "Loading…" : stateLabel.replace("_", " ")}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-gray-500">
            Loading your billing info…
          </div>
        ) : !sub ? (
          <div className="mt-6 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
            You don’t have a subscription yet.
            <div className="mt-3">
              <Link
                href="/subscribe"
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Subscribe
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">Plan</div>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {sub.plan?.name ?? "Monthly Subscription"}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {sub.plan?.priceKobo
                  ? koboToNaira(sub.plan.priceKobo)
                  : "₦50,000"}{" "}
                / {sub.plan?.interval ?? "monthly"}
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="text-xs font-semibold text-gray-500">
                Billing period
              </div>
              <div className="mt-1 text-sm text-gray-700">
                {sub.endDate ? (
                  <>
                    Access until{" "}
                    <span className="font-medium text-gray-900">
                      {formatDate(sub.endDate)}
                    </span>
                    .
                  </>
                ) : (
                  "End date not set yet."
                )}
              </div>
              {sub.cancelAtPeriodEnd ? (
                <div className="mt-2 text-xs text-yellow-800">
                  Cancellation scheduled — no renewals will occur.
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-2 rounded-xl border p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Subscription actions
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Cancel at period end (recommended). You keep access until
                    the end date.
                  </div>
                </div>

                <button
                  onClick={cancelSubscription}
                  disabled={
                    cancelling ||
                    sub.status !== "ACTIVE" ||
                    sub.cancelAtPeriodEnd
                  }
                  className="inline-flex justify-center rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sub.cancelAtPeriodEnd
                    ? "Cancellation scheduled"
                    : cancelling
                      ? "Cancelling…"
                      : "Cancel subscription"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
