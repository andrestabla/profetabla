import { prisma } from '@/lib/prisma';
import ProjectApplicationsClient from './ProjectApplicationsClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        select: { title: true }
    });

    if (!project) return notFound();

    const applications = await prisma.projectApplication.findMany({
        where: {
            projectId: id,
            status: 'PENDING'
        },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <ProjectApplicationsClient
            projectTitle={project.title}
            projectId={id}
            applications={applications}
        />
    );
}
