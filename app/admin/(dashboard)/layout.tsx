import { redirect } from "next/navigation";
import { requireAdminOrDoctor } from "@/lib/auth-guard";
import { BarChart3, Mail, LogIn, LogOut, Settings, Plus } from "lucide-react";
import AdminSidebarClient from "@/components/admin/AdminSidebarClient";

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebarClient user={{ email: user.email, role: user.role }} />

        {/* Main content */}
        <div className="flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-6 py-4">
              <div className="text-sm text-gray-600">
                Welcome back{user.name ? `, ${user.name}` : ""}.
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
