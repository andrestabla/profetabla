
import { KanbanBoard } from '@/components/KanbanBoard';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ProfessorProjectKanbanPage(props: Props) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        redirect('/dashboard');
    }

    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: { student: true }
    });

    if (!project) {
        redirect('/dashboard/professor/projects');
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/professor/projects"
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        title="Volver a mis proyectos"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Tablero Kanban</h1>
                        <p className="text-slate-500">
                            Proyecto: <span className="font-bold text-slate-700">{project.title}</span>
                            {project.student ? (
                                <span className="ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-bold">
                                    Estudiante: {project.student.name}
                                </span>
                            ) : (
                                <span className="ml-2 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full text-xs font-bold italic">
                                    Sin estudiante
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <KanbanBoard projectId={project.id} />
        </div>
    );
}
