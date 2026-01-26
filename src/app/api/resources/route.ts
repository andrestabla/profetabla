import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(_request: Request) {
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
        // Teachers see ALL OAs to curate
        // Students see OAs assigned to their project (HU-06)
        const learningObjects = await prisma.learningObject.findMany({
            where: {
                ...(session.user.role === 'STUDENT' ? {
                    projects: {
                        some: { id: projectId || 'non-existent' }
                    }
                } : {})
            },
            include: {
                author: true,
                items: { take: 1 } // preview first item
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedResources = [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...resources.map((r: any) => ({
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...learningObjects.map((oa: any) => ({
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
    } catch {
        return NextResponse.json({ error: 'Error fetching resources' }, { status: 500 });
    }
}
