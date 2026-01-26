'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import { Users, Folder, BookOpen, FileText, Loader2, Gauge } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/admin')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                    <Gauge className="w-8 h-8 text-indigo-600" />
                    Panel de Administración
                </h1>
                <p className="text-slate-500">Estado global de la plataforma e indicadores de rendimiento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Usuarios Totales" value={stats.users} icon={Users} color="bg-blue-500" />
                <StatCard title="Proyectos Activos" value={stats.projects} icon={Folder} color="bg-green-500" />
                <StatCard title="Recursos Educativos" value={stats.resources} icon={BookOpen} color="bg-purple-500" />
                <StatCard title="Entregas Recibidas" value={stats.submissions} icon={FileText} color="bg-orange-500" />
            </div>

            {/* Placeholder for future charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-60 pointer-events-none">
                <div className="bg-white p-6 rounded-xl border border-slate-200 h-64 flex items-center justify-center text-slate-400">
                    Gráfico de Adopción (Próximamente)
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 h-64 flex items-center justify-center text-slate-400">
                    Actividad por Roles (Próximamente)
                </div>
            </div>
        </div>
    );
}
