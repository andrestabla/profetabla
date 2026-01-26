'use client';

import Link from 'next/link';
import { AlertCircle, FileText, Users, Calendar, Plus, ChevronRight, CheckCircle2, LayoutDashboard, Target } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TeacherDashboardProps {
    user: any;
    stats: {
        blockedTasks: number;
        pendingReviews: number;
        mentorshipsToday: number;
    };
    pendingActions: {
        applications: any[];
        submissions: any[];
        tasksToApprove: any[];
    };
    todaySlots: any[];
}

export function TeacherDashboard({ user, stats, pendingActions, todaySlots }: TeacherDashboardProps) {
    const totalPending = pendingActions.applications.length + pendingActions.submissions.length + pendingActions.tasksToApprove.length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Panel Docente 👋</h1>
                    <p className="text-slate-500">Hola, {user.name}. Aquí están tus tareas prioritarias hoy.</p>
                </div>
                <Link href="/dashboard/professor/projects/new" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Nuevo Proyecto
                </Link>
            </header>

            {/* KPIs DE ATENCIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-800">{stats.blockedTasks}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Bloqueos Críticos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-800">{stats.pendingReviews}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Por Revisar</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-800">{stats.mentorshipsToday}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Mentorías Hoy</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FEED DE APROBACIONES */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-blue-500" /> Inbox de Acciones
                            </h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{totalPending}</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {pendingActions.applications.map(app => (
                                <Link key={app.id} href={`/dashboard/professor/projects/${app.projectId}/applications`} className="flex items-center p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">Nueva solicitud de {app.student.name}</p>
                                        <p className="text-xs text-slate-500">Para: {app.project.title}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </Link>
                            ))}

                            {pendingActions.submissions.map(sub => (
                                <Link key={sub.id} href={`/dashboard/professor/projects/${sub.assignment.projectId}`} className="flex items-center p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">Entregable pendiente de calificar</p>
                                        <p className="text-xs text-slate-500">{sub.fileName} - {sub.student.name}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </Link>
                            ))}

                            {pendingActions.tasksToApprove.map(task => (
                                <Link key={task.id} href={`/dashboard/professor/projects/${task.projectId}`} className="flex items-center p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mr-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <LayoutDashboard className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">Tarea completada requiere aprobación</p>
                                        <p className="text-xs text-slate-500">{task.title}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </Link>
                            ))}

                            {totalPending === 0 && (
                                <div className="p-12 text-center">
                                    <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 italic">No tienes acciones pendientes. ¡Estás al día!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CALENDARIO / SLOTS */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-300">
                                <Calendar className="w-5 h-5" /> Agenda de Hoy
                            </h3>
                            <div className="space-y-3 mb-6">
                                {todaySlots.length > 0 ? todaySlots.map(slot => (
                                    <div key={slot.id} className={`p-3 rounded-xl border ${slot.isBooked ? 'bg-blue-600/20 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                        <p className="text-xs font-bold text-slate-400 capitalize">{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="font-bold truncate">{slot.isBooked ? 'Slot Reservado' : 'Disponible'}</p>
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-sm italic">Sin slots para hoy.</p>
                                )}
                            </div>
                            <Link href="/dashboard/mentorship" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all">
                                Gestionar Horarios
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" /> Mis Proyectos
                        </h3>
                        <Link href="/dashboard/professor/projects" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                            Ver todos mis proyectos <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
