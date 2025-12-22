import { prisma } from "@/lib/prisma";
import { requireAdminOrDoctor } from "../../../../lib/auth-guard";
import AdminAppointmentsClient from "./AdminAppointmentsClient";

export default async function AdminAppointmentsPage() {
  const result = await requireAdminOrDoctor();
  if (!result.ok) return null; // layout will redirect

  // For a single-doctor system, we show all appointments
  const appointments = await prisma.appointment.findMany({
    orderBy: { startTimeUtc: "asc" },
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
      patient: {
        select: { id: true, name: true, surname: true, email: true },
      },
      doctor: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h1 className="text-xl font-semibold text-gray-900">Appointments</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage consultations. Times are displayed in Africa/Lagos.
        </p>
      </div>

      <AdminAppointmentsClient initialAppointments={appointments} />
    </div>
  );
}
