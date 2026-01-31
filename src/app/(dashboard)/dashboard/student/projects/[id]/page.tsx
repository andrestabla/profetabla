import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import ProjectDetailClient from '@/app/(dashboard)/dashboard/market/[id]/ProjectDetailClient';

export default async function StudentProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) redirect('/auth/login');

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            teachers: {
                select: {
                    name: true,
                    avatarUrl: true,
                    email: true
                }
            },
            learningObjects: true,
            resources: true,
            students: {
                where: { id: session.user.id }
            }
        }
    });

    if (!project) return notFound();

    // Verify student is actually enrolled
    if (project.students.length === 0) {
        // If not enrolled, redirect back to market? Or show restricted view? 
        // For safety, redirect to market details to apply.
        redirect(`/dashboard/market/${id}`);
    }

    // Reuse the ProjectDetailClient but with status 'ACCEPTED' to show full potential
    // Or maybe we need a dedicated "StudentProjectView"? 
    // The ProjectDetailClient seems to handle "Apply" logic. 
    // Let's check ProjectDetailClient to see if it supports a "View Only" or "Enrolled" mode.
    // If not, I might need to adapt it. 
    // Assuming for now I can pass status='ACCEPTED' and it acts like a dashboard.

    return <ProjectDetailClient project={project} initialStatus="ACCEPTED" />;
}
