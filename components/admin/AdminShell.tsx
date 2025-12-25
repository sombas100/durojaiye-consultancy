"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import MobileAdminSidebar from "@/components/admin/MobileAdminSidebar";

export default function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { email?: string | null; role?: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 border-b bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>

          <div className="text-sm font-semibold text-gray-900">Admin</div>

          <div className="text-xs text-gray-600 truncate max-w-[45%]">
            {user.email}
          </div>
        </div>
      </header>

      <MobileAdminSidebar
        open={open}
        onClose={() => setOpen(false)}
        currentPath={pathname}
        user={user}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar currentPath={pathname} user={user} />
        </div>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
