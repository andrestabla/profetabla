
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token faltante' }, { status: 400 });
        }

        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!verificationToken) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
        }

        if (new Date() > verificationToken.expires) {
            await prisma.verificationToken.delete({ where: { token } }); // Cleanup
            return NextResponse.json({ error: 'El token ha expirado. Por favor solicita uno nuevo.' }, { status: 400 });
        }

        // Verify User
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: {
                emailVerified: new Date(),
                isActive: true
            }
        });

        // Delete Token
        await prisma.verificationToken.delete({ where: { token } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
