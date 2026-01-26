'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Kanban, GraduationCap, Calendar, Settings, LogOut, FileText, Search, Plus, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
    { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Kanban', href: '/dashboard/kanban', icon: Kanban },
    { name: 'Entregas', href: '/dashboard/assignments', icon: FileText },
    { name: 'Aprendizaje', href: '/dashboard/learning', icon: GraduationCap },
    { name: 'Mentorías', href: '/dashboard/mentorship', icon: Calendar },
    { name: 'Mercado Proyectos', href: '/dashboard/student/marketplace', icon: Search }, // New
];

const adminItems = [
    { name: 'Panel Profesor', href: '/dashboard/professor', icon: LayoutDashboard },
    { name: 'Crear Proyecto', href: '/dashboard/professor/projects/new', icon: Plus }, // New
    { name: 'Solicitudes', href: '/dashboard/professor/applications', icon: UserCheck }, // New
    { name: 'Panel Admin', href: '/dashboard/admin', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Profe Tabla
                </h1>
                {session?.user ? (
                    <div className="flex items-center gap-3 mt-4 bg-slate-800/50 p-2 rounded-lg">
                        {session.user.image ? (
                            <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-600" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                                {session.user.name?.charAt(0)}
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate w-[130px]">{session.user.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{session.user.role}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 mt-1">Gestión Educativa</p>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                <div className="pt-4 mt-4 border-t border-slate-800">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vistas Rol</p>
                    {adminItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                                    isActive
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
