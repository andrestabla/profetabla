import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await context.params;
        const { searchParams } = new URL(request.url);
        const takeParam = Number(searchParams.get('take') || '200');
        const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 500) : 200;

        const isOwnUser = session.user.id === userId;
        const isAdmin = session.user.role === 'ADMIN';
        if (!isOwnUser && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const logs = await prisma.activityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('[activity/user] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

