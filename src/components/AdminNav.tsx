'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, Terminal, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminNav() {
    const pathname = usePathname();

    const tabs = [
        { name: 'Gestión de Usuarios', href: '/dashboard/admin/users', icon: Users },
        { name: 'Integraciones y APIs', href: '/dashboard/admin/integrations', icon: Database },
        { name: 'Logs del Sistema', href: '/dashboard/admin/logs', icon: Terminal },
    ];

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    return (
        <div className="mb-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-8 h-8 text-slate-900" /> Panel de Administración
                </h1>
                <p className="text-slate-500">Gestión global de usuarios, integraciones y sistema.</p>
            </header>

            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
                {tabs.map((tab) => {
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap",
                                active
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
