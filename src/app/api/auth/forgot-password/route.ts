
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Security: Always return success even if user doesn't exist (prevent enumeration)
        if (!user) {
            return NextResponse.json({ success: true, message: 'If account exists, email sent.' });
        }

        // Generate Token
        const token = crypto.randomUUID();
        const expires = new Date(new Date().getTime() + 1 * 60 * 60 * 1000); // 1 hour

        // Clean approach: delete old tokens for this email first to avoid clutter
        try {
            await prisma.passwordResetToken.deleteMany({ where: { identifier: email } });
        } catch {
            // Ignore if fails (e.g. table empty or whatever, though should be fine)
        }

        await prisma.passwordResetToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        });

        // Send Email
        const { sendPasswordResetEmail } = await import('@/lib/email');
        await sendPasswordResetEmail(email, token);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Forgot Password error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
