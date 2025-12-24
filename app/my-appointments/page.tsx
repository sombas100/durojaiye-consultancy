import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import MyAppointmentsClient from "./MyAppointmentsClient";
import Navbar from "../Navbar";

export default async function MyAppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Patients only
  if (session.user.role !== "PATIENT") redirect("/");

  const appointments = await prisma.appointment.findMany({
    where: { patientId: session.user.id },
    orderBy: { startTimeUtc: "desc" },
    select: {
      id: true,
      startTimeUtc: true,
      endTimeUtc: true,
      status: true,
      baseDurationMinutes: true,
      extraMinutes: true,
      extraBlocks: true,
      totalPriceKobo: true,
      createdAt: true,
      doctor: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border">
            <h1 className="text-xl font-semibold text-gray-900">
              My Appointments
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              View your consultation history and upcoming bookings (Africa/Lagos
              time).
            </p>
          </div>

          <MyAppointmentsClient initialAppointments={appointments} />
        </div>
      </main>
    </>
  );
}
