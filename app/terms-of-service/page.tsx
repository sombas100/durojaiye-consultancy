import Footer from "../Footer";
import Navbar from "../Navbar";

export const metadata = {
  title: "Terms of service | Durojaiye Consultancy",
  description: "Durojaiye consultancy terms of service",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Terms of Service
          </h1>

          <p className="text-sm text-gray-600">
            Please read these terms carefully before using this website.
          </p>

          <section className="space-y-4 text-sm text-gray-700">
            <p>
              By accessing or using this service, you agree to be bound by these
              terms.
            </p>

            <p>
              Consultations provided through this platform are for informational
              purposes and do not replace in-person medical care when required.
            </p>

            <p>
              Subscriptions are billed monthly. You may cancel at any time, but
              fees already paid are non-refundable.
            </p>

            <p>
              We reserve the right to update or modify these terms at any time.
              Continued use of the service constitutes acceptance of any
              changes.
            </p>
          </section>

          <p className="text-xs text-gray-500">
            Last updated: January {new Date().getFullYear()}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
