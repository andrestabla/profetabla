'use client';

import Link from 'next/link';
import { ProgressBar } from '@/components/ProgressBar';
import { TeamList } from '@/components/TeamList';
import { UrgentCitationCard } from '@/components/UrgentCitationCard';
import { Briefcase, Search, Kanban, ChevronRight, Clock, Target } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface StudentDashboardProps {
    user: any;
    project: any;
    stats: any;
    teacher: any;
    citation: any;
    priorityTasks: any[];
    nextMentorship: any;
}

export function StudentDashboard({ user, project, stats, teacher, citation, priorityTasks, nextMentorship }: StudentDashboardProps) {
    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
                {citation && <div className="w-full max-w-2xl mb-8"><UrgentCitationCard citation={citation} /></div>}
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <Briefcase className="w-12 h-12 text-slate-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">No tienes un proyecto activo</h1>
                <p className="text-slate-500 max-w-md mb-8">Para comenzar tu aprendizaje, debes postularte a un proyecto disponible en el mercado.</p>
                <Link
                    href="/dashboard/projects/market"
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">Hola, {user.name?.split(' ')[0]} 👋</h1>
                <p className="text-slate-500">Aquí tienes el resumen de tu proyecto actual.</p>
            </header>

            {citation && <UrgentCitationCard citation={citation} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* MI PROYECTO ACTIVO (Hero) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Briefcase className="w-24 h-24" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                                    {project.industry || 'General'}
                                </span>
                                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${project.type === 'CHALLENGE' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                        project.type === 'PROBLEM' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    }`}>
                                    {project.type === 'CHALLENGE' ? 'Reto' :
                                        project.type === 'PROBLEM' ? 'Problema' :
                                            'Proyecto'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">{project.title}</h2>
                            <p className="text-slate-500 mb-8 line-clamp-2 max-w-2xl">{project.description}</p>

                            <ProgressBar total={totalTasks} completed={completedTasks} />

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link href="/dashboard/kanban" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all">
                                    <Kanban className="w-5 h-5" /> Ir al Kanban
                                </Link>
                                <Link href="/dashboard/learning" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                                    Recursos de Aprendizaje <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* TAREAS PRIORITARIAS */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-red-500" /> Tareas Prioritarias
                        </h3>
                        {priorityTasks.length > 0 ? (
                            <div className="space-y-3">
                                {priorityTasks.map(task => (
                                    <div key={task.id} className="flex items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer">
                                        <div className={`w-2 h-10 rounded-full mr-4 ${task.priority === 'HIGH' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 text-sm line-clamp-1">{task.title}</p>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter opacity-70">{task.status}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                ))}
                                <Link href="/dashboard/kanban" className="block text-center text-sm font-bold text-blue-600 hover:underline mt-4">
                                    Ver todas las tareas ({pendingTasks})
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-400 text-sm italic">No tienes tareas pendientes urgentes. 🎉</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA LATERAL */}
                <div className="space-y-6">
                    {/* WIDGET MENTORÍA */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-100">
                            <Clock className="w-5 h-5" /> Próxima Mentoría
                        </h3>
                        {nextMentorship ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-3xl font-bold">{new Date(nextMentorship.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-indigo-200 text-sm">{new Date(nextMentorship.slot.startTime).toLocaleDateString()}</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                                    <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Tutor</p>
                                    <p className="font-bold">{nextMentorship.slot.teacher.name}</p>
                                </div>
                                <Link href="/dashboard/mentorship" className="block w-full text-center bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors">
                                    Ver Detalles
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-indigo-100 text-sm mb-4">No tienes mentorías programadas.</p>
                                <Link href="/dashboard/mentorship" className="block w-full border border-white/30 text-white font-bold py-2 rounded-xl hover:bg-white/10 transition-colors text-sm">
                                    Reservar Cupo
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* MI EQUIPO */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Equipo Docente</h3>
                        <TeamList
                            studentName={user.name}
                            teacherName={teacher?.name || 'Por asignar'}
                            teacherEmail={teacher?.email || ''}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
