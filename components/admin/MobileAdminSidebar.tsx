"use client";

import Link from "next/link";
import {
  BarChart3,
  User,
  CreditCard,
  ClipboardClock,
  NotepadText,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: User },
  { label: "Appointments", href: "/admin/appointments", icon: ClipboardClock },
  { label: "Availability", href: "/admin/availability", icon: NotepadText },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: User },
];

function isActive(currentPath: string, href: string) {
  if (href === "/admin") return currentPath === "/admin";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function MobileAdminSidebar({
  open,
  onClose,
  currentPath,
  user,
}: {
  open: boolean;
  onClose: () => void;
  currentPath: string;
  user: { email?: string | null; role?: string | null };
}) {
  // Close on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Drawer */}
      <aside className="absolute left-0 top-0 h-full w-[85%] max-w-xs border-r bg-gray-900 text-gray-400 px-4 py-6 shadow-2xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex gap-2 text-lg text-white font-semibold">
              <BarChart3 className="text-gray-200" /> Admin Dashboard
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {user.email} • {user.role}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-200 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(currentPath, item.href);
            const IconComponent = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sky-400 hover:text-white transition ease-in",
                  active ? "bg-sky-500 text-white transition ease-out" : "",
                ].join(" ")}
              >
                <IconComponent className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/10 pt-6">
          <form action="/api/auth/signout" method="post">
            <button
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium cursor-pointer text-gray-700 hover:bg-gray-200 transition-all ease-in"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
