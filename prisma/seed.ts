import { PrismaClient, Role } from "@/app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1) Create (or upsert) the subscription plan
  const plan = await prisma.plan.upsert({
    where: { id: "1", name: "Standard Subscription" },
    update: {
      priceKobo: 5_000_000, // ₦50,000
      interval: "monthly",
      isActive: true,
    },
    create: {
      name: "Standard Subscription",
      priceKobo: 5_000_000,
      interval: "monthly",
      isActive: true,
      // paystackPlanCode: "PLN_xxx" // fill after you create it in Paystack dashboard/API
    },
  });

  // 2) Create a doctor user (you can change email later)
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@example.com" },
    update: { role: Role.DOCTOR },
    create: {
      email: "doctor@example.com",
      name: "Doctor corey",
      surname: "Clarke",
      role: Role.DOCTOR,
    },
  });

  // 3) Create the doctor profile pricing config
  await prisma.doctorProfile.upsert({
    where: { userId: doctor.id },
    update: {
      timezone: "Africa/Lagos",
      baseDurationMinutes: 30,
      basePriceKobo: 0, // included in subscription
      extra10MinPriceKobo: 1_000_000, // ₦10,000
    },
    create: {
      userId: doctor.id,
      timezone: "Africa/Lagos",
      baseDurationMinutes: 30,
      basePriceKobo: 0,
      extra10MinPriceKobo: 1_000_000,
    },
  });

  console.log("Seeded:", { plan: plan.name, doctorEmail: doctor.email });
}

main()
  .finally(async () => prisma.$disconnect());