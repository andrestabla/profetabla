import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { resourceId, action, value } = body;
        // action: "FAVORITE" | "VIEW"

        // MVP: Mock user
        const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
        const userId = student?.id;

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Upsert interaction
        const interaction = await prisma.resourceInteraction.upsert({
            where: {
                userId_resourceId: {
                    userId,
                    resourceId
                }
            },
            update: {
                ...(action === 'FAVORITE' && { isFavorite: value }),
                ...(action === 'VIEW' && { isViewed: value })
            },
            create: {
                userId,
                resourceId,
                isFavorite: action === 'FAVORITE' ? value : false,
                isViewed: action === 'VIEW' ? value : false
            }
        });

        return NextResponse.json(interaction);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating interaction' }, { status: 500 });
    }
}
