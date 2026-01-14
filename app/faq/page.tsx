import Footer from "../Footer";
import Navbar from "../Navbar";

export const metadata = {
  title: "FAQ | Durojaiye Consultancy",
  description: "Durojaiye consultancy frequently asked questions",
};

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header>
            <h1 className="text-2xl font-semibold text-gray-900">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Answers to common questions about consultations, subscriptions,
              and bookings.
            </p>
          </header>

          <div className="space-y-6">
            {[
              {
                q: "Do I need a subscription to book an appointment?",
                a: "Yes. An active subscription is required to access available booking slots.",
              },
              {
                q: "What is included in my subscription?",
                a: "Your subscription includes a base consultation time. You can add extra minutes during booking if needed.",
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes. You can cancel your subscription at any time. Access will continue until the end of your current billing period.",
              },
              {
                q: "How are extra minutes charged?",
                a: "Extra consultation time is billed in 10-minute increments and paid securely before the appointment is confirmed.",
              },
              {
                q: "What timezone are appointments shown in?",
                a: "All appointment times are displayed in Africa/Lagos (WAT).",
              },
              {
                q: "Is my information kept private?",
                a: "Yes. Your personal and booking information is handled securely and kept confidential.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">{item.q}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
