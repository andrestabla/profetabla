import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditProjectForm from './EditProjectForm';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) return notFound();

    return <EditProjectForm project={project} />;
}
