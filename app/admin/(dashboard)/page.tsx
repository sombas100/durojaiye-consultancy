import { prisma } from "@/lib/prisma";
import { requireAdminOrDoctor } from "../../../lib/auth-guard";

const TIMEZONE = "Africa/Lagos";

function startOfDayInLagos(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;

  return new Date(`${y}-${m}-${d}T00:00:00`);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function AdminOverviewPage() {
  const result = await requireAdminOrDoctor();
  if (!result.ok) return null;

  // "Today" window in Lagos
  const dayStart = startOfDayInLagos();
  const dayEnd = addDays(dayStart, 1);

  // Next 7 days window
  const weekEnd = addDays(dayStart, 7);

  const [today, upcoming, counts] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        startTimeUtc: { gte: dayStart, lt: dayEnd },
        status: { not: "CANCELLED" },
      },
      orderBy: { startTimeUtc: "asc" },
      take: 8,
      select: {
        id: true,
        startTimeUtc: true,
        endTimeUtc: true,
        status: true,
        patient: { select: { name: true, surname: true, email: true } },
      },
    }),

    prisma.appointment.findMany({
      where: {
        startTimeUtc: { gte: dayStart, lt: weekEnd },
        status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      },
      orderBy: { startTimeUtc: "asc" },
      take: 8,
      select: {
        id: true,
        startTimeUtc: true,
        endTimeUtc: true,
        status: true,
        patient: { select: { name: true, surname: true, email: true } },
      },
    }),

    prisma.appointment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [c.status, c._count.status]));

  const pendingPayment = countMap.get("PENDING_PAYMENT") ?? 0;
  const confirmed = countMap.get("CONFIRMED") ?? 0;
  const completed = countMap.get("COMPLETED") ?? 0;
  const cancelled = countMap.get("CANCELLED") ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="mt-2 text-sm text-gray-600">
          Quick snapshot of appointments (Africa/Lagos).
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">
            Pending payment
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {pendingPayment}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Confirmed</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {confirmed}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Completed</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {completed}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Cancelled</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {cancelled}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Today</h2>
          <p className="mt-1 text-sm text-gray-600">
            Next appointments scheduled today.
          </p>

          <div className="mt-4 space-y-3">
            {today.length === 0 ? (
              <div className="text-sm text-gray-500">
                No appointments today.
              </div>
            ) : (
              today.map((a) => {
                const patientName =
                  `${a.patient.name ?? ""} ${a.patient.surname ?? ""}`.trim() ||
                  "Patient";
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border bg-sky-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {patientName}
                      </div>
                      <div className="text-xs text-gray-600">{a.status}</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {new Intl.DateTimeFormat("en-GB", {
                        timeZone: TIMEZONE,
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(a.startTimeUtc))}{" "}
                      –{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        timeZone: TIMEZONE,
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(a.endTimeUtc))}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {a.patient.email}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Next 7 days */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming (7 days)
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Pending payment and confirmed appointments.
          </p>

          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <div className="text-sm text-gray-500">
                No upcoming appointments.
              </div>
            ) : (
              upcoming.map((a) => {
                const patientName =
                  `${a.patient.name ?? ""} ${a.patient.surname ?? ""}`.trim() ||
                  "Patient";
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border bg-sky-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {patientName}
                      </div>
                      <div className="text-xs text-gray-600">{a.status}</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {new Intl.DateTimeFormat("en-GB", {
                        timeZone: TIMEZONE,
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(a.startTimeUtc))}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {a.patient.email}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
