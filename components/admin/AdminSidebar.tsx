import Link from "next/link";
import {
  BarChart3,
  User,
  CreditCard,
  LucideIcon,
  ClipboardClock,
  NotepadText,
} from "lucide-react";

type AdminSidebarProps = {
  currentPath: string;
  user: {
    email?: string | null;
    role?: string | null;
  };
};

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
  // Exact match for /admin
  if (href === "/admin") return currentPath === "/admin";
  // Prefix match for nested routes e.g /admin/appointments/*
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function AdminSidebar({ currentPath, user }: AdminSidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r bg-gray-900 text-gray-400 min-h-screen h-full px-4 py-6">
      <div className="mb-8">
        <div className="flex gap-2 text-lg text-white font-semibold ">
          <BarChart3 className="text-gray-200" /> Admin Dashboard
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {user.email} • {user.role}
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = isActive(currentPath, item.href);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sky-400 hover:text-white transition ease-in",
                active ? "bg-sky-500 text-white transition ease-out" : "",
              ].join(" ")}
            >
              <IconComponent className="" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t pt-6">
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
  );
}
