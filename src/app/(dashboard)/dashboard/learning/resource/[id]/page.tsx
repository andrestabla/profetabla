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

    // Build a complete resource object for the client
    const safeResource = {
        ...resource,
        project: resource.project ? {
            title: resource.project.title,
            studentName: resource.project.student?.name
        } : {
            title: 'Recurso General',
            studentName: null
        }
    };

    return <ResourceViewerClient resource={safeResource} />;
}
