import { KanbanBoard } from '@/components/KanbanBoard';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Briefcase, Search } from 'lucide-react';
import Link from 'next/link';

export default async function KanbanPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const project = await prisma.project.findFirst({
        where: { studentId: session.user.id, status: 'IN_PROGRESS' }
    });

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <Briefcase className="w-12 h-12 text-slate-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">No tienes un proyecto activo</h1>
                <p className="text-slate-500 max-w-md mb-8">Debes tener un proyecto en progreso para gestionar tareas.</p>
                <Link
                    href="/dashboard/market"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Ir al Mercado →
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Tablero Kanban</h1>
                    <p className="text-slate-500">Gestionando: <span className="text-slate-700 font-bold">{project.title}</span></p>
                </div>
            </div>

            <KanbanBoard projectId={project.id} />
        </div>
    );
}
