import { redirect } from "next/navigation";
import { requireAdminOrDoctor } from "@/lib/auth-guard";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdminOrDoctor();

  if (!result.ok) {
    redirect(result.reason === "UNAUTHENTICATED" ? "/admin/login" : "/");
  }

  const user = result.session.user;

  return (
    <AdminShell user={{ email: user.email, role: user.role }}>
      {/* Top bar (kept from your existing layout) */}
      <header className="sticky top-0 z-20 shadow-md bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Greeting + context */}
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Welcome back{user.name ? `, ${user.name}` : ""}
              </h1>
              <p className="text-xs text-gray-500">
                Manage appointments, availability and patient activity
              </p>
            </div>

            {/* Right: Optional status / date (future-proof) */}
            <div className="mt-2 sm:mt-0 text-xs text-gray-500">
              {new Intl.DateTimeFormat("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</main>
    </AdminShell>
  );
}
