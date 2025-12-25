import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from "@react-email/components";

type Props = {
  doctorName?: string;
  patientName: string;
  patientEmail: string;
  startLabel: string;
  endLabel: string;
  reopenedSlot: boolean;
};

export default function DoctorCancelledByPatientEmail({
  doctorName,
  patientName,
  patientEmail,
  startLabel,
  endLabel,
  reopenedSlot,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Appointment cancelled by patient</Preview>
      <Body
        style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}
      >
        <Container style={{ margin: "0 auto", padding: "24px" }}>
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <Heading style={{ margin: "0 0 12px", fontSize: 18 }}>
              Appointment cancelled
            </Heading>

            {doctorName ? (
              <Text style={{ margin: "0 0 12px", color: "#374151" }}>
                Hello <b>Dr. {doctorName}</b>,
              </Text>
            ) : null}

            <Text style={{ margin: "0 0 8px" }}>
              The patient cancelled their appointment.
            </Text>

            <Text style={{ margin: "0 0 8px" }}>
              <b>Patient:</b> {patientName} ({patientEmail})
            </Text>

            <Text style={{ margin: "0 0 8px" }}>
              <b>Time:</b> {startLabel} → {endLabel}
            </Text>

            <Text style={{ margin: "0" }}>
              <b>Slot reopened:</b>{" "}
              {reopenedSlot ? "Yes" : "No (overlap detected)"}
            </Text>

            <Text style={{ marginTop: 16, color: "#6b7280", fontSize: 12 }}>
              Times shown in Africa/Lagos (WAT).
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
