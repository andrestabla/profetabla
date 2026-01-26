import { prisma } from '@/lib/prisma';
import ProjectWorkspaceClient from './ProjectWorkspaceClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            student: {
                select: { name: true, avatarUrl: true }
            }
        }
    });

    if (!project) return notFound();

    const resources = await prisma.resource.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' }
    });

    return <ProjectWorkspaceClient project={project} resources={resources} />;
}
