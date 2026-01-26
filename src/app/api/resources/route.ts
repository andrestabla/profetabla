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

        // Fetch Resources
        const resources = await prisma.resource.findMany({
            where: {
                OR: [
                    { projectId: projectId },
                    { projectId: null }
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

        // Fetch Learning Objects (OAs)
        // Teachers see ALL OAs they created or global ones
        // Students see OAs assigned to their project (future) or global ones
        // For now, let's show all global OAs + author's OAs if teacher
        const learningObjects = await prisma.learningObject.findMany({
            where: {
                // Simple logic: Show all OAs for now to verify they appear
                // In production we would filter by Project or Author
            },
            include: {
                author: true,
                items: { take: 1 } // preview first item
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedResources = [
            ...resources.map(r => ({
                id: r.id,
                title: r.title,
                description: r.description,
                url: r.url,
                type: r.type,
                isViewed: r.interactions[0]?.isCompleted || false,
                isFavorite: r.interactions[0]?.isFavorite || false,
                category: { name: r.category.name, color: r.category.color },
                isOA: false
            })),
            ...learningObjects.map(oa => ({
                id: oa.id,
                title: oa.title,
                description: oa.description,
                url: `/dashboard/learning/object/${oa.id}`, // Internal route for OAs
                type: 'COURSE', // Special type for frontend rendering
                isViewed: false, // Calculate based on items progress if needed
                isFavorite: false,
                category: { name: oa.subject, color: 'purple' }, // Use subject as category
                isOA: true
            }))
        ];

        return NextResponse.json(formattedResources);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching resources' }, { status: 500 });
    }
}
