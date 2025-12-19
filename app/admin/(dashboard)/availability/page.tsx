import { prisma } from "@/lib/prisma";
import { requireAdminOrDoctor } from "../../../../lib/auth-guard";
import AvailabilityManager from "./ui/AvailabilityManager";

export default async function AvailabilityPage() {
  const result = await requireAdminOrDoctor();
  if (!result.ok) return null; // layout will redirect anyway

  // For now: single-doctor system, pick the first DOCTOR user
  const doctor = await prisma.user.findFirst({
    where: { role: "DOCTOR" },
    select: { id: true, email: true, name: true },
  });

  const slots = await prisma.availabilitySlot.findMany({
    orderBy: { startTimeUtc: "asc" },
    select: { id: true, startTimeUtc: true, endTimeUtc: true, doctorId: true },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h1 className="text-xl font-semibold text-gray-900">Availability</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create time slots when the doctor is available. Slots are stored in
          UTC.
        </p>
      </div>

      <AvailabilityManager doctor={doctor} initialSlots={slots} />
    </div>
  );
}
