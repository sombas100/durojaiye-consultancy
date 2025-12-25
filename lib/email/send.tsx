import DoctorBookedEmail from "@/emails/DoctorBooked";
import DoctorCancelledByPatientEmail from "@/emails/DoctorCancelledByPatient";

import PatientConfirmedEmail from "@/emails/PatientConfirmed";
import PatientBookedEmail from "@/emails/PatientBooked";
import PatientCancelledByClinicEmail from "@/emails/PatientCancelledByClinic";
import PatientCancelledBySelfEmail from "@/emails/PatientCancelledBySelf";

import { resend, RESEND_FROM } from "@/lib/resend";
import { formatLagos } from "@/lib/time";

type SendDoctorBookedParams = {
  doctorEmail: string;
  doctorName?: string | null;
  patientName: string;
  patientEmail: string;
  startTimeUtc: Date | string;
  endTimeUtc: Date | string;
  extraMinutes: number;
  statusLabel: string; // "CONFIRMED" | "PENDING_PAYMENT"
};

type SendDoctorCancelledByPatientParams = {
  doctorEmail: string;
  doctorName?: string | null;
  patientName: string;
  patientEmail: string;
  startTimeUtc: Date | string;
  endTimeUtc: Date | string;
  reopenedSlot: boolean;
};

type PatientEmailParams = {
  patientEmail: string;
  patientName: string;
  startTimeUtc: Date | string;
  endTimeUtc: Date | string;
};

type SendPatientBookedParams = {
  patientEmail: string;
  patientName: string;
  startTimeUtc: Date | string;
  endTimeUtc: Date | string;
  statusLabel: string;
};

type SendPatientCancelledBySelfParams = {
  patientEmail: string;
  patientName: string;
  startTimeUtc: Date | string;
  endTimeUtc: Date | string;
  reopenedSlot: boolean;
};

function resolveDoctorRecipientEmail(dbDoctorEmail: string) {
  return process.env.DOCTOR_NOTIFICATION_EMAIL_OVERRIDE || dbDoctorEmail;
}

export async function sendDoctorBookedEmail(params: SendDoctorBookedParams) {
  if (!process.env.RESEND_API_KEY) return;

  const startLabel = formatLagos(params.startTimeUtc);
  const endLabel = formatLagos(params.endTimeUtc);
  const to = resolveDoctorRecipientEmail(params.doctorEmail);

  await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject: `New appointment booked (${params.statusLabel.replace("_", " ")})`,
    react: (
      <DoctorBookedEmail
        doctorName={params.doctorName ?? undefined}
        patientName={params.patientName}
        patientEmail={params.patientEmail}
        startLabel={startLabel}
        endLabel={endLabel}
        extraMinutes={params.extraMinutes}
        statusLabel={params.statusLabel}
      />
    ),
  });
}

export async function sendDoctorCancelledByPatientEmail(
  params: SendDoctorCancelledByPatientParams
) {
  if (!process.env.RESEND_API_KEY) return;

  const startLabel = formatLagos(params.startTimeUtc);
  const endLabel = formatLagos(params.endTimeUtc);
  const to = resolveDoctorRecipientEmail(params.doctorEmail);

  await resend.emails.send({
    from: RESEND_FROM,
    to: params.doctorEmail,
    subject: `Appointment cancelled by patient`,
    react: (
      <DoctorCancelledByPatientEmail
        doctorName={params.doctorName ?? undefined}
        patientName={params.patientName}
        patientEmail={params.patientEmail}
        startLabel={startLabel}
        endLabel={endLabel}
        reopenedSlot={params.reopenedSlot}
      />
    ),
  });
}

export async function sendPatientConfirmedEmail(params: PatientEmailParams) {
  if (!process.env.RESEND_API_KEY) return;

  const startLabel = formatLagos(params.startTimeUtc);
  const endLabel = formatLagos(params.endTimeUtc);

  await resend.emails.send({
    from: RESEND_FROM,
    to: params.patientEmail,
    subject: "Your consultation has been confirmed",
    react: (
      <PatientConfirmedEmail
        patientName={params.patientName}
        startLabel={startLabel}
        endLabel={endLabel}
      />
    ),
  });
}

export async function sendPatientCancelledByClinicEmail(
  params: PatientEmailParams
) {
  if (!process.env.RESEND_API_KEY) return;

  const startLabel = formatLagos(params.startTimeUtc);
  const endLabel = formatLagos(params.endTimeUtc);

  await resend.emails.send({
    from: RESEND_FROM,
    to: params.patientEmail,
    subject: "Your consultation has been cancelled",
    react: (
      <PatientCancelledByClinicEmail
        patientName={params.patientName}
        startLabel={startLabel}
        endLabel={endLabel}
      />
    ),
  });
}

export async function sendPatientBookedEmail(params: SendPatientBookedParams) {
  if (!process.env.RESEND_API_KEY) return;

  const startLabel = formatLagos(params.startTimeUtc);
  const endLabel = formatLagos(params.endTimeUtc);

  await resend.emails.send({
    from: RESEND_FROM,
    to: params.patientEmail,
    subject: `Appointment booked (${params.statusLabel.replace("_", " ")})`,
    react: (
      <PatientBookedEmail
        patientName={params.patientName}
        startLabel={startLabel}
        endLabel={endLabel}
        statusLabel={params.statusLabel}
      />
    ),
  });
}

export async function sendPatientCancelledBySelfEmail(
  params: SendPatientCancelledBySelfParams
) {
  if (!process.env.RESEND_API_KEY) return;

  const startLabel = formatLagos(params.startTimeUtc);
  const endLabel = formatLagos(params.endTimeUtc);

  await resend.emails.send({
    from: RESEND_FROM,
    to: params.patientEmail,
    subject: "Your appointment has been cancelled",
    react: (
      <PatientCancelledBySelfEmail
        patientName={params.patientName}
        startLabel={startLabel}
        endLabel={endLabel}
        reopenedSlot={params.reopenedSlot}
      />
    ),
  });
}
