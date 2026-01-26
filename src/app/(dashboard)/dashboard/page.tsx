import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProgressBar } from '@/components/ProgressBar';
import { TeamList } from '@/components/TeamList';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
    // Mock session: fetching first student
    // In real app: use getSession()
    const student = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        include: {
            projects: {
                include: {
                    tasks: true
                }
            }
        }
    });

    if (!student) return null;

    const project = student.projects[0];
    if (!project) return { student };

    // Calculate Tasks for HU-01
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
    const pendingTasks = project.tasks.filter(t => t.status === 'TODO').length;

    // Mock Teacher for HU-02 (Assume first teacher in DB for now as there is no direct Project->Teacher relation yet in seeded data effectively)
    // We'll fetch the first teacher to display as "Assigned Tutor"
    const teacher = await prisma.user.findFirst({
        where: { role: 'TEACHER' }
    });

    return {
        student,
        project,
        stats: { totalTasks, completedTasks, pendingTasks },
        teacher
    };
}

export default async function DashboardPage() {
    const data = await getDashboardData();

    if (!data || !data.project) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-800">No hay proyecto activo</h1>
                <p className="text-slate-500">Contacta a tu administrador para asignar uno.</p>
            </div>
        );
    }

    const { student, project, stats, teacher } = data;

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Hola, {student.name?.split(' ')[0]} 👋</h1>
                <p className="text-slate-500">Aquí tienes el resumen de tu avance hoy.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                {/* Columna Izquierda: Métricas Principales */}
                <div className="md:col-span-2 space-y-6">

                    {/* Card: Proyecto Activo (HU-01) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide">Proyecto Actual</span>
                                <h2 className="text-xl font-bold text-slate-800 mt-2">{project.title}</h2>
                                <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <ProgressBar total={stats.totalTasks} completed={stats.completedTasks} />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                            <h3 className="text-amber-800 font-medium mb-1">Pendientes</h3>
                            <p className="text-4xl font-bold text-amber-600">{stats.pendingTasks}</p>
                            <p className="text-xs text-amber-700/60 mt-2">Tareas por hacer</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                            <h3 className="text-emerald-800 font-medium mb-1">Completadas</h3>
                            <p className="text-4xl font-bold text-emerald-600">{stats.completedTasks}</p>
                            <p className="text-xs text-emerald-700/60 mt-2">Tareas finalizadas</p>
                        </div>
                    </div>

                </div>

                {/* Columna Derecha: Equipo y Accesos Rápidos (HU-02) */}
                <div className="space-y-6">
                    {/* Card: Mi Equipo */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-4">Mi Equipo & Tutor</h3>
                        <TeamList
                            studentName={student.name}
                            teacherName={teacher?.name || null}
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
