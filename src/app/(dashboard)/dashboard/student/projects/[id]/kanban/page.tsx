import { KanbanBoard } from '@/components/KanbanBoard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function StudentKanbanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) redirect('/auth/login');

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            students: { where: { id: session.user.id } }
        }
    });

    if (!project) return notFound();
    if (project.students.length === 0) redirect('/dashboard');

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-4rem)] max-w-[1920px] mx-auto">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tablero Kanban</h1>
                    <p className="text-slate-500 text-sm">Gestiona tus tareas y el progreso del proyecto</p>
                </div>
            </header>

            <div className="h-[calc(100%-5rem)]">
                <KanbanBoard projectId={project.id} />
            </div>
        </div>
    );
}
