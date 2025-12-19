"use client";

import { useMemo, useState } from "react";

type Slot = {
  id: string;
  doctorId: string;
  startTimeUtc: string | Date;
  endTimeUtc: string | Date;
};

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

    // datetime-local returns local time. We convert to ISO; browser will convert based on local TZ.
    // Later we can force Africa/Lagos display explicitly, but this is okay for now.
    const startIso = new Date(start).toISOString();
    const endIso = new Date(end).toISOString();

    setLoading(true);
    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        startTimeUtc: startIso,
        endTimeUtc: endIso,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data?.error?.message || data?.error || "Failed to create slot.");
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

    setStart("");
    setEnd("");
  }

  async function removeSlot(id: string) {
    setError(null);

    const res = await fetch(`/api/admin/availability/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.log("Delete failed:", res.status, data);
      setError(data?.error || "Failed to delete slot.");
      return;
    }

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

        <form onSubmit={createSlot} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start (local)
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End (local)
            </label>
            <input
              type="datetime-local"
              value={end}
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
            className="w-full rounded-xl bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create slot"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900">Existing slots</h2>
        <p className="mt-2 text-sm text-gray-600">
          Stored in UTC. (We’ll display Africa/Lagos nicely next.)
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
                    Start: {new Date(s.startTimeUtc).toUTCString()}
                  </div>
                  <div>End: {new Date(s.endTimeUtc).toUTCString()}</div>
                </div>

                <button
                  onClick={() => removeSlot(s.id)}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
