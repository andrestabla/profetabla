import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Find active project for this user (only if student)
        let projectId = null;
        if (session.user.role === 'STUDENT') {
            const activeProject = await prisma.project.findFirst({
                where: {
                    studentId: userId,
                    status: 'IN_PROGRESS'
                }
            });
            projectId = activeProject?.id;
        }

        // Fetch resources linked to this project OR global (projectId is null)
        const resources = await prisma.resource.findMany({
            where: {
                OR: [
                    { projectId: projectId }, // Contextual resources
                    { projectId: null }       // Global resources
                ]
            },
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
            isViewed: r.interactions[0]?.isCompleted || false, // Mapping 'isCompleted' to frontend 'isViewed' concept if needed, or update DB schema field name match
            isFavorite: r.interactions[0]?.isFavorite || false
        }));

        return NextResponse.json(formattedResources);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching resources' }, { status: 500 });
    }
}
