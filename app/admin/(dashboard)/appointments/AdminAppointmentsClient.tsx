"use client";

import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...items] // clone to avoid mutating state
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .filter((a) => {
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

  // Reset to page 1 when filters/search/pageSize change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, pageSize]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clamp(page, 1, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, safePage, pageSize]);

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  function pageNumbers() {
    const pages: (number | "...")[] = [];
    const maxButtons = 7;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const left = Math.max(1, safePage - 1);
    const right = Math.min(totalPages, safePage + 1);

    pages.push(1);

    if (left > 2) pages.push("...");

    for (let i = left; i <= right; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }

    if (right < totalPages - 1) pages.push("...");

    pages.push(totalPages);

    // remove duplicates (rare edges)
    return pages.filter((p, idx, arr) => arr.indexOf(p) === idx);
  }

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
      const msg =
        data?.error?.message || data?.error || "Failed to update status.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setItems((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: data.appointment.status } : a
      )
    );

    if (status === "CONFIRMED") {
      toast.success("Appointment confirmed. Patient has been notified.");
    } else if (status === "COMPLETED") {
      toast.success("Appointment marked as completed.");
    } else if (status === "CANCELLED") {
      toast.success(
        data?.reopenedSlot
          ? "Appointment cancelled. Slot reopened and patient notified."
          : "Appointment cancelled. Patient notified."
      );
    } else {
      toast.success("Appointment updated.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient email/name or appointment id…"
            className="w-full sm:w-96 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="ALL">All</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as any)}
            className="w-full sm:w-auto rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            title="Rows per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-800">
            {from}-{to}
          </span>{" "}
          of <span className="font-medium text-gray-800">{total}</span>
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

        {total === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No appointments found.
          </div>
        ) : (
          paged.map((a) => {
            const patientName =
              `${a.patient.name ?? ""} ${a.patient.surname ?? ""}`.trim() ||
              "Patient";
            const saving = savingId === a.id;

            // ✅ Ruleset
            const canConfirm = a.status === "PENDING_PAYMENT";
            const canComplete = a.status === "CONFIRMED";
            const canCancel =
              a.status === "PENDING_PAYMENT" || a.status === "CONFIRMED";

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
                      disabled={saving || !canConfirm}
                      title={
                        !canConfirm
                          ? "Only pending payment appointments can be confirmed."
                          : ""
                      }
                      className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm
                    </button>

                    <button
                      onClick={() => updateStatus(a.id, "COMPLETED")}
                      disabled={saving || !canComplete}
                      title={
                        !canComplete
                          ? "Only confirmed appointments can be completed."
                          : ""
                      }
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() => updateStatus(a.id, "CANCELLED")}
                      disabled={saving || !canCancel}
                      title={
                        !canCancel
                          ? "Only pending payment or confirmed appointments can be cancelled."
                          : ""
                      }
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

      {/* Pagination footer */}
      {total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Page <span className="font-medium text-gray-800">{safePage}</span>{" "}
            of <span className="font-medium text-gray-800">{totalPages}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            {pageNumbers().map((p, idx) =>
              p === "..." ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 text-xs text-gray-500"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "rounded-lg border px-3 py-2 text-xs font-medium",
                    p === safePage
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <ToastContainer />
    </div>
  );
}
