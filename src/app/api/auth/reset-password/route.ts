
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
        }

        if (new Date() > resetToken.expires) {
            await prisma.passwordResetToken.delete({ where: { token } });
            return NextResponse.json({ error: 'El token ha expirado.' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update User
        await prisma.user.update({
            where: { email: resetToken.identifier },
            data: {
                password: hashedPassword
            }
        });

        // Delete Token
        await prisma.passwordResetToken.delete({ where: { token } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Reset Password error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
