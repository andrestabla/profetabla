'use client';

import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    LogOut,
    GraduationCap,
    Briefcase,
    Calendar,
    Plus,
    Trophy,
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    Menu,
    UserCheck,
    FileText,
    Kanban,
    Terminal,
    Database
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Sidebar({ config }: { config?: any }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role;
    const [isCollapsed, setIsCollapsed] = useState(false);

    const logo = config?.logoUrl;
    const title = config?.institutionName || 'Profe Tabla';

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    const navItems = [
        { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard, roles: ['STUDENT'] },
        { name: 'Kanban', href: '/dashboard/kanban', icon: Kanban, roles: ['STUDENT'] },
        { name: 'Entregas', href: '/dashboard/assignments', icon: FileText, roles: ['STUDENT'] },
        { name: 'Aprendizaje', href: '/dashboard/learning', icon: GraduationCap, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
        { name: 'Mentorías', href: '/dashboard/mentorship', icon: Calendar, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
        { name: 'Proyectos', href: '/dashboard/projects/market', icon: ShoppingBag, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
    ];

    const adminItems = [
        { name: 'Panel Profesor', href: '/dashboard/professor', icon: LayoutDashboard, roles: ['TEACHER', 'ADMIN'] },
        { name: 'Gestión Proyectos', href: '/dashboard/professor/projects', icon: Briefcase, roles: ['TEACHER', 'ADMIN'] },
        { name: 'Crear Proyecto', href: '/dashboard/professor/projects/new', icon: Plus, roles: ['TEACHER', 'ADMIN'] },
        { name: 'Solicitudes', href: '/dashboard/professor/applications', icon: UserCheck, roles: ['TEACHER', 'ADMIN'] },
        // Admin Group
        { name: 'Administración', href: '/dashboard/admin', icon: Settings, roles: ['ADMIN'] },
    ];

    // Combine and filter
    const allItems = [
        { section: 'Principal', items: navItems },
        { section: 'Gestión', items: adminItems }
    ];

    return (
        <aside className={cn(
            "bg-[#0F172A] text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 h-screen sticky top-0",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                {!isCollapsed && (
                    logo ? (
                        <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logo} alt={title} className="h-8 w-auto object-contain" />
                            {/* Optional: if logo has text, hide title. For now show both if complex or just logo. Let's assume just logo replaces text if present */}
                        </div>
                    ) : (
                        <h1 className="text-2xl font-bold text-primary truncate" title={title}>
                            {title}
                        </h1>
                    )
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-auto"
                >
                    {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* Profile Summary if NOT collapsed */}
            {!isCollapsed && session?.user && (
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border-2 border-slate-600">
                            {session.user.image ? <img src={session.user.image} className="w-full h-full rounded-full" /> : session.user.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{session.user.name}</p>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/20 px-2 py-0.5 rounded-full w-fit">
                                {role}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapsed Avatar Only */}
            {isCollapsed && session?.user && (
                <div className="p-4 border-b border-slate-800 flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border-2 border-slate-600" title={session.user.name || ''}>
                        {session.user.image ? <img src={session.user.image} className="w-full h-full rounded-full" /> : session.user.name?.[0]}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
                {allItems.map((section, idx) => {
                    // Filter items logic roughly based on roles
                    // For brevity, just mapping everything but we should respect role checks
                    const visibleItems = section.items.filter(item => {
                        if (!role) return false;
                        return item.roles.includes(role);
                    });

                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx}>
                            {!isCollapsed && (
                                <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    {section.section}
                                </h3>
                            )}
                            <ul className="space-y-1">
                                {visibleItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                                                    active
                                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                        : "hover:bg-slate-800 hover:text-white text-slate-400"
                                                )}
                                                title={isCollapsed ? item.name : undefined}
                                            >
                                                <item.icon className={cn("w-5 h-5 flex-shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                                {!isCollapsed && <span>{item.name}</span>}

                                                {/* Active Indicator for Collapsed Mode */}
                                                {isCollapsed && active && (
                                                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-lg" />
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 space-y-2">
                <Link
                    href="/dashboard/profile"
                    className={cn(
                        "flex items-center gap-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-primary hover:bg-slate-800 transition-all",
                        isCollapsed ? "justify-center p-3" : "px-4 py-3"
                    )}
                    title="Mi Perfil"
                >
                    <Users className="w-5 h-5" />
                    {!isCollapsed && <span>Mi Perfil</span>}
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className={cn(
                        "flex items-center gap-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all",
                        isCollapsed ? "justify-center p-3" : "px-4 py-3"
                    )}
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}
