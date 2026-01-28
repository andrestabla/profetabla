import { ResourceList } from '@/components/ResourceList';
import { BookOpen, Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function LearningPage() {
    const session = await getServerSession(authOptions);
    const canCreate = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

    let contextTitle = '';

    // Logic for Student: Must have active project to see context
    if (session?.user?.role === 'STUDENT') {
        const activeProject = await prisma.project.findFirst({
            where: {
                studentId: session.user.id,
                status: 'IN_PROGRESS'
            }
        });

        if (!activeProject) {
            return (
                <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
                    <div className="bg-blue-50 p-6 rounded-full mb-6">
                        <BookOpen className="w-12 h-12 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Aprendizaje Contextual</h1>
                    <p className="text-slate-500 max-w-md mb-8">
                        El módulo de aprendizaje se activa cuando tienes un reto en curso.
                        Los recursos se adaptarán automáticamente a lo que necesites.
                    </p>
                    <Link
                        href="/dashboard/projects/market"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:scale-105"
                    >
                        Buscar un Reto
                    </Link>
                </div>
            );
        }
        contextTitle = activeProject.title;
    }

    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        Biblioteca de Aprendizaje
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {contextTitle
                            ? <span>Recursos seleccionados para: <strong className="text-blue-600">{contextTitle}</strong></span>
                            : "Recursos seleccionados, tutoriales y documentación."
                        }
                    </p>
                </div>

                {canCreate && (
                    <Link
                        href="/dashboard/learning/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" /> Nuevo OA
                    </Link>
                )}
            </div>

            <ResourceList />
        </div>
    );
}
