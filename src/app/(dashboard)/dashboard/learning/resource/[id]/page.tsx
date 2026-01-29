import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ResourceViewerClient from './ResourceViewerClient';

export default async function ResourceViewerPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return notFound();

    const resource = await prisma.resource.findUnique({
        where: { id: params.id },
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

    return <ResourceViewerClient resource={safeResource} />;
}
