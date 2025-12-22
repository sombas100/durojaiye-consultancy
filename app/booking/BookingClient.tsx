"use client";

import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

type Slot = {
  id: string;
  doctorId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  doctor?: { name: string | null; email: string | null };
};

const BASE_MINUTES = 30;
const EXTRA_BLOCK_PRICE_KOBO = 1_000_000; // ₦10,000
const EXTRA_10MIN_PRICE_NAIRA = 10_000;
const TIMEZONE = "Africa/Lagos";

function formatLagos(iso: string) {
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

function formatNaira(naira: number) {
  return `₦${naira.toLocaleString("en-NG")}`;
}

function minutesBetween(startIso: string, endIso: string) {
  return Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  );
}

export default function BookingClient() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [extraMinutes, setExtraMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingSlots(true);
      const res = await fetch("/api/availability");
      const data = await res.json().catch(() => null);
      setLoadingSlots(false);

      if (!res.ok) {
        setMessage(data?.error || "Failed to load availability.");
        return;
      }

      setSlots(
        (data?.slots ?? []).map((s: any) => ({
          ...s,
          startTimeUtc: new Date(s.startTimeUtc).toISOString(),
          endTimeUtc: new Date(s.endTimeUtc).toISOString(),
        }))
      );
    })();
  }, []);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) ?? null,
    [slots, selectedSlotId]
  );

  const extraBlocks = extraMinutes / 10;
  const totalKobo = extraBlocks * EXTRA_BLOCK_PRICE_KOBO;

  async function book() {
    setMessage(null);

    if (!selectedSlotId) {
      setMessage("Please select a time slot.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: selectedSlotId, extraMinutes }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setMessage(data?.error?.message || data?.error || "Booking failed.");
      return;
    } else {
      toast.success("Appointment confirmed!");
    }

    // Remove booked slot from the list
    setSlots((prev) => prev.filter((s) => s.id !== selectedSlotId));
    setSelectedSlotId("");
    setExtraMinutes(0);

    setMessage(
      data?.appointment?.status === "PENDING_PAYMENT"
        ? "Appointment created. Payment will be required for extra minutes (Paystack coming next)."
        : "Appointment confirmed!"
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Slots */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900">Available slots</h2>
        <p className="mt-2 text-sm text-gray-600">
          Times shown in Africa/Lagos.
        </p>

        <div className="mt-4 space-y-2">
          {loadingSlots ? (
            <div className="text-sm text-gray-500">Loading slots…</div>
          ) : slots.length === 0 ? (
            <div className="text-sm text-gray-500">
              No availability right now.
            </div>
          ) : (
            slots.map((slot) => {
              const active = slot.id === selectedSlotId;
              const slotMins = minutesBetween(
                slot.startTimeUtc,
                slot.endTimeUtc
              );

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={[
                    "w-full text-left rounded-xl border px-4 py-3 transition",
                    active ? "border-blue-600 bg-blue-50" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {formatLagos(slot.startTimeUtc)}{" "}
                    <span className="text-gray-500 font-normal">→</span>{" "}
                    {formatLagos(slot.endTimeUtc)}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>
                      Doctor:{" "}
                      {slot.doctor?.name ?? slot.doctor?.email ?? "Doctor"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>{slotMins} mins</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Booking */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900">Your booking</h2>

        <div className="mt-4 space-y-4">
          {/* Selected slot */}
          <div className="rounded-xl bg-gray-50 border p-4">
            <div className="text-sm text-gray-600">Selected slot</div>

            {selectedSlot ? (
              <div className="mt-1 space-y-1">
                <div className="text-sm font-medium text-gray-900">
                  {formatLagos(selectedSlot.startTimeUtc)}{" "}
                  <span className="text-gray-500 font-normal">→</span>{" "}
                  {formatLagos(selectedSlot.endTimeUtc)}
                </div>
                <div className="text-xs text-gray-600">
                  Slot duration:{" "}
                  <span className="font-medium">
                    {minutesBetween(
                      selectedSlot.startTimeUtc,
                      selectedSlot.endTimeUtc
                    )}{" "}
                    mins
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm font-medium text-gray-900">None</div>
            )}
          </div>

          {/* Base consultation info */}
          <div className="rounded-xl border bg-blue-50 p-4">
            <div className="text-sm font-semibold text-gray-900">
              Consultation time
            </div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>
                • <span className="font-medium">{BASE_MINUTES} minutes</span>{" "}
                included (base consultation)
              </li>
              <li>
                • Extra time is charged in{" "}
                <span className="font-medium">10-minute</span> blocks:{" "}
                <span className="font-medium">
                  {formatNaira(EXTRA_10MIN_PRICE_NAIRA)}
                </span>{" "}
                per block
              </li>
              <li className="text-xs text-gray-600">
                Extra time must fit within the selected availability slot.
              </li>
            </ul>
          </div>

          {/* Extra time selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra time (10-minute increments)
            </label>
            <select
              value={extraMinutes}
              onChange={(e) => setExtraMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              {[0, 10, 20, 30, 40, 50, 60].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "No extra time" : `+${m} minutes`}
                </option>
              ))}
            </select>

            <div className="mt-2 text-sm text-gray-600">
              Extra cost:{" "}
              <span className="font-medium">{koboToNaira(totalKobo)}</span>
            </div>
          </div>

          {message ? (
            <div className="rounded-xl border p-3 text-sm text-gray-700 bg-gray-50">
              {message}
            </div>
          ) : null}

          <button
            disabled={loading}
            onClick={book}
            className="w-full rounded-xl bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
