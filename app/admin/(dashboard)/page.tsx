export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="mt-2 text-sm text-gray-600">
          This is your admin dashboard. We’ll add appointments, availability,
          payments, and user management here next.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="text-sm text-gray-500">Upcoming appointments</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="text-sm text-gray-500">Today</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="text-sm text-gray-500">Active subscriptions</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border">
          <div className="text-sm text-gray-500">Payments (30 days)</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">—</div>
        </div>
      </div>
    </div>
  );
}
