"use client";

import { useMemo, useState } from "react";

type AppointmentStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

type AppointmentRow = {
  id: string;
  startTimeUtc: string | Date;
  endTimeUtc: string | Date;
  status: AppointmentStatus;
  baseDurationMinutes: number;
  extraMinutes: number;
  extraBlocks: number;
  totalPriceKobo: number;
  createdAt: string | Date;
  patient: {
    id: string;
    name: string | null;
    surname: string | null;
    email: string;
  };
  doctor: { id: string; email: string; name: string | null } | null;
};

const TIMEZONE = "Africa/Lagos";

function formatLagos(iso: string | Date) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function koboToNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function badgeClass(status: AppointmentStatus) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-50 text-green-700 border-green-200";
    case "PENDING_PAYMENT":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "COMPLETED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function AdminAppointmentsClient({
  initialAppointments,
}: {
  initialAppointments: AppointmentRow[];
}) {
  const [items, setItems] = useState<AppointmentRow[]>(
    initialAppointments.map((a) => ({
      ...a,
      startTimeUtc: new Date(a.startTimeUtc).toISOString(),
      endTimeUtc: new Date(a.endTimeUtc).toISOString(),
      createdAt: new Date(a.createdAt).toISOString(),
    }))
  );

  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "ALL">(
    "ALL"
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;

      if (!q) return true;

      const patientName = `${a.patient.name ?? ""} ${a.patient.surname ?? ""}`
        .trim()
        .toLowerCase();
      const patientEmail = a.patient.email.toLowerCase();

      return (
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    });
  }, [items, statusFilter, search]);

  async function updateStatus(
    id: string,
    status: "CONFIRMED" | "COMPLETED" | "CANCELLED"
  ) {
    setError(null);
    setSavingId(id);

    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json().catch(() => null);
    setSavingId(null);

    if (!res.ok) {
      setError(
        data?.error?.message || data?.error || "Failed to update status."
      );
      return;
    }

    setItems((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: data.appointment.status } : a
      )
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient email/name or appointment id…"
            className="w-full sm:w-96 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="ALL">All</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-800">{filtered.length}</span>{" "}
          appointment(s)
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* List */}
      <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-0 border-b bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
          <div className="col-span-3">Patient</div>
          <div className="col-span-3">Time (Africa/Lagos)</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Extra cost</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No appointments found.
          </div>
        ) : (
          filtered.map((a) => {
            const patientName =
              `${a.patient.name ?? ""} ${a.patient.surname ?? ""}`.trim() ||
              "Patient";
            const saving = savingId === a.id;

            return (
              <div key={a.id} className="border-b last:border-b-0 px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-12 md:items-center gap-3">
                  <div className="md:col-span-3">
                    <div className="text-sm font-medium text-gray-900">
                      {patientName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {a.patient.email}
                    </div>
                    <div
                      className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                        a.status
                      )}`}
                    >
                      {a.status.replace("_", " ")}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-sm text-gray-900">
                      {formatLagos(a.startTimeUtc)}
                    </div>
                    <div className="text-xs text-gray-500">
                      to {formatLagos(a.endTimeUtc)}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-900">
                      {a.baseDurationMinutes + a.extraMinutes} mins
                    </div>
                    <div className="text-xs text-gray-500">
                      Base: {a.baseDurationMinutes}mins • Extra:{" "}
                      {a.extraMinutes}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-900">
                      {koboToNaira(a.totalPriceKobo)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {a.extraBlocks} × 10 mins
                    </div>
                  </div>

                  <div className="md:col-span-2 md:justify-self-end flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(a.id, "CONFIRMED")}
                      disabled={saving || a.status === "CONFIRMED"}
                      className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(a.id, "COMPLETED")}
                      disabled={saving || a.status === "COMPLETED"}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => updateStatus(a.id, "CANCELLED")}
                      disabled={saving || a.status === "CANCELLED"}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {saving ? (
                  <div className="mt-3 text-xs text-gray-500">Saving…</div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
