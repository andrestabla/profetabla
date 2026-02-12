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

        // 1. Create User (Inactive / Unverified)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'STUDENT',
                isActive: true, // User is active, but email is not verified. 
                // We could set isActive: false if we want to block login completely, 
                // but usually we want to allow login but maybe restrict access or show "Verify Email" banner.
                // However, user requirement implied "Account Confirmation". 
                // Let's rely on emailVerified field check in auth.ts.
                emailVerified: null
            }
        });

        // 2. Create Verification Token
        const token = crypto.randomUUID();
        const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        });

        // 3. Send Email
        try {
            const { sendVerificationEmail } = await import('@/lib/email');
            await sendVerificationEmail(email, token);
        } catch (emailError) {
            console.error('Failed to send verification email, but continuing registration:', emailError);
        }

        // Log the activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'REGISTER',
                description: `New user registered (pending verification): ${email}`,
                level: 'INFO'
            }
        });

        return NextResponse.json({
            success: true,
            userId: user.id,
            message: 'Hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 500 });
    }
}
