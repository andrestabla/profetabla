import { prisma } from '@/lib/prisma';
import ProjectWorkspaceClient from './ProjectWorkspaceClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                industry: true,
                justification: true,
                objectives: true,
                methodology: true,
                resourcesDescription: true,
                schedule: true,
                budget: true,
                evaluation: true,
                kpis: true,
                googleDriveFolderId: true,
                studentId: true,
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
                    where: project.studentId ? { studentId: project.studentId } : { studentId: 'NONE' },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        return <ProjectWorkspaceClient
            project={project as any}
            resources={resources}
            learningObjects={project.learningObjects}
            assignments={assignments}
        />;
    } catch (error: any) {
        console.error("Render error in Project Page:", error);
        return (
            <div className="p-10 bg-red-50 text-red-700 rounded-xl border border-red-200 m-10">
                <h1 className="text-xl font-bold mb-4">Error de Renderizado (Debug)</h1>
                <p className="font-mono text-sm bg-white p-4 rounded border whitespace-pre-wrap">
                    {error.message}
                    {"\n\n"}
                    {error.stack}
                </p>
            </div>
        );
    }
}
