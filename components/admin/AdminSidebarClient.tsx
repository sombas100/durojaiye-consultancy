"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default function AdminSidebarClient({
  user,
}: {
  user: { email?: string | null; role?: string | null };
}) {
  const pathname = usePathname();
  return <AdminSidebar currentPath={pathname} user={user} />;
}
