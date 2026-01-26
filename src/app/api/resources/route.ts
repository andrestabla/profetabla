import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // MVP: Assuming first student for interaction check. 
        // Real app: use session user id
        const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
        const userId = student?.id;

        const resources = await prisma.resource.findMany({
            include: {
                category: true,
                interactions: {
                    where: { userId: userId }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedResources = resources.map(r => ({
            ...r,
            isViewed: r.interactions[0]?.isViewed || false,
            isFavorite: r.interactions[0]?.isFavorite || false
        }));

        return NextResponse.json(formattedResources);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching resources' }, { status: 500 });
    }
}
