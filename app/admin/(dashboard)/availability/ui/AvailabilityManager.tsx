"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

type Slot = {
  id: string;
  doctorId: string;
  startTimeUtc: string | Date;
  endTimeUtc: string | Date;
};

const LAGOS_TZ = "Africa/Lagos";

function formatLagos(iso: string | Date) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Returns "YYYY-MM-DDTHH:mm" formatted in Africa/Lagos (for datetime-local inputs)
function formatDatetimeLocalInLagos(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  const yyyy = parts.year;
  const mm = parts.month;
  const dd = parts.day;
  const hh = parts.hour;
  const min = parts.minute;

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Convert Lagos "YYYY-MM-DDTHH:mm" to a UTC Date, regardless of the user's device timezone.
 * (Nigeria doesn't do DST; still computed safely.)
 */
function lagosDatetimeLocalToUtcDate(value: string) {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);

  // Build a "fake UTC" date with these wall-clock components
  const fakeUtc = new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0));

  // Determine Lagos offset at that instant by comparing Lagos vs UTC formatted minutes
  const toMinutes = (parts: Intl.DateTimeFormatPart[]) => {
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const m2 = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return h * 60 + m2;
  };

  const utcParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(fakeUtc);

  const lagosParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(fakeUtc);

  let offsetMinutes = toMinutes(lagosParts) - toMinutes(utcParts);

  // handle wrap-around across midnight
  if (offsetMinutes > 720) offsetMinutes -= 1440;
  if (offsetMinutes < -720) offsetMinutes += 1440;

  // UTC = Lagos - offset
  return new Date(fakeUtc.getTime() - offsetMinutes * 60_000);
}

export default function AvailabilityManager({
  doctor,
  initialSlots,
}: {
  doctor: { id: string; email: string | null; name: string | null } | null;
  initialSlots: Slot[];
}) {
  const [slots, setSlots] = useState<Slot[]>(
    initialSlots.map((s) => ({
      ...s,
      startTimeUtc: new Date(s.startTimeUtc).toISOString(),
      endTimeUtc: new Date(s.endTimeUtc).toISOString(),
    }))
  );

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorId = doctor?.id ?? "";

  const minStart = useMemo(() => {
    // 1 minute grace
    return formatDatetimeLocalInLagos(new Date(Date.now() - 60_000));
  }, []);

  const minEnd = useMemo(() => {
    if (!start) return minStart;
    return start; // end cannot be before start
  }, [start, minStart]);

  const sortedSlots = useMemo(
    () =>
      [...slots].sort(
        (a, b) =>
          new Date(a.startTimeUtc).getTime() -
          new Date(b.startTimeUtc).getTime()
      ),
    [slots]
  );

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!doctorId) {
      setError("No doctor account found. Create a DOCTOR user first.");
      return;
    }

    if (!start || !end) {
      setError("Please choose a start and end time.");
      return;
    }

    // Convert input (Lagos wall clock) -> UTC
    const startUtc = lagosDatetimeLocalToUtcDate(start);
    const endUtc = lagosDatetimeLocalToUtcDate(end);

    // Client-side checks (API will also enforce)
    const nowMinus1Min = new Date(Date.now() - 60_000);
    if (startUtc < nowMinus1Min) {
      setError("You cannot create availability in the past.");
      return;
    }
    if (endUtc <= startUtc) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        startTimeUtc: startUtc.toISOString(),
        endTimeUtc: endUtc.toISOString(),
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      const msg =
        data?.error?.message || data?.error || "Failed to create slot.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSlots((prev) => [
      ...prev,
      {
        id: data.slot.id,
        doctorId: data.slot.doctorId,
        startTimeUtc: new Date(data.slot.startTimeUtc).toISOString(),
        endTimeUtc: new Date(data.slot.endTimeUtc).toISOString(),
      },
    ]);

    toast.success("Availability slot successfully created");
    setStart("");
    setEnd("");
  }

  async function removeSlot(id: string) {
    setError(null);
    if (!confirm("Are you sure you want to delete this slot?")) return;

    const res = await fetch(`/api/admin/availability/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error || "Failed to delete slot.";
      console.log("Delete failed:", res.status, data);
      setError(msg);
      toast.error(msg);
      return;
    }

    toast.success("Availability slot successfully deleted");
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900">Create slot</h2>

        <div className="mt-2 text-sm text-gray-600">
          Doctor:{" "}
          <span className="font-medium text-gray-800">
            {doctor?.name ?? "Not found"}
          </span>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Times are entered in{" "}
          <span className="font-medium">Africa/Lagos (WAT)</span> and stored in
          UTC.
        </p>

        <form onSubmit={createSlot} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start (Africa/Lagos)
            </label>
            <input
              type="datetime-local"
              value={start}
              min={minStart}
              onChange={(e) => {
                setStart(e.target.value);
                // if end is before new start, reset end to avoid confusion
                if (end && e.target.value && end < e.target.value) setEnd("");
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End (Africa/Lagos)
            </label>
            <input
              type="datetime-local"
              value={end}
              min={minEnd}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            type="submit"
            className="w-full flex items-center cursor-pointer justify-center gap-1 rounded-xl bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {loading ? "Creating..." : "Create slot"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900">Existing slots</h2>
        <p className="mt-2 text-sm text-gray-600">
          Times shown in Africa/Lagos (WAT).
        </p>

        <div className="mt-5 space-y-3">
          {sortedSlots.length === 0 ? (
            <div className="text-sm text-gray-500">No slots yet.</div>
          ) : (
            sortedSlots.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div className="text-sm text-gray-800">
                  <div className="font-medium">
                    <span className="font-semibold">Start:</span>{" "}
                    {formatLagos(s.startTimeUtc)}
                  </div>
                  <div>
                    <span className="font-semibold">End:</span>{" "}
                    {formatLagos(s.endTimeUtc)}
                  </div>
                </div>

                <button
                  onClick={() => removeSlot(s.id)}
                  className="rounded-lg cursor-pointer bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
