import Link from "next/link";
import Footer from "../Footer";
import Navbar from "../Navbar";

const PRICE_NGN = "₦25,000";
const INTERVAL = "month";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-10">
          {/* Header */}
          <header className="text-center space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
              Pricing
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-gray-600">
              Simple monthly subscription pricing. Your base consultation time
              is included, with the option to add extra minutes when needed.
            </p>
          </header>

          {/* Pricing card */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center rounded-full border bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Monthly plan
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-gray-900">
                    Subscription access
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Access appointment slots and book your consultation.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-3xl font-semibold text-gray-900">
                    {PRICE_NGN}
                  </div>
                  <div className="text-sm text-gray-500">per {INTERVAL}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Booking access (view and reserve available slots)",
                  "Base consultation time included",
                  "Secure payments via Paystack",
                  "Email confirmations for bookings and updates",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-xl border bg-gray-50 p-3"
                  >
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-600" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border bg-blue-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  Extra minutes (optional)
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  If you need more time during booking, you can add extra
                  minutes in 10-minute increments (charged per extra block).
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/subscribe"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition sm:w-auto"
                >
                  Subscribe now
                </Link>
                <Link
                  href="/booking"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition sm:w-auto"
                >
                  View booking
                </Link>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Note: Booking requires an active subscription.
              </p>
            </div>

            {/* Side info */}
            <aside className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Good to know
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-xl border bg-gray-50 p-3">
                  <div className="font-semibold text-gray-900">
                    Appointment times
                  </div>
                  <div className="mt-1 text-gray-600">
                    Displayed in Africa/Lagos (WAT).
                  </div>
                </div>

                <div className="rounded-xl border bg-gray-50 p-3">
                  <div className="font-semibold text-gray-900">
                    Cancellation
                  </div>
                  <div className="mt-1 text-gray-600">
                    You can cancel your subscription. Access continues until the
                    end of the billing period.
                  </div>
                </div>

                <div className="rounded-xl border bg-gray-50 p-3">
                  <div className="font-semibold text-gray-900">Support</div>
                  <div className="mt-1 text-gray-600">
                    Email{" "}
                    <a
                      href="mailto:oladuro75@gmail.com"
                      className="text-blue-600 hover:underline"
                    >
                      oladuro75@gmail.com
                    </a>{" "}
                    for help.
                  </div>
                </div>
              </div>
            </aside>
          </section>

          {/* FAQ-style section */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Pricing questions
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                {
                  q: "Is this billed monthly?",
                  a: "Yes, the subscription is billed monthly.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. If you cancel, you keep access until the end of your billing period.",
                },
                {
                  q: "Do I pay again for extra minutes?",
                  a: "Extra minutes are paid as a one-off payment when added during booking.",
                },
                {
                  q: "What payments are supported?",
                  a: "Payments are processed securely via Paystack.",
                },
              ].map((item) => (
                <div key={item.q} className="rounded-xl border bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.q}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{item.a}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
