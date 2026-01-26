import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProgressBar } from '@/components/ProgressBar';
import { TeamList } from '@/components/TeamList';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Search, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            projectsAsStudent: {
                where: { status: 'IN_PROGRESS' }, // Only active projects
                include: {
                    tasks: true,
                    teacher: true // Fetch the teacher assigned to the project
                }
            },
            // For teachers, we might want to show their projects? 
            // Phase 4 focus is Student Dashboard for now. 
            projectsAsTeacher: true
        }
    });

    if (!user) return null;

    // STUDENT VIEW
    if (user.role === 'STUDENT') {
        const project = user.projectsAsStudent[0]; // Get the first active project

        if (!project) return { user, project: null };

        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length;
        const pendingTasks = project.tasks.filter((t) => t.status === 'TODO').length;

        return {
            user,
            project,
            stats: { totalTasks, completedTasks, pendingTasks },
            teacher: project.teacher
        };
    }

    // TEACHER/ADMIN VIEW (Simple placeholder for now, redirect logic handles specifics usually)
    return { user, isTeacher: true };
}

export default async function DashboardPage() {
    const data = await getDashboardData();

    if (!data) return <div className="p-6">Inicia sesión para ver tu dashboard.</div>;

    // Teacher View Redirect or Simple Stats
    if (data.isTeacher) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-800">Panel de Profesor</h1>
                <p className="text-slate-500 mb-6">Gestiona tus proyectos y solicitudes desde el menú lateral.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/dashboard/professor/projects/create" className="p-6 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors">
                        <h3 className="font-bold text-blue-800">Crear Nuevo Proyecto</h3>
                        <p className="text-sm text-blue-600">Lanza un nuevo reto para tus estudiantes.</p>
                    </Link>
                    <Link href="/dashboard/professor/applications" className="p-6 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors">
                        <h3 className="font-bold text-orange-800">Revisar Solicitudes</h3>
                        <p className="text-sm text-orange-600">Acepta o rechaza estudiantes.</p>
                    </Link>
                </div>
            </div>
        );
    }

    const { user, project, stats, teacher } = data;

    // EMPTY STATE: Show Marketplace CTA
    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <Briefcase className="w-12 h-12 text-slate-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">No tienes un proyecto activo</h1>
                <p className="text-slate-500 max-w-md mb-8">Para comenzar tu aprendizaje, debes postularte a un proyecto disponible en el mercado.</p>

                <Link
                    href="/dashboard/student/marketplace"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                >
                    <Search className="w-5 h-5" />
                    Explorar Proyectos
                </Link>
            </div>
        );
    }

    const { totalTasks = 0, completedTasks = 0, pendingTasks = 0 } = stats || {};

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Hola, {user.name?.split(' ')[0]} 👋</h1>
                <p className="text-slate-500">Aquí tienes el resumen de tu proyecto actual.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                {/* Columna Izquierda: Métricas Principales */}
                <div className="md:col-span-2 space-y-6">

                    {/* Card: Proyecto Activo (HU-01) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide">
                                    {project.industry ? project.industry : 'Proyecto Actual'}
                                </span>
                                <h2 className="text-xl font-bold text-slate-800 mt-2">{project.title}</h2>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-2">{project.description}</p>
                                {project.objectives && (
                                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                        <strong>Objetivo:</strong> {project.objectives}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <ProgressBar total={totalTasks} completed={completedTasks} />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                            <h3 className="text-amber-800 font-medium mb-1">Pendientes</h3>
                            <p className="text-4xl font-bold text-amber-600">{pendingTasks}</p>
                            <p className="text-xs text-amber-700/60 mt-2">Tareas por hacer</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                            <h3 className="text-emerald-800 font-medium mb-1">Completadas</h3>
                            <p className="text-4xl font-bold text-emerald-600">{completedTasks}</p>
                            <p className="text-xs text-emerald-700/60 mt-2">Tareas finalizadas</p>
                        </div>
                    </div>

                </div>

                {/* Columna Derecha: Equipo y Accesos Rápidos (HU-02) */}
                <div className="space-y-6">
                    {/* Card: Mi Equipo */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-4">Mi Tutor</h3>
                        <TeamList
                            studentName={user.name}
                            teacherName={teacher?.name || 'Por asignar'}
                            teacherEmail={teacher?.email || ''}
                        />
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Continuar trabajando</h3>
                            <p className="text-slate-300 text-sm mb-4">Ve directamente a tu tablero de tareas.</p>
                            <Link href="/dashboard/kanban" className="inline-block bg-white text-slate-900 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors">
                                Ir al Kanban →
                            </Link>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
