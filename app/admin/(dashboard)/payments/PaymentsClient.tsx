"use client";

import { useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

type PaymentRow = {
  id: string;
  type: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  amountKobo: number;
  currency: string;
  reference: string | null;
  provider: string;
  createdAt: string | Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    role: string;
  };
};

function koboToNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default function PaymentsClient({
  initialPayments,
}: {
  initialPayments: PaymentRow[];
}) {
  const [items] = useState<PaymentRow[]>(
    initialPayments.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt).toISOString(),
    }))
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((p) => {
      const name = `${p.user.name ?? ""} ${p.user.surname ?? ""}`
        .trim()
        .toLowerCase();
      return (
        p.user.email.toLowerCase().includes(q) ||
        name.includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name or reference…"
          className="w-full sm:w-96 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
        />
        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-800">{filtered.length}</span>{" "}
          payment(s)
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-2">Date</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No payments found.</div>
        ) : (
          filtered.map((p) => {
            const userName =
              `${p.user.name ?? ""} ${p.user.surname ?? ""}`.trim() || "User";
            return (
              <div key={p.id} className="border-b last:border-b-0 px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center">
                  <div className="md:col-span-4">
                    <div className="text-sm font-medium text-gray-900">
                      {userName}
                    </div>
                    <div className="text-xs text-gray-500">{p.user.email}</div>
                  </div>

                  <div className="md:col-span-2 text-sm text-gray-900">
                    {p.currency === "NGN"
                      ? koboToNaira(p.amountKobo)
                      : `${p.amountKobo} ${p.currency}`}
                  </div>

                  <div className="md:col-span-2 text-sm text-gray-700">
                    {p.type}
                  </div>

                  <div className="md:col-span-2 text-xs text-gray-600 font-mono break-all">
                    {p.reference ?? "—"}
                  </div>

                  <div className="md:col-span-2 text-xs text-gray-500">
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
