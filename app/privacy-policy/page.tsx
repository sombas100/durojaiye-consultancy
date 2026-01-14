import Footer from "../Footer";
import Navbar from "../Navbar";

export const metadata = {
  title: "Privacy Policy | Durojaiye Consultancy",
  description: "Durojaiye consultancy policy",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Privacy Policy
          </h1>

          <p className="text-sm text-gray-600">
            Your privacy is important to us. This policy explains how we collect
            and use your information.
          </p>

          <section className="space-y-4 text-sm text-gray-700">
            <p>
              We collect only the information necessary to provide
              consultations, manage bookings, and process payments securely.
            </p>

            <p>
              Personal data such as your name, email address, and appointment
              details are stored securely and are never sold or shared with
              third parties.
            </p>

            <p>
              Payments are handled by trusted third-party providers. We do not
              store your card or banking details.
            </p>

            <p>By using this website, you consent to this privacy policy.</p>
          </section>

          <p className="text-xs text-gray-500">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
