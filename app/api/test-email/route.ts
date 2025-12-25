import { NextResponse } from "next/server";
import { resend, RESEND_FROM } from "@/lib/resend";

export const runtime = "nodejs";

export async function GET() {
  const to = process.env.DOCTOR_NOTIFICATION_EMAIL;

  if (!to) {
    return NextResponse.json(
      { ok: false, error: "Missing DOCTOR_NOTIFICATION_EMAIL in env" },
      { status: 400 }
    );
  }

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [to], // use array (Resend docs show array usage)
    subject: "Test email from Durojaiye Consultancy (dev)",
    html: "<p>If you received this, Resend is working ✅</p>",
  });

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
