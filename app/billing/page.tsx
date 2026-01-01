import Navbar from "@/app/Navbar";
import BillingClient from "./BillingClient";

export default function BillingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <BillingClient />
        </div>
      </main>
    </>
  );
}
