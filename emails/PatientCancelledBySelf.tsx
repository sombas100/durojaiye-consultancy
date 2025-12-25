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
  patientName: string;
  startLabel: string;
  endLabel: string;
  reopenedSlot: boolean;
};

export default function PatientCancelledBySelfEmail({
  patientName,
  startLabel,
  endLabel,
  reopenedSlot,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment has been cancelled</Preview>
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

            <Text style={{ margin: "0 0 12px" }}>
              Hello <b>{patientName}</b>,
            </Text>

            <Text style={{ margin: "0 0 8px" }}>
              You have cancelled your consultation appointment.
            </Text>

            <Text style={{ margin: "0 0 8px" }}>
              <b>Time:</b> {startLabel} → {endLabel}
            </Text>

            <Text style={{ margin: "0" }}>
              <b>Slot reopened:</b>{" "}
              {reopenedSlot ? "Yes" : "Not reopened (overlap detected)"}
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
