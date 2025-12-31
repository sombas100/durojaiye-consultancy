"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start subscription.");
      }

      // Redirect to Paystack hosted checkout
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h1 className="text-xl font-semibold text-gray-900">
            Subscription required
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            An active subscription is required to book a private medical
            consultation.
          </p>

          <div className="mt-6 rounded-xl border bg-blue-50 p-4">
            <div className="text-sm font-semibold text-gray-900">
              What’s included
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>• One 30-minute consultation per booking</li>
              <li>• Option to add extra time (₦10,000 per 10 minutes)</li>
              <li>• Access to all available appointment slots</li>
              <li>• Secure online booking & email notifications</li>
            </ul>
          </div>

          <div className="mt-6 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Monthly subscription
                </div>
                <div className="text-sm text-gray-600">
                  Billed monthly • Cancel anytime
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">₦50,000</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Redirecting to Paystack…" : "Subscribe now"}
            </button>

            <Link
              href="/"
              className="flex-1 text-center rounded-xl border border-gray-300 bg-white py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Back home
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Payments are securely processed via Paystack.
          </p>
        </div>
      </div>
    </main>
  );
}
