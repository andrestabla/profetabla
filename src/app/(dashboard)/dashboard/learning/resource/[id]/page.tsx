import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ResourceViewerClient from './ResourceViewerClient';

export default async function ResourceViewerPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return notFound();

    const { id } = await params;

    const resource = await prisma.resource.findUnique({
        where: { id },
        include: {
            category: true,
            project: {
                select: {
                    title: true,
                    student: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    if (!resource) {
        return notFound();
    }

    // Build a complete resource object for the client with serialized dates
    const safeResource = {
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        presentation: resource.presentation,
        utility: resource.utility,
        categoryId: resource.categoryId,
        category: resource.category,
        project: resource.project ? {
            title: resource.project.title,
            studentName: resource.project.student?.name || null
        } : {
            title: 'Recurso General',
            studentName: null
        },
        createdAt: resource.createdAt.toISOString() // Serialize Date
    };

    const comments = await prisma.comment.findMany({
        where: { resourceId: id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    role: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const safeComments = comments.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString()
    }));

    return <ResourceViewerClient
        resource={safeResource}
        comments={safeComments}
        currentUserId={session?.user?.id || ''}
    />;
}
