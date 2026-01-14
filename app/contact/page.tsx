// app/contact/page.tsx
import Link from "next/link";
import Footer from "../Footer";
import Navbar from "../Navbar";

export const metadata = {
  title: "Contact | Durojaiye Consultancy",
  description:
    "Get in touch with Durojaiye Consultancy for general enquiries, support, or consultation-related questions.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-800">
              Contact
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600">
              If you have a general enquiry, need help with your account, or
              have questions before booking a consultation, you can reach us
              using the contact details below.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact details */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Contact details
              </h2>

              <p className="mt-3 text-sm text-gray-600">
                For all enquiries, please contact us by email. We aim to respond
                as soon as possible during working hours.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </p>
                  <a
                    href="mailto:oladuro75@gmail.com"
                    className="mt-1 inline-block text-blue-600 font-medium hover:underline"
                  >
                    oladuro75@gmail.com
                  </a>
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                Please note: This email is for enquiries and support only.
                Medical advice is provided exclusively through booked
                consultations.
              </p>
            </div>

            {/* Guidance / CTA */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Booking & urgent care
              </h2>

              <p className="mt-3 text-sm text-gray-600">
                If you’re ready to speak with the doctor, you can book a
                consultation directly through the platform.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/booking"
                  className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Book a consultation
                </Link>

                <Link
                  href="/services"
                  className="inline-flex justify-center rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  View services
                </Link>
              </div>

              <div className="mt-6 rounded-xl border bg-gray-50 p-4">
                <p className="text-sm text-gray-700">
                  <strong>Important:</strong> If you are experiencing severe or
                  worsening symptoms (such as chest pain, difficulty breathing,
                  loss of consciousness, or stroke symptoms), please seek
                  emergency medical care immediately.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
