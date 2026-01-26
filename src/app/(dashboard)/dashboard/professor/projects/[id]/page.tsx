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
            },
            learningObjects: {
                include: { items: { take: 1 } }
            }
        }
    });

    if (!project) return notFound();

    const resources = await prisma.resource.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' }
    });

    const assignments = await prisma.assignment.findMany({
        where: { projectId: id },
        include: {
            submissions: {
                where: { studentId: project.studentId || undefined },
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { dueDate: 'asc' }
    });

    // Pass everything to the client component
    return <ProjectWorkspaceClient
        project={project}
        resources={resources}
        learningObjects={project.learningObjects}
        assignments={assignments}
    />;
}
