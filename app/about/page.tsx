// app/about/page.tsx
import Link from "next/link";
import Navbar from "../Navbar";
import Footer from "../Footer";

export const metadata = {
  title: "About | Durojaiye Consultancy",
  description:
    "Learn about Durojaiye Consultancy—Nigeria-focused medical consultations, simple booking, and patient-first care.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                Nigeria-based consultations • Online booking
              </p>

              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
                Patient-first consultations, delivered with clarity and care.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                Durojaiye Consultancy is built to make it easier for patients in
                Nigeria to access timely medical guidance without stress, long
                wait times, or uncertainty. We focus on clear communication,
                respectful care, and a smooth booking experience from start to
                finish.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/booking"
                  className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Book a consultation
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex justify-center rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Mission */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Our mission
              </h2>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                To provide reliable, patient-centered consultations that help
                people make informed decisions about their health—through clear
                explanations, respectful listening, and practical next steps.
              </p>
            </div>

            {/* Approach */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Our approach
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    <b className="text-gray-800">Clarity:</b> simple, honest
                    explanations—no confusing jargon.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    <b className="text-gray-800">Structure:</b> appointments
                    that stay focused and make good use of time.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    <b className="text-gray-800">Follow-through:</b> clear
                    recommendations and next steps after your session.
                  </span>
                </li>
              </ul>
            </div>

            {/* What we help with */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                What we help with
              </h2>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                General medical guidance, interpreting symptoms, reviewing
                health concerns, and helping you understand what to do
                next—whether it’s self-care, further tests, or a referral.
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Note: This service does not replace emergency care. If you have
                a medical emergency, seek urgent help immediately.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-10 sm:mt-12 rounded-2xl border bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              How it works
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold">
                  1
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">Subscribe</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Activate your monthly subscription to access booking and
                  available slots.
                </p>
              </div>

              <div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold">
                  2
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  Book a slot
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Choose a time that works for you. Your base consultation time
                  is included.
                </p>
              </div>

              <div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold">
                  3
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  Get clear guidance
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Receive a structured consultation with practical next steps
                  and peace of mind.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/pricing"
                className="inline-flex justify-center rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
              >
                View pricing
              </Link>
              <Link
                href="/booking"
                className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Book now
              </Link>
            </div>
          </div>

          {/* Trust + Privacy */}
          <div className="mt-10 sm:mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Privacy & professionalism
              </h2>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                We take privacy seriously. Patient information is handled with
                care, and access is restricted to authorized staff. Our goal is
                to provide a respectful, secure experience throughout your
                journey.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                For patients in Nigeria, accessible anywhere
              </h2>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                The service is designed primarily for patients in Nigeria, but
                you can access and manage bookings from anywhere—useful for
                travel, relocation, or supporting family members remotely.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
