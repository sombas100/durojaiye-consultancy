import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
    status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]),
})

function assertAdminOrDoctor(role?: string) {
  return role === "ADMIN" || role === "DOCTOR";
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url)
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: "Missing appointment id" }, { status: 400 });
    }

    const body = await request.json();
    const validation = schema.safeParse(body);
    if(!validation.success)
        return NextResponse.json({ error: validation.error.message }, { status: 400 })

    const updated = await prisma.appointment.update({
        where: { id },
        data: { status: validation.data.status },
        select: { id: true, status: true, updatedAt: true },
    })

    return NextResponse.json({ appointment: updated })
    } catch (error: any) {
        if (error?.code === "P2025") {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    console.error("PATCH admin appointment failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}