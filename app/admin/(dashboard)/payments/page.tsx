import { redirect } from "next/navigation";
import { requireAdminOrDoctor } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import PaymentsClient from "./PaymentsClient";

export default async function AdminPaymentsPage() {
  const result = await requireAdminOrDoctor();
  if (!result.ok)
    redirect(result.reason === "UNAUTHENTICATED" ? "/admin/login" : "/");

  const payments = await prisma.payment.findMany({
    where: { status: "SUCCESS" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      status: true,
      amountKobo: true,
      currency: true,
      reference: true,
      provider: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          role: true,
        },
      },
    },
  });

  return <PaymentsClient initialPayments={payments as any} />;
}
