import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import BookingClient from "./BookingClient";

export default async function BookingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Patients only
  if (session.user.role !== "PATIENT") redirect("/");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h1 className="text-xl font-semibold text-gray-900">
            Book a Consultation
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Choose an available time slot. You can add extra time in 10-minute
            increments.
          </p>
        </div>

        <BookingClient />
      </div>
    </main>
  );
}
