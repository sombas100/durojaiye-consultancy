import Navbar from "./Navbar";
import Hero from "@/components/ui/Hero";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        <Hero />

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-blue-700">Step 1</div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Subscribe to access consultations
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Get access to booking and a base 30-minute consultation included
                with your subscription.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-blue-700">Step 2</div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Choose a time slot
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Pick an available slot that suits you. All times are shown in
                Africa/Lagos (WAT).
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-blue-700">Step 3</div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Add extra minutes if needed
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Extend your consultation in 10-minute increments (charged per
                extra block).
              </p>
            </div>
          </div>
        </section>

        {/* Trust / reassurance */}
        <section className="bg-gray-50 border-y">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                  Professional, private, and patient-focused
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                  Built to feel calm and trustworthy — with secure booking,
                  clear pricing, and a simple experience for patients.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                    Base consultation time included with subscription
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                    Transparent extra-minute pricing (10-minute blocks)
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                    Admin dashboard for doctor to manage appointments
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ready to book?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Subscribe to access appointment slots and book your
                  consultation.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/subscribe"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Subscribe
                  </Link>
                  <Link
                    href="/booking"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                  >
                    Book now
                  </Link>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Note: Booking requires an active subscription.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="rounded-2xl bg-blue-600 px-6 py-10 text-white shadow-sm sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Book with confidence</h2>
                <p className="mt-2 text-sm text-blue-100">
                  Secure booking • Clear pricing • Africa/Lagos scheduling
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
                >
                  Book now
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  View services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
