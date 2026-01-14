import Footer from "../Footer";
import Navbar from "../Navbar";

export const metadata = {
  title: "Support | Durojaiye Consultancy",
  description: "Durojaiye consultancy support",
};

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Support</h1>

          <p className="text-sm text-gray-600">
            If you need help with bookings, payments, or your account, we’re
            here to assist.
          </p>

          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <p className="text-sm text-gray-700">
              For all support enquiries, please contact us via email:
            </p>

            <p className="text-sm font-medium text-gray-900">
              📧{" "}
              <a
                href="mailto:oladuro75@gmail.com"
                className="text-blue-600 hover:underline"
              >
                oladuro75@gmail.com
              </a>
            </p>

            <p className="text-xs text-gray-500">
              We aim to respond within 24–48 hours.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
