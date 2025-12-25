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
};

export default function PatientConfirmedEmail({
  patientName,
  startLabel,
  endLabel,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment is confirmed</Preview>
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
              Appointment confirmed
            </Heading>
            <Text style={{ margin: "0 0 12px" }}>
              Hello <b>{patientName}</b>,
            </Text>
            <Text style={{ margin: "0 0 8px" }}>
              Your consultation has been confirmed.
            </Text>
            <Text style={{ margin: "0 0 8px" }}>
              <b>Time:</b> {startLabel} → {endLabel}
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
