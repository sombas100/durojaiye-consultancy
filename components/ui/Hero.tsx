import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-blue-50 via-white to-white" />
      <div className="absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-blue-100 blur-3xl opacity-70" />
      <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-blue-100 blur-3xl opacity-50" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:pt-28 lg:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-medium text-blue-700">
              Trusted • Confidential • Nigeria-based
            </p>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Private medical consultations{" "}
              <span className="text-blue-700">in Nigeria</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
              Book secure, professional consultations with a licensed doctor.
              Choose a convenient time, add extra minutes if needed, and get the
              support you deserve — from anywhere in Nigeria.
            </p>

            {/* Trust points */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                <span className="font-semibold text-gray-900">30 mins</span>{" "}
                included with subscription
              </div>
              <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                <span className="font-semibold text-gray-900">Secure</span>{" "}
                booking & patient privacy
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Book a consultation
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
              >
                View services
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              By booking, you agree to our Terms & Privacy Policy.
            </p>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl  border-gray-300 bg-white shadow-lg">
              <Image
                src="/hero-front.jpg"
                alt="Doctor consultation"
                width={900}
                height={900}
                className="h-105 w-full object-cover sm:h-130"
                priority
              />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 left-4 rounded-2xl border bg-white px-4 py-3 shadow-md">
              <p className="text-xs font-medium text-gray-500">Available in</p>
              <p className="text-sm font-semibold text-gray-900">
                Nigeria/Lagos (WAT)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
