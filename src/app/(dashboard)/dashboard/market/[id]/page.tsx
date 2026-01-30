import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import ProjectDetailClient from './ProjectDetailClient';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage(props: Props) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) redirect('/auth/login');

    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            teachers: {
                select: {
                    name: true,
                    avatarUrl: true,
                    email: true
                }
            },
            learningObjects: true,
            resources: true
        }
    });

    if (!project) notFound();

    // Check if current user has already applied
    const existingApplication = await prisma.projectApplication.findUnique({
        where: {
            projectId_studentId: {
                projectId: project.id,
                studentId: session.user.id
            }
        }
    });

    // Determine current status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
    const applicationStatus = existingApplication ? existingApplication.status : 'NONE';

    return <ProjectDetailClient project={project} initialStatus={applicationStatus} />;
}
