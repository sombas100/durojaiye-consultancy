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
  extraPriceKobo?: number;
  createdAt: string | Date;
  doctor: { name: string | null; email: string | null } | null;
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

export default function MyAppointmentsClient({
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
  const [error, setError] = useState<string | null>(null);

  // Used for cancel only
  const [savingId, setSavingId] = useState<string | null>(null);

  // Used for Paystack redirect/init
  const [payingId, setPayingId] = useState<string | null>(null);

  // ✅ Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10 | 20>(10);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      return true;
    });
  }, [items, statusFilter]);

  // ✅ Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered.length, pageSize]);

  // ✅ If list shrinks (e.g. cancel changes filter results) keep page valid
  useEffect(() => {
    setPage((p) => clamp(p, 1, totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function pageNumbers() {
    // simple windowed pager: up to 5 numbers
    const maxButtons = 5;
    if (totalPages <= maxButtons)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const half = Math.floor(maxButtons / 2);
    let start = page - half;
    let end = page + half;

    if (start < 1) {
      start = 1;
      end = maxButtons;
    }
    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxButtons + 1;
    }

    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }

  async function cancelAppointment(id: string) {
    const appt = items.find((x) => x.id === id);

    const ok = window.confirm(
      `Are you sure you want to cancel this appointment?\n\n${
        appt
          ? `${formatLagos(appt.startTimeUtc)} → ${formatLagos(appt.endTimeUtc)}`
          : ""
      }`
    );
    if (!ok) return;

    setError(null);
    setSavingId(id);

    const res = await fetch(`/api/my-appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL" }),
    });

    const data = await res.json().catch(() => null);
    setSavingId(null);

    if (!res.ok) {
      const msg =
        data?.error?.message || data?.error || "Failed to cancel appointment.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setItems((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: data.appointment.status } : a
      )
    );

    toast.success(
      data?.reopenedSlot
        ? "Appointment cancelled. The slot has been reopened."
        : "Appointment cancelled."
    );
  }

  async function payExtraTime(appointmentId: string) {
    setError(null);
    setPayingId(appointmentId);

    try {
      const res = await fetch("/api/billing/extra-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          data?.error ||
          "Unable to start extra-minutes payment.";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Redirecting to Paystack…");
      window.location.href = data.authorizationUrl;
    } catch (e) {
      console.error(e);
      const msg = "Something went wrong starting payment. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
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

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as any)}
            className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            title="Items per page"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>

        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>
            Showing{" "}
            <span className="font-medium text-gray-800">{filtered.length}</span>{" "}
            appointment(s)
          </span>
          <span className="text-gray-300">•</span>
          <span>
            Page <span className="font-medium text-gray-800">{page}</span> of{" "}
            <span className="font-medium text-gray-800">{totalPages}</span>
          </span>
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
          <div className="col-span-4">Doctor</div>
          <div className="col-span-4">Time (Africa/Lagos)</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No appointments found.
          </div>
        ) : (
          paged.map((a) => {
            const cancelling = savingId === a.id;
            const paying = payingId === a.id;

            const doctorName = a.doctor?.name ?? a.doctor?.email ?? "Doctor";

            const canCancel =
              a.status === "CONFIRMED" || a.status === "PENDING_PAYMENT";

            const canPayExtra =
              a.status === "PENDING_PAYMENT" && (a.extraMinutes ?? 0) > 0;

            const extraCostKobo =
              typeof a.extraPriceKobo === "number"
                ? a.extraPriceKobo
                : a.totalPriceKobo;

            return (
              <div key={a.id} className="border-b last:border-b-0 px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-12 md:items-center gap-3">
                  <div className="md:col-span-4">
                    <div className="text-sm font-medium text-gray-900">
                      {doctorName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {a.doctor?.email}
                    </div>

                    <div
                      className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                        a.status
                      )}`}
                    >
                      {a.status.replaceAll("_", " ")}
                    </div>

                    {a.extraMinutes > 0 ? (
                      <div className="mt-2 text-xs text-gray-500">
                        Extra cost:{" "}
                        <span className="font-medium text-gray-800">
                          {koboToNaira(extraCostKobo)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="md:col-span-4">
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
                      Base: {a.baseDurationMinutes} • Extra: {a.extraMinutes}
                    </div>
                  </div>

                  <div className="md:col-span-2 md:justify-self-end flex justify-end gap-2">
                    {canPayExtra ? (
                      <button
                        onClick={() => payExtraTime(a.id)}
                        disabled={paying || cancelling}
                        className="rounded-lg cursor-pointer bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {paying ? "Redirecting..." : "Pay extra time"}
                      </button>
                    ) : null}

                    {canCancel ? (
                      <button
                        onClick={() => cancelAppointment(a.id)}
                        disabled={cancelling || paying}
                        className="rounded-lg cursor-pointer bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancelling ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : !canPayExtra ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : null}
                  </div>
                </div>

                {a.status === "PENDING_PAYMENT" ? (
                  <div className="mt-3 rounded-xl border bg-yellow-50 p-3 text-xs text-yellow-800">
                    Payment is required for extra minutes before the appointment
                    can be confirmed.
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* ✅ Pagination */}
      {filtered.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-800">
              {(page - 1) * pageSize + 1}
            </span>{" "}
            –{" "}
            <span className="font-medium text-gray-800">
              {Math.min(page * pageSize, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-800">{filtered.length}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="rounded-lg cursor-pointer border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg cursor-pointer border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            {pageNumbers().map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={[
                  "rounded-lg border cursor-pointer px-3 py-2 text-xs font-medium",
                  n === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border cursor-pointer px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="rounded-lg border cursor-pointer px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      ) : null}

      <ToastContainer />
    </div>
  );
}
