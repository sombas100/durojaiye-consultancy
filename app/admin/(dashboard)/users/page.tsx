import { redirect } from "next/navigation";
import { requireAdminOrDoctor } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const result = await requireAdminOrDoctor();
  if (!result.ok)
    redirect(result.reason === "UNAUTHENTICATED" ? "/admin/login" : "/");

  const users = await prisma.user.findMany({
    where: { role: "PATIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return <UsersClient initialUsers={users as any} />;
}
