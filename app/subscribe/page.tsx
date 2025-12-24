import Link from "next/link";

export default function SubscribePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h1 className="text-xl font-semibold text-gray-900">
            Subscription required
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You need an active subscription to book a consultation. Your base
            30-minute consultation is included with your subscription.
          </p>

          <div className="mt-6 rounded-xl border bg-blue-50 p-4">
            <div className="text-sm font-semibold text-gray-900">
              What you get
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>• 30-minute consultation included</li>
              <li>• Option to add extra time (₦10,000 per 10 minutes)</li>
              <li>• Access to available appointment slots</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              disabled
              className="flex-1 rounded-xl bg-blue-600 text-white py-2.5 font-medium opacity-60 cursor-not-allowed"
            >
              Subscribe (Paystack coming soon)
            </button>
            <Link
              href="/"
              className="flex-1 text-center rounded-xl border border-gray-300 bg-white py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Back home
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            For now, you can enable a subscription manually for testing (Prisma
            Studio).
          </p>
        </div>
      </div>
    </main>
  );
}
