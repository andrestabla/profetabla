import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Plus, Users, Calendar, ArrowRight, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfessorProjectsPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        redirect('/dashboard');
    }

    const projects = await prisma.project.findMany({
        where: { teacherId: session.user.id },
        include: {
            student: true,
            _count: {
                select: { applications: true, tasks: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Mis Proyectos Pedagógicos</h1>
                    <p className="text-slate-500">Gestiona tus retos y el progreso de tus estudiantes.</p>
                </div>
                <Link
                    href="/dashboard/professor/projects/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nuevo Proyecto
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${project.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                        project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-700'
                                    }`}>
                                    {project.status === 'OPEN' ? 'Abierto' : project.status === 'IN_PROGRESS' ? 'En Curso' : 'Completado'}
                                </span>
                                {project.industry && (
                                    <span className="text-xs font-medium text-slate-400">
                                        {project.industry}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{project.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-6">{project.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Postulaciones</p>
                                    <p className="text-lg font-bold text-slate-800">{project._count.applications}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Tareas</p>
                                    <p className="text-lg font-bold text-slate-800">{project._count.tasks}</p>
                                </div>
                            </div>

                            {project.student ? (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                                        {project.student.name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-blue-800 truncate">{project.student.name}</p>
                                        <p className="text-[10px] text-blue-600">Estudiante Asignado</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 italic">Sin estudiante aún</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <Link
                                href={`/dashboard/professor/projects/${project.id}`}
                                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                                <Eye className="w-4 h-4" /> Gestionar
                            </Link>
                            <Link
                                href={`/dashboard/professor/projects/${project.id}/kanban`}
                                className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
                            >
                                Kanban <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Aún no has creado proyectos</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Comienza creando un reto pedagógico para que tus estudiantes puedan postularse.</p>
                        <Link
                            href="/dashboard/professor/projects/new"
                            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
                        >
                            Crear mi primer proyecto <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
