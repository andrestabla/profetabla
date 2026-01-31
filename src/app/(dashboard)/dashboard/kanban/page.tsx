import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Briefcase, LayoutGrid, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function KanbanPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const isTeacher = session.user.role === 'TEACHER' || session.user.role === 'ADMIN';

    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { students: { some: { id: session.user.id } } },
                { teachers: { some: { id: session.user.id } } }
            ],
            status: 'IN_PROGRESS'
        },
        orderBy: { updatedAt: 'desc' }
    });

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <Briefcase className="w-12 h-12 text-slate-300" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">No tienes tableros activos</h1>
                <p className="text-slate-500 max-w-md mb-8">Debes estar vinculado a un proyecto en progreso para gestionar tareas.</p>
                <Link
                    href="/dashboard/market"
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                >
                    Ir al Mercado de Retos
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Tableros Kanban</h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Selecciona un proyecto para gestionar sus tareas y avances.</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-bold">{projects.length} Proyectos Activos</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        href={isTeacher
                            ? `/dashboard/professor/projects/${project.id}/kanban`
                            : `/dashboard/student/projects/${project.id}/kanban`
                        }
                        className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-start relative overflow-hidden h-full"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-6 h-6 text-blue-600" />
                        </div>

                        <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <Briefcase className="w-6 h-6" />
                        </div>

                        <div className="space-y-3 flex-grow">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg">
                                    {project.type}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                                {project.title}
                            </h3>
                            <p className="text-slate-500 text-sm line-clamp-2">
                                {project.description || "Sin descripción proporcionada."}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50 w-full flex justify-between items-center bg-transparent">
                            <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                                GESTIONAR TABLERO
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
