import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const schema = z.object({
    name: z.string().min(1).optional(),
    surname: z.string().min(1).optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
})

export async function POST(request: NextRequest) {
    const body = await request.json();
    const validation = schema.safeParse(body);
    if (!validation.success)
        return NextResponse.json({ error: validation.error.message }, { status: 400 });

    const email = validation.data.email.toLowerCase().trim();
    const { name, surname, password } = validation.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })
        if (existingUser)
            return NextResponse.json({ error: 'Unable to create account'}, { status: 409 })

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                name: name ?? null,
                surname: surname ?? null,
                email,
                passwordHash: hashedPassword,
                role: "PATIENT",
            },
            select: { 
                id: true, 
                email: true,
                name: true,
                surname: true,
                role: true,
            }
        })
        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Internal Server Error'}, { status: 500} )
    }
}