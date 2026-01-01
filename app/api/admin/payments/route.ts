import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function assertAdminOrDoctor(role?: string) {
  return role === "ADMIN" || role === "DOCTOR";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") || "SUCCESS"; // default: only completed
  const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 200);
  const skip = Number(req.nextUrl.searchParams.get("skip") || 0);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { status: status as any },
      orderBy: { createdAt: "desc" },
      skip,
      take,
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
          select: { id: true, email: true, name: true, surname: true, role: true },
        },
      },
    }),
    prisma.payment.count({ where: { status: status as any } }),
  ]);

  return NextResponse.json({ payments, total });
}
