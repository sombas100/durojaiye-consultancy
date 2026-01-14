import { prisma } from "@/lib/prisma";

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
