'use client';

import Link from 'next/link';
import { ShieldCheck, Activity, Users, Database, ChevronRight, UserPlus, AlertTriangle, Server, Briefcase } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AdminDashboardProps {
    stats: {
        activeUsers: number;
        newProjectsThisWeek: number;
        systemHealth: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    };
    recentLogs: any[];
    recentUsers: any[];
}

export function AdminDashboard({ stats, recentLogs, recentUsers }: AdminDashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">Centro de Control Admin 🔐</h1>
                <p className="text-slate-500">Estado global de la plataforma Profe Tabla.</p>
            </header>

            {/* HEALTH CHECK BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${stats.systemHealth === 'HEALTHY' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Server className="w-4 h-4" /> Sistema: <span className={stats.systemHealth === 'HEALTHY' ? 'text-emerald-600' : 'text-red-600'}>{stats.systemHealth}</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Database className="w-4 h-4" /> DB Online
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Activity className="w-4 h-4" /> API stable
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-2">Usuarios Activos</p>
                        <h3 className="text-6xl font-bold mb-8">{stats.activeUsers}</h3>
                        <Link href="/dashboard/admin/users" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 w-fit">
                            <Users className="w-4 h-4" /> Gestionar Usuarios
                        </Link>
                    </div>
                    <Database className="absolute bottom-0 right-0 w-32 h-32 text-white/5 -mb-8 -mr-8" />
                </div>

                <div className="bg-emerald-600 border border-emerald-500 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-bold text-sm uppercase tracking-widest mb-2">Proyectos Globales</p>
                        <h3 className="text-6xl font-bold mb-8">{stats.newProjectsThisWeek}</h3>
                        <Link href="/dashboard/professor/projects" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 w-fit">
                            <Briefcase className="w-4 h-4" /> Ver Catálogo Proyectos
                        </Link>
                    </div>
                    <Briefcase className="absolute bottom-0 right-0 w-32 h-32 text-white/5 -mb-8 -mr-8" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LOGS MONITOR */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Registros Recientes
                        </h3>
                        <Link href="/dashboard/admin/logs" className="text-xs font-bold text-blue-600 flex items-center">
                            Ver Todos <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-4 flex-1">
                        {recentLogs.map(log => (
                            <div key={log.id} className="flex gap-4 items-start p-3 bg-slate-50 rounded-xl">
                                <span className={`p-2 rounded-lg ${log.level === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                                    {log.level === 'CRITICAL' ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{log.action}</p>
                                    <p className="text-[10px] text-slate-500">{log.description}</p>
                                </div>
                                <span className="ml-auto text-[10px] text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* USER MANAGEMENT SHORTCUT */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-emerald-600" /> Altas Recientes
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentUsers.map(user => (
                            <div key={user.id} className="py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs text-uppercase">
                                        {user.name?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                                        <p className="text-[10px] text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <Link href={`/dashboard/admin/users/${user.id}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
