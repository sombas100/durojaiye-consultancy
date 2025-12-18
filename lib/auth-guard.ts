import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type AdminAccessResult =
  | { ok: true; session: Session }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

export async function requireAdminOrDoctor(): Promise<AdminAccessResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "DOCTOR") {
    return { ok: false, reason: "FORBIDDEN" };
  }

  return { ok: true, session };
}
