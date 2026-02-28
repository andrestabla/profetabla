import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { resourceId, action, value } = body;
        // action: "FAVORITE" | "VIEW"

        if (!resourceId || !action) {
            return NextResponse.json({ error: 'resourceId y action son requeridos' }, { status: 400 });
        }

        const userId = session.user.id;

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
                ...(action === 'VIEW' && { isCompleted: value })
            },
            create: {
                userId,
                resourceId,
                isFavorite: action === 'FAVORITE' ? value : false,
                isCompleted: action === 'VIEW' ? value : false
            }
        });

        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
            select: { title: true, projectId: true }
        });

        const actionName = action === 'FAVORITE' ? 'RESOURCE_FAVORITE' : 'RESOURCE_VIEW';
        const description = action === 'FAVORITE'
            ? `${value ? 'Marcó como favorito' : 'Quitó de favoritos'} el recurso "${resource?.title || resourceId}"`
            : `Visualizó el recurso "${resource?.title || resourceId}"`;

        await logActivity(userId, actionName, description, 'INFO', {
            resourceId,
            resourceTitle: resource?.title || null,
            projectId: resource?.projectId || null,
            value,
        });

        return NextResponse.json(interaction);
    } catch (error) {
        console.error('[resources/interact] error:', error);
        return NextResponse.json({ error: 'Error updating interaction' }, { status: 500 });
    }
}
