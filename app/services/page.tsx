// app/services/page.tsx
import Link from "next/link";
import Navbar from "../Navbar";
import Footer from "../Footer";

export const metadata = {
  title: "Services | Durojaiye Consultancy",
  description:
    "Explore consultation services including general GP consultations, hypertension, diabetes, and respiratory medicine—built for patients in Nigeria.",
};

type Service = {
  title: string;
  description: string;
  examples: string[];
  badge?: string;
};

const services: Service[] = [
  {
    title: "General GP consultation",
    badge: "Most popular",
    description:
      "A structured consultation to discuss symptoms, concerns, and next steps—ideal if you’re not sure where to start.",
    examples: [
      "Symptom review (e.g., headaches, fatigue, dizziness)",
      "Advice on what to do next: self-care, tests, or referral",
      "Medication questions & general health guidance",
    ],
  },
  {
    title: "Hypertension (High blood pressure)",
    description:
      "Guidance for people managing high blood pressure, readings at home, lifestyle adjustments, and treatment review.",
    examples: [
      "Understanding BP readings and targets",
      "Lifestyle plan (diet, salt, weight, activity)",
      "Review of current medications and side effects",
    ],
  },
  {
    title: "Diabetes care",
    description:
      "Support for managing diabetes with practical advice on monitoring, diet, medication routines, and risk reduction.",
    examples: [
      "Blood sugar monitoring guidance",
      "Diet and lifestyle planning",
      "Understanding symptoms and when to seek urgent care",
    ],
  },
  {
    title: "Respiratory medicine",
    description:
      "Consultations for breathing-related concerns and respiratory symptoms—helping you understand triggers and next steps.",
    examples: [
      "Cough, wheeze, shortness of breath assessment guidance",
      "Asthma symptom discussion and management support",
      "When to get tests or urgent assessment",
    ],
  },

  // Helpful additions (common, general, low-risk)
  {
    title: "Women’s health",
    description:
      "Support for common women’s health concerns with clear advice and referral guidance when needed.",
    examples: [
      "Menstrual concerns and cycle changes",
      "PCOS discussions and general guidance",
      "General reproductive health questions",
    ],
  },
  {
    title: "Men’s health",
    description:
      "A confidential space to discuss common men’s health topics and practical next steps.",
    examples: [
      "General wellbeing and screening guidance",
      "Lifestyle advice and risk reduction",
      "When to seek in-person review",
    ],
  },
  {
    title: "Digestive health",
    description:
      "Consultations for digestive symptoms with guidance on triggers, red flags, and what to investigate next.",
    examples: [
      "Acid reflux, bloating, abdominal discomfort",
      "Dietary triggers and symptom tracking",
      "Red flags and referral guidance",
    ],
  },
  {
    title: "Mental wellbeing support",
    description:
      "Supportive consultations focused on understanding symptoms and identifying safe next steps and resources.",
    examples: [
      "Stress, anxiety, low mood discussions",
      "Sleep and routine support",
      "Signposting to appropriate services when needed",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                Consultations designed for patients in Nigeria
              </p>

              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-800">
                Services & consultation areas
              </h1>

              <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                Choose a consultation area below. If you’re unsure, start with a{" "}
                <span className="font-semibold text-gray-800">
                  General GP consultation
                </span>{" "}
                and we’ll guide you to the right next step.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/booking"
                  className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Book a consultation
                </Link>

                <Link
                  href="/pricing"
                  className="inline-flex justify-center rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  View pricing
                </Link>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                If you have severe symptoms (e.g., chest pain, difficulty
                breathing, fainting, stroke symptoms), seek emergency care
                immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Services grid */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {s.title}
                  </h2>

                  {s.badge ? (
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                      {s.badge}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {s.description}
                </p>

                <div className="mt-4 rounded-xl border bg-gray-50 p-4">
                  <div className="text-xs font-semibold text-gray-700">
                    Common topics
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {s.examples.map((ex) => (
                      <li key={ex} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/booking"
                    className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Book now
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex justify-center rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                  >
                    Ask a question
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Not sure what to book?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              If your concern doesn’t fit neatly into a category, book a General
              GP consultation. We’ll help you understand what’s going on and
              what to do next.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link
                href="/booking"
                className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Book a General GP consultation
              </Link>
              <Link
                href="/"
                className="inline-flex justify-center rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
              >
                Back home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
