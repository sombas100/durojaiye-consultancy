import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function assertAdminOrDoctor(role?: string) {
  return role === "ADMIN" || role === "DOCTOR";
}

export async function DELETE(req: Request, ctx: { params?: { id?: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Prefer params, fallback to URL parsing
    const url = new URL(req.url);
    const idFromUrl = url.pathname.split("/").filter(Boolean).pop();
    const id = ctx?.params?.id || idFromUrl;

    if (!id) {
      return NextResponse.json({ error: "Missing slot id" }, { status: 400 });
    }

    await prisma.availabilitySlot.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // ✅ If the slot was already deleted (double click or stale UI), don’t 500
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    console.error("DELETE availability slot failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
