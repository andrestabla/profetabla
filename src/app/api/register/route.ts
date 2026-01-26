import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate Limit: 3 attempts per minute per IP
    const { success } = rateLimit.check(ip, 3);

    if (!success) {
        return NextResponse.json(
            { error: 'Demasiados intentos. Por favor, espera un minuto.' },
            { status: 429 }
        );
    }

    try {
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'STUDENT', // Default role for public signup
                isActive: true
            }
        });

        // Log the activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'REGISTER',
                description: `New user registered: ${email}`,
                level: 'INFO'
            }
        });

        return NextResponse.json({ success: true, userId: user.id });

    } catch {
        return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 500 });
    }
}
