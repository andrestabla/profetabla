import { ResourceList } from '@/components/ResourceList';
import { BookOpen, Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function LearningPage() {
    const session = await getServerSession(authOptions);
    const canCreate = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN';

    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        Biblioteca de Aprendizaje
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Recursos seleccionados, tutoriales y documentación para potenciar tu proyecto.
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
