import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function assertAdminOrDoctor(role?: string) {
  return role === "ADMIN" || role === "DOCTOR";
}

const updateSchema = z.object({
  name: z.string().min(1).nullable().optional(),
  surname: z.string().min(1).nullable().optional(),
  email: z.string().email().optional(),
});

// ✅ helper: supports both plain params and Promise params
async function getIdFromContext(context: any) {
  const p = context?.params;
  const resolved = typeof p?.then === "function" ? await p : p;
  return resolved?.id as string | undefined;
}

export async function PATCH(req: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = await getIdFromContext(context);
    if (!id) {
      return NextResponse.json({ error: "Missing user id in route." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (data.email) data.email = data.email.toLowerCase().trim();

    // Only allow editing PATIENT users (safety)
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!target || target.role !== "PATIENT") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err: any) {
    console.error("PATCH /api/users/[id] failed:", err);
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !assertAdminOrDoctor(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = await getIdFromContext(context);
    if (!id) {
      return NextResponse.json({ error: "Missing user id in route." }, { status: 400 });
    }

    // Safety: prevent deleting if user has appointments/subscriptions/payments (no orphaning)
    const counts = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        _count: {
          select: {
            appointments: true,
            subscriptions: true,
            payments: true,
          },
        },
      },
    });

    if (!counts || counts.role !== "PATIENT") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const hasRelations =
      counts._count.appointments > 0 ||
      counts._count.subscriptions > 0 ||
      counts._count.payments > 0;

    if (hasRelations) {
      return NextResponse.json(
        {
          error:
            "Cannot delete user with appointments/subscriptions/payments. Consider deactivating instead.",
        },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/users/[id] failed:", err);
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
